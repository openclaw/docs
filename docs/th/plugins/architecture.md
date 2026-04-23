---
read_when:
    - การสร้างหรือการแก้ไขข้อบกพร่องของ Plugin เนทีฟของ OpenClaw
    - การทำความเข้าใจโมเดล capability ของ Plugin หรือขอบเขต ownership
    - การทำงานกับไปป์ไลน์การโหลดหรือรีจิสทรีของ Plugin
    - การติดตั้งใช้งาน hook รันไทม์ของผู้ให้บริการหรือ Plugin ช่อง
sidebarTitle: Internals
summary: 'รายละเอียดภายในของ Plugin: โมเดล capability, ownership, สัญญา, ไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: รายละเอียดภายในของ Plugin
x-i18n:
    generated_at: "2026-04-23T10:19:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# รายละเอียดภายในของ Plugin

<Info>
  นี่คือ **เอกสารอ้างอิงสถาปัตยกรรมเชิงลึก** สำหรับคู่มือเชิงปฏิบัติ ดูได้ที่:
  - [ติดตั้งและใช้ plugins](/th/tools/plugin) — คู่มือผู้ใช้
  - [เริ่มต้นใช้งาน](/th/plugins/building-plugins) — บทเรียน Plugin แรก
  - [Channel Plugins](/th/plugins/sdk-channel-plugins) — สร้างช่องข้อความ
  - [Provider Plugins](/th/plugins/sdk-provider-plugins) — สร้างผู้ให้บริการโมเดล
  - [ภาพรวม SDK](/th/plugins/sdk-overview) — import map และ API การลงทะเบียน
</Info>

หน้านี้ครอบคลุมสถาปัตยกรรมภายในของระบบ Plugin ของ OpenClaw

## โมเดล capability สาธารณะ

Capability คือโมเดล **native plugin** สาธารณะภายใน OpenClaw ทุก
native Plugin ของ OpenClaw จะลงทะเบียนกับ capability อย่างน้อยหนึ่งประเภท:

| Capability             | วิธีลงทะเบียน                              | ตัวอย่าง Plugin                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| การอนุมานข้อความ         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| แบ็กเอนด์การอนุมานของ CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| เสียงพูด                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| การทำความเข้าใจมีเดีย    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| การดึงข้อมูลเว็บ              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | `google`                             |
| ช่อง / การรับส่งข้อความ    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin ที่ลงทะเบียน capability เป็นศูนย์แต่มี hooks, tools หรือ
services คือ Plugin แบบ **legacy hook-only** รูปแบบนั้นยังคงรองรับอย่างสมบูรณ์

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดล capability ถูกนำเข้ามาใน core แล้วและใช้งานโดย bundled/native plugins
ในปัจจุบัน แต่ความเข้ากันได้ของ plugin ภายนอกยังต้องมีเกณฑ์ที่เข้มงวดยิ่งกว่าแค่ “มีการ export ออกมา จึงถือว่าคงที่”

แนวทางปัจจุบัน:

- **external plugins ที่มีอยู่แล้ว:** ต้องให้ integration แบบ hook-based ใช้งานต่อได้; ถือว่านี่คือ baseline ด้านความเข้ากันได้
- **bundled/native plugins ใหม่:** ควรใช้การลงทะเบียน capability แบบชัดเจน แทนการเจาะเข้าถึงแบบ vendor-specific หรือการออกแบบ hook-only ใหม่
- **external plugins ที่นำการลงทะเบียน capability มาใช้:** อนุญาตได้ แต่ให้ถือว่าพื้นผิวตัวช่วยเฉพาะ capability ยังเปลี่ยนแปลงได้ เว้นแต่เอกสารจะระบุชัดว่าสัญญานั้นคงที่

กฎเชิงปฏิบัติ:

- API การลงทะเบียน capability คือทิศทางที่ตั้งใจไว้
- legacy hooks ยังคงเป็นเส้นทางที่ปลอดภัยที่สุดและไม่ทำให้ external plugins พังระหว่างช่วงเปลี่ยนผ่าน
- subpath ของ helper ที่ export ออกมาไม่ได้เท่ากันทั้งหมด; ให้เลือกใช้สัญญาแคบ ๆ ที่มีเอกสารรองรับ ไม่ใช่ helper export ที่มีโดยบังเอิญ

### รูปแบบของ Plugin

OpenClaw จัดประเภท Plugin ที่โหลดแล้วทุกตัวเป็นรูปแบบหนึ่งตามพฤติกรรมการลงทะเบียนจริง
(ไม่ใช่แค่จาก metadata แบบคงที่):

- **plain-capability** -- ลงทะเบียน capability เพียงประเภทเดียว (เช่น
  provider-only Plugin อย่าง `mistral`)
- **hybrid-capability** -- ลงทะเบียนหลายประเภท capability (เช่น
  `openai` เป็นเจ้าของทั้ง text inference, speech, media understanding และ image
  generation)
- **hook-only** -- ลงทะเบียนเฉพาะ hooks (แบบมีชนิดหรือ custom) ไม่มี capabilities,
  tools, commands หรือ services
- **non-capability** -- ลงทะเบียน tools, commands, services หรือ routes แต่ไม่มี
  capabilities

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบและรายละเอียดการแจกแจง capability
ของ Plugin ดูรายละเอียดได้ที่ [เอกสารอ้างอิง CLI](/th/cli/plugins#inspect)

### Legacy hooks

hook `before_agent_start` ยังคงรองรับในฐานะเส้นทางความเข้ากันได้สำหรับ
hook-only plugins Plugin จริงแบบ legacy ยังคงพึ่งพามันอยู่

ทิศทาง:

- ทำให้ยังใช้งานได้ต่อ
- บันทึกเอกสารว่ามันเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override model/provider
- ควรใช้ `before_prompt_build` สำหรับงานแก้ไข prompt
- เอาออกก็ต่อเมื่อการใช้งานจริงลดลงและ fixture coverage พิสูจน์ความปลอดภัยของการย้ายได้แล้วเท่านั้น

### สัญญาณด้านความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>`, คุณอาจเห็น
ป้ายกำกับอย่างใดอย่างหนึ่งต่อไปนี้:

| Signal                     | ความหมาย                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | คอนฟิก parse ได้ถูกต้องและ plugins resolve ได้                       |
| **compatibility advisory** | Plugin ใช้รูปแบบที่ยังรองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**         | Plugin ใช้ `before_agent_start` ซึ่งเลิกใช้แล้ว        |
| **hard error**             | คอนฟิกไม่ถูกต้องหรือ Plugin โหลดไม่สำเร็จ                   |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ Plugin ของคุณพังในวันนี้ --
`hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะทำให้เกิดแค่คำเตือนเท่านั้น สัญญาณเหล่านี้
ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ Plugin ของ OpenClaw มี 4 ชั้น:

1. **Manifest + discovery**
   OpenClaw ค้นหา candidate plugins จาก path ที่กำหนดค่าไว้, workspace roots,
   global plugin roots และ bundled plugins การค้นหาจะอ่าน
   manifest แบบ native `openclaw.plugin.json` และ manifest ของ bundle ที่รองรับก่อน
2. **Enablement + validation**
   Core ตัดสินว่า Plugin ที่ค้นพบแล้วตัวใดถูกเปิดใช้ ปิดใช้ บล็อกไว้ หรือ
   ถูกเลือกสำหรับ slot แบบ exclusive เช่น memory
3. **Runtime loading**
   native Plugins ของ OpenClaw จะถูกโหลดใน process ผ่าน jiti และลงทะเบียน
   capabilities ลงใน registry กลาง ส่วน bundle ที่เข้ากันได้จะถูก normalize เป็น
   registry records โดยไม่ต้อง import runtime code
4. **Surface consumption**
   ส่วนที่เหลือของ OpenClaw จะอ่าน registry เพื่อเปิดเผย tools, channels, provider
   setup, hooks, HTTP routes, CLI commands และ services

สำหรับ plugin CLI โดยเฉพาะ การค้นหา root command ถูกแยกเป็นสองระยะ:

- metadata ตอน parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI จริงของ plugin สามารถคงแบบ lazy และค่อยลงทะเบียนเมื่อถูกเรียกใช้ครั้งแรก

วิธีนี้ทำให้โค้ด CLI ที่เป็นเจ้าของโดย plugin อยู่ภายใน plugin ได้ ขณะเดียวกันก็ยังให้ OpenClaw
จองชื่อ root command ได้ก่อน parse

ขอบเขตการออกแบบที่สำคัญคือ:

- discovery + config validation ควรทำงานจาก **metadata ของ manifest/schema**
  โดยไม่ต้องรันโค้ดของ plugin
- พฤติกรรม runtime แบบ native มาจากเส้นทาง `register(api)` ของโมดูล plugin

การแยกเช่นนี้ทำให้ OpenClaw ตรวจสอบคอนฟิก อธิบาย plugin ที่หายไป/ถูกปิดใช้ และ
สร้างคำใบ้สำหรับ UI/schema ได้ก่อนที่ runtime เต็มรูปแบบจะทำงาน

### Channel Plugins และ message tool ที่ใช้ร่วมกัน

Channel Plugins ไม่จำเป็นต้องลงทะเบียน tool แยกสำหรับ send/edit/react เพื่อทำงานแชตปกติ OpenClaw
คง `message` tool แบบใช้ร่วมกันเพียงตัวเดียวไว้ใน core และ channel plugins เป็นเจ้าของ
ส่วนการค้นหาและการรันที่เฉพาะกับช่องซึ่งอยู่เบื้องหลังมัน

ขอบเขตปัจจุบันคือ:

- core เป็นเจ้าของ host ของ `message` tool ที่ใช้ร่วมกัน, prompt wiring, การจัดการ session/thread
  bookkeeping และ execution dispatch
- channel plugins เป็นเจ้าของการค้นหา action แบบมีขอบเขต, การค้นหา capability และ
  schema fragments ที่เฉพาะกับช่อง
- channel plugins เป็นเจ้าของไวยากรณ์ session conversation ที่เฉพาะกับผู้ให้บริการ เช่น
  วิธีที่ conversation ids เข้ารหัส thread ids หรือสืบทอดจาก parent conversations
- channel plugins รัน action ขั้นสุดท้ายผ่าน action adapter ของตน

สำหรับ channel plugins, พื้นผิว SDK คือ
`ChannelMessageActionAdapter.describeMessageTool(...)` การค้นหาแบบรวมนี้
ทำให้ plugin คืนค่าทั้ง visible actions, capabilities และ schema
contributions พร้อมกันได้ เพื่อไม่ให้ส่วนเหล่านี้คลาดเคลื่อนจากกัน

เมื่อพารามิเตอร์ของ message-tool ที่เฉพาะกับช่องมีแหล่งมีเดีย เช่น
local path หรือ remote media URL, plugin ควรคืนค่า
`mediaSourceParams` จาก `describeMessageTool(...)` ด้วย Core ใช้รายการที่ระบุชัดนี้
เพื่อทำ sandbox path normalization และ outbound media-access hints โดยไม่ต้อง hardcode ชื่อพารามิเตอร์ของ plugin
ควรใช้แผนที่แบบ action-scoped ตรงนั้น ไม่ใช่ flat list แบบทั้งช่อง
เพื่อไม่ให้พารามิเตอร์มีเดียที่ใช้เฉพาะกับ profile ถูก normalize กับ actions ที่ไม่เกี่ยวข้องอย่าง
`send`

Core ส่ง runtime scope เข้าไปในขั้นตอน discovery นั้น ฟิลด์สำคัญได้แก่:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ขาเข้าที่เชื่อถือได้

สิ่งนี้สำคัญสำหรับ plugins ที่ไวต่อบริบท ช่องหนึ่งสามารถซ่อนหรือเปิดเผย
message actions ตาม active account, room/thread/message ปัจจุบัน หรือ
trusted requester identity โดยไม่ต้อง hardcode สาขาเฉพาะช่องใน `message` tool ของ core

นี่คือเหตุผลว่าทำไมการเปลี่ยนแปลง routing ของ embedded-runner ยังเป็นงานของ plugin: ตัว runner
มีหน้าที่ส่งต่อ current chat/session identity ไปยังขอบเขต discovery ของ plugin เพื่อให้ `message` tool
ที่ใช้ร่วมกันเปิดเผยพื้นผิวที่เป็นเจ้าของโดยช่องได้ถูกต้องสำหรับรอบปัจจุบัน

สำหรับ execution helpers ที่เป็นเจ้าของโดยช่อง bundled plugins ควรเก็บ execution
runtime ไว้ในโมดูล extension ของตัวเอง Core ไม่ได้เป็นเจ้าของ runtime ของ message-action สำหรับ
Discord, Slack, Telegram หรือ WhatsApp ภายใต้ `src/agents/tools` อีกต่อไป
เราไม่ได้เผยแพร่ subpaths `plugin-sdk/*-action-runtime` แยกต่างหาก และ bundled
plugins ควร import runtime code ภายในของตัวเองโดยตรงจาก
โมดูลที่ extension เป็นเจ้าของ

ขอบเขตเดียวกันนี้ใช้กับ SDK seams ที่ตั้งชื่อตาม provider โดยทั่วไปด้วย:
core ไม่ควร import convenience barrels ที่เฉพาะกับช่องสำหรับ Slack, Discord, Signal,
WhatsApp หรือ extensions ที่คล้ายกัน หาก core ต้องการพฤติกรรมใด ให้ใช้
`api.ts` / `runtime-api.ts` barrel ของ bundled plugin เอง หรือยกระดับความต้องการนั้น
ให้กลายเป็น generic capability แบบแคบใน SDK ที่ใช้ร่วมกัน

สำหรับ polls โดยเฉพาะ มีสองเส้นทางการรัน:

- `outbound.sendPoll` คือ baseline ที่ใช้ร่วมกันสำหรับช่องที่เข้ากับ
  โมเดล poll ทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่ควรใช้สำหรับ semantics ของ poll ที่เฉพาะกับช่อง หรือพารามิเตอร์ poll เพิ่มเติม

ตอนนี้ core จะเลื่อนการ parse poll ที่ใช้ร่วมกันออกไปจนกว่า plugin poll dispatch จะปฏิเสธ
action ก่อน เพื่อให้ตัวจัดการ poll ที่ plugin เป็นเจ้าของสามารถรับฟิลด์ poll ที่เฉพาะกับช่องได้โดยไม่ถูก generic poll parser บล็อกเสียก่อน

ดู [ไปป์ไลน์การโหลด](#load-pipeline) สำหรับลำดับการเริ่มต้นระบบทั้งหมด

## โมเดล ownership ของ capability

OpenClaw มอง native Plugin ว่าเป็นขอบเขต ownership สำหรับ **บริษัท**
หรือ **ฟีเจอร์** ไม่ใช่เป็นถุงรวม integration ที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- company plugin โดยทั่วไปควรเป็นเจ้าของพื้นผิวที่เกี่ยวกับ OpenClaw ทั้งหมดของบริษัทนั้น
- feature plugin โดยทั่วไปควรเป็นเจ้าของพื้นผิวของฟีเจอร์ทั้งหมดที่มันนำเข้ามา
- channels ควรใช้ capabilities ส่วนกลางของ core แทนการทำพฤติกรรมของ provider ขึ้นใหม่แบบ ad hoc

ตัวอย่าง:

- Plugin `openai` ที่รวมมาให้เป็นเจ้าของพฤติกรรม model-provider ของ OpenAI และพฤติกรรม OpenAI
  ด้าน speech + realtime-voice + media-understanding + image-generation
- Plugin `elevenlabs` ที่รวมมาให้เป็นเจ้าของพฤติกรรม speech ของ ElevenLabs
- Plugin `microsoft` ที่รวมมาให้เป็นเจ้าของพฤติกรรม speech ของ Microsoft
- Plugin `google` ที่รวมมาให้เป็นเจ้าของพฤติกรรม model-provider ของ Google รวมถึงพฤติกรรม
  media-understanding + image-generation + web-search ของ Google
- Plugin `firecrawl` ที่รวมมาให้เป็นเจ้าของพฤติกรรม web-fetch ของ Firecrawl
- Plugins `minimax`, `mistral`, `moonshot` และ `zai` ที่รวมมาให้เป็นเจ้าของ
  แบ็กเอนด์ media-understanding ของตน
- Plugin `qwen` ที่รวมมาให้เป็นเจ้าของพฤติกรรม text-provider ของ Qwen รวมถึง
  พฤติกรรม media-understanding และ video-generation
- Plugin `voice-call` เป็น feature plugin: มันเป็นเจ้าของ call transport, tools,
  CLI, routes และ Twilio media-stream bridging แต่ใช้ capabilities ด้าน speech
  รวมถึง realtime-transcription และ realtime-voice แบบใช้ร่วมกัน แทนการ import vendor plugins โดยตรง

สถานะปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน plugin เดียว แม้ว่าจะครอบคลุม text models, speech, images และ
  วิดีโอในอนาคต
- ผู้ขายรายอื่นก็สามารถทำแบบเดียวกันสำหรับพื้นผิวของตนเองได้
- channels ไม่สนใจว่า vendor plugin ใดเป็นเจ้าของ provider; พวกมันใช้
  shared capability contract ที่ core เปิดเผย

นี่คือความแตกต่างสำคัญ:

- **plugin** = ขอบเขต ownership
- **capability** = สัญญาของ core ที่หลาย plugins สามารถติดตั้งใช้งานหรือใช้งานได้

ดังนั้นหาก OpenClaw เพิ่มโดเมนใหม่อย่างวิดีโอ คำถามแรกไม่ใช่
“ผู้ให้บริการรายใดควร hardcode การจัดการวิดีโอ?” คำถามแรกคือ “อะไรคือ
core video capability contract?” เมื่อมีสัญญานั้นแล้ว vendor plugins
จะลงทะเบียนกับมันได้ และ channel/feature plugins ก็สามารถใช้มันได้

หากยังไม่มี capability นั้น ทางเลือกที่ถูกต้องโดยทั่วไปคือ:

1. กำหนด capability ที่ขาดหายไปใน core
2. เปิดเผยผ่าน API/runtime ของ plugin แบบมีชนิด
3. เชื่อม channels/features เข้ากับ capability นั้น
4. ให้ vendor plugins ลงทะเบียน implementation

วิธีนี้ทำให้ ownership ชัดเจน ขณะเดียวกันก็หลีกเลี่ยงพฤติกรรมของ core ที่ขึ้นกับ
vendor รายเดียวหรือเส้นทางโค้ดเฉพาะ plugin แบบครั้งเดียว

### การจัดชั้นของ capability

ใช้แบบจำลองความคิดนี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ใด:

- **ชั้น capability ของ core**: orchestration, policy, fallback, กฎการ merge คอนฟิก
  semantics ของการส่ง และสัญญาแบบมีชนิดที่ใช้ร่วมกัน
- **ชั้น vendor plugin**: API เฉพาะ vendor, auth, model catalogs, speech
  synthesis, image generation, แบ็กเอนด์วิดีโอในอนาคต, usage endpoints
- **ชั้น channel/feature plugin**: integration ของ Slack/Discord/voice-call ฯลฯ
  ที่ใช้ capabilities ของ core และนำเสนอผ่านพื้นผิวหนึ่ง

ตัวอย่างเช่น TTS มีโครงสร้างดังนี้:

- core เป็นเจ้าของนโยบาย TTS ตอนตอบกลับ, ลำดับ fallback, prefs และการส่งในช่อง
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementation ของ synthesis
- `voice-call` ใช้ telephony TTS runtime helper

ควรใช้รูปแบบเดียวกันนี้กับ capabilities ในอนาคต

### ตัวอย่าง company plugin แบบ multi-capability

company plugin ควรให้ความรู้สึกเป็นหนึ่งเดียวจากภายนอก หาก OpenClaw มี
สัญญาแบบใช้ร่วมกันสำหรับ models, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch และ web search,
vendor หนึ่งรายก็สามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนในที่เดียว:

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

สิ่งสำคัญไม่ใช่ชื่อ helper ที่แน่นอน แต่เป็นรูปแบบ:

- plugin เดียวเป็นเจ้าของพื้นผิวของ vendor
- core ยังคงเป็นเจ้าของ capability contracts
- channels และ feature plugins ใช้ helpers ใน `api.runtime.*` ไม่ใช่โค้ดของ vendor
- contract tests สามารถยืนยันได้ว่า plugin ลงทะเบียน capabilities ที่มัน
  อ้างว่าเป็นเจ้าของ

### ตัวอย่าง capability: video understanding

OpenClaw ปฏิบัติต่อ image/audio/video understanding เป็น
capability แบบใช้ร่วมกันหนึ่งเดียวอยู่แล้ว และโมเดล ownership เดียวกันก็ใช้กับตรงนี้:

1. core กำหนดสัญญา media-understanding
2. vendor plugins ลงทะเบียน `describeImage`, `transcribeAudio` และ
   `describeVideo` ตามความเหมาะสม
3. channel และ feature plugins ใช้พฤติกรรมร่วมของ core แทน
   การเชื่อมเข้ากับโค้ดของ vendor โดยตรง

วิธีนี้หลีกเลี่ยงการฝังสมมติฐานเกี่ยวกับวิดีโอของผู้ให้บริการรายใดรายหนึ่งไว้ใน core Plugin เป็นเจ้าของ
พื้นผิวของ vendor; core เป็นเจ้าของ capability contract และพฤติกรรม fallback

การสร้างวิดีโอใช้ลำดับแบบเดียวกันนี้อยู่แล้ว: core เป็นเจ้าของ
capability contract แบบมีชนิดและ runtime helper และ vendor plugins ลงทะเบียน
implementation ของ `api.registerVideoGenerationProvider(...)` เข้ากับมัน

ต้องการเช็กลิสต์ rollout แบบเป็นรูปธรรมหรือไม่ ดู
[Capability Cookbook](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว API ของ plugin ถูกทำให้มีชนิดและรวมศูนย์ไว้โดยตั้งใจใน
`OpenClawPluginApi` สัญญานี้กำหนดจุดลงทะเบียนที่รองรับและ
runtime helpers ที่ plugin สามารถพึ่งพาได้

เหตุผลที่สิ่งนี้สำคัญ:

- ผู้เขียน plugin ได้มาตรฐานภายในที่คงที่เพียงหนึ่งเดียว
- core สามารถปฏิเสธ ownership ที่ซ้ำกัน เช่น plugins สองตัวลงทะเบียน
  provider id เดียวกัน
- การเริ่มต้นระบบสามารถแสดง diagnostics ที่นำไปใช้งานได้สำหรับการลงทะเบียนที่ผิดรูป
- contract tests สามารถบังคับ ownership ของ bundled-plugin และป้องกันการเบี่ยงเบนแบบเงียบ ๆ

มีการบังคับใช้อยู่สองชั้น:

1. **การบังคับใช้ตอนลงทะเบียนในรันไทม์**
   plugin registry จะตรวจสอบการลงทะเบียนขณะ plugins ถูกโหลด ตัวอย่างเช่น:
   provider ids ซ้ำ, speech provider ids ซ้ำ และการลงทะเบียนที่ผิดรูป
   จะสร้าง plugin diagnostics แทนพฤติกรรมที่ไม่กำหนดไว้
2. **contract tests**
   bundled plugins ถูกจับไว้ใน contract registries ระหว่างการรันทดสอบ เพื่อให้
   OpenClaw ยืนยัน ownership ได้อย่างชัดเจน ปัจจุบันใช้กับ model
   providers, speech providers, web search providers และ ownership ของ bundled registration

ผลในทางปฏิบัติคือ OpenClaw รู้ล่วงหน้าว่า plugin ใดเป็นเจ้าของพื้นผิวใด
ซึ่งทำให้ core และ channels ประกอบเข้าด้วยกันได้อย่างราบรื่น เพราะ ownership ถูก
ประกาศไว้ มีชนิด และทดสอบได้ แทนที่จะเป็นนัยโดยปริยาย

### อะไรควรอยู่ในสัญญา

สัญญาของ plugin ที่ดีควรเป็น:

- มีชนิด
- ขนาดเล็ก
- เฉพาะกับ capability
- เป็นเจ้าของโดย core
- ใช้ซ้ำได้โดยหลาย plugins
- channels/features สามารถใช้ได้โดยไม่ต้องรู้เรื่อง vendor

สัญญาของ plugin ที่ไม่ดีคือ:

- นโยบายเฉพาะ vendor ที่ซ่อนอยู่ใน core
- escape hatch เฉพาะ plugin แบบครั้งเดียวที่ข้าม registry
- โค้ดของ channel ที่เข้าถึง implementation ของ vendor โดยตรง
- อ็อบเจ็กต์ runtime แบบ ad hoc ที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ
  `api.runtime`

หากไม่แน่ใจ ให้ยกระดับนามธรรมขึ้น: กำหนด capability ก่อน แล้วค่อยให้ plugins เสียบเข้ากับมัน

## โมเดลการรัน

native Plugins ของ OpenClaw รัน **ใน process เดียวกัน** กับ Gateway โดยไม่ถูก
sandbox เมื่อโหลด native plugin แล้ว มันอยู่ในขอบเขตความเชื่อถือระดับ process เดียวกันกับโค้ด core

ผลกระทบ:

- native plugin สามารถลงทะเบียน tools, network handlers, hooks และ services ได้
- บั๊กใน native plugin สามารถทำให้ gateway ล่มหรือไม่เสถียรได้
- native plugin ที่เป็นอันตรายเทียบเท่ากับการรันโค้ดตามอำเภอใจภายใน process ของ OpenClaw

bundle ที่เข้ากันได้ปลอดภัยกว่าโดยค่าเริ่มต้น เพราะในปัจจุบัน OpenClaw ปฏิบัติต่อพวกมัน
เป็น metadata/content packs ในรุ่นปัจจุบัน นั่นส่วนใหญ่หมายถึง
Skills ที่รวมมาให้

สำหรับ plugins ที่ไม่ใช่ bundled ให้ใช้ allowlists และ install/load paths แบบชัดเจน
ปฏิบัติต่อ workspace plugins เป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นของ production

สำหรับชื่อแพ็กเกจ workspace ที่รวมมา ให้ยึด plugin id กับชื่อ npm:
`@openclaw/<id>` เป็นค่าเริ่มต้น หรือใช้ suffix แบบมีชนิดที่อนุมัติแล้ว เช่น
`-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อ
แพ็กเกจตั้งใจเปิดเผยบทบาท plugin ที่แคบกว่า

หมายเหตุสำคัญเรื่องความเชื่อถือ:

- `plugins.allow` เชื่อถือ **plugin ids** ไม่ใช่แหล่งที่มาของ source
- workspace plugin ที่มี id เดียวกับ bundled plugin จะจงใจ shadow
  สำเนาที่รวมมาให้ เมื่อ workspace plugin นั้นถูกเปิดใช้/อยู่ใน allowlist
- นี่เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง การทดสอบแพตช์ และ hotfixes
- ความเชื่อถือของ bundled-plugin ถูก resolve จาก source snapshot — manifest และ
  โค้ดบนดิสก์ขณะโหลด — ไม่ใช่จาก install metadata ระเบียนการติดตั้งที่ถูกแก้ไขเสียหาย
  หรือถูกแทนที่ไม่สามารถขยายพื้นผิวความเชื่อถือของ bundled plugin อย่างเงียบ ๆ
  ให้เกินกว่าที่ source จริงอ้างไว้ได้

## ขอบเขตการ export

OpenClaw export capabilities ไม่ใช่ implementation convenience

เปิดเผยการลงทะเบียน capability ต่อสาธารณะไว้ แต่ตัด helper exports ที่ไม่ใช่สัญญาออก:

- subpaths ของ helper ที่เฉพาะกับ bundled-plugin
- subpaths ของ runtime plumbing ที่ไม่ได้ตั้งใจเป็น public API
- convenience helpers ที่เฉพาะกับ vendor
- helpers สำหรับ setup/onboarding ที่เป็นรายละเอียด implementation

subpaths ของ helper บางตัวสำหรับ bundled-plugin ยังคงอยู่ใน SDK export
map ที่สร้างขึ้นเพื่อความเข้ากันได้และการดูแล bundled-plugin ตัวอย่างปัจจุบันมี
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ seams หลายตัวของ `plugin-sdk/matrix*` ให้ถือว่าสิ่งเหล่านี้เป็น
export รายละเอียด implementation ที่ถูกสงวนไว้ ไม่ใช่รูปแบบ SDK ที่แนะนำสำหรับ
third-party plugins ใหม่

## ไปป์ไลน์การโหลด

เมื่อเริ่มต้นระบบ OpenClaw จะทำประมาณนี้:

1. ค้นหา candidate plugin roots
2. อ่าน native manifests หรือ manifests ของ bundle ที่เข้ากันได้ รวมถึง package metadata
3. ปฏิเสธ candidates ที่ไม่ปลอดภัย
4. normalize คอนฟิก plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินการเปิดใช้สำหรับแต่ละ candidate
6. โหลด native modules ที่เปิดใช้แล้ว: bundled modules ที่ build แล้วใช้ native loader;
   native plugins ที่ยังไม่ build ใช้ jiti
7. เรียก hooks แบบ native `register(api)` และรวบรวมการลงทะเบียนเข้าสู่ plugin registry
8. เปิดเผย registry ให้กับพื้นผิวคำสั่ง/รันไทม์

<Note>
`activate` เป็น alias แบบ legacy ของ `register` — loader จะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกมันในจุดเดียวกัน ทุก bundled plugins ใช้ `register`; สำหรับ plugins ใหม่ควรใช้ `register`
</Note>

เกตด้านความปลอดภัยจะเกิดขึ้น **ก่อน** การรันโค้ดในรันไทม์ Candidates จะถูกบล็อก
เมื่อ entry หลุดออกนอก plugin root, path เขียนได้โดยทุกคน หรือ
ownership ของ path ดูน่าสงสัยสำหรับ plugins ที่ไม่ใช่ bundled

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งความจริงของ control plane OpenClaw ใช้มันเพื่อ:

- ระบุ plugin
- ค้นหา channels/Skills/config schema หรือ bundle capabilities ที่ประกาศไว้
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่ม labels/placeholders ให้กับ Control UI
- แสดง install/catalog metadata
- รักษา activation และ setup descriptors แบบประหยัดไว้ได้โดยไม่ต้องโหลด runtime ของ plugin

สำหรับ native plugins โมดูล runtime คือส่วน data-plane โดยมันจะลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` ใน manifest แบบไม่บังคับยังคงอยู่บน control plane
สิ่งเหล่านี้เป็นเพียง metadata-only descriptors สำหรับการวางแผนการเปิดใช้และการค้นหา setup;
ไม่ได้แทนที่การลงทะเบียนในรันไทม์, `register(...)` หรือ `setupEntry`
ตอนนี้ผู้ใช้ activation แบบ live รายแรกใช้คำใบ้จากคำสั่ง, ช่อง และ provider ใน manifest
เพื่อลดขอบเขตการโหลด plugin ก่อนการทำ registry materialization ที่กว้างขึ้น:

- การโหลด CLI จะจำกัดให้เหลือเฉพาะ plugins ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การ resolve การตั้งค่าช่อง/Plugin จะจำกัดให้เหลือเฉพาะ plugins ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve การตั้งค่าผู้ให้บริการ/รันไทม์แบบชัดเจนจะจำกัดให้เหลือเฉพาะ plugins ที่เป็นเจ้าของ
  provider id ที่ร้องขอ

ขณะนี้การค้นหา setup จะให้ความสำคัญกับ ids ที่เป็นเจ้าของโดย descriptor เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด candidate plugins ก่อน fallback ไปยัง
`setup-api` สำหรับ plugins ที่ยังต้องใช้ runtime hooks ตอน setup หากมี
plugins ที่ถูกค้นพบมากกว่าหนึ่งตัวอ้าง normalized setup provider หรือ CLI backend id เดียวกัน
การค้นหา setup จะปฏิเสธเจ้าของที่กำกวมแทนที่จะอาศัยลำดับการค้นพบ

### สิ่งที่ loader แคชไว้

OpenClaw เก็บแคชระยะสั้นใน process สำหรับ:

- ผลลัพธ์ของ discovery
- ข้อมูล manifest registry
- loaded plugin registries

แคชเหล่านี้ช่วยลดต้นทุนจากการเริ่มต้นแบบ burst และค่าใช้จ่ายของคำสั่งที่รันซ้ำ
อย่างปลอดภัย ควรมองมันเป็นแคชประสิทธิภาพอายุสั้น ไม่ใช่ persistence

หมายเหตุด้านประสิทธิภาพ:

- ตั้ง `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` หรือ
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` เพื่อปิดแคชเหล่านี้
- ปรับหน้าต่างแคชด้วย `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` และ
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`

## โมเดล registry

plugins ที่โหลดแล้วจะไม่แก้ไข global ของ core แบบสุ่มโดยตรง แต่จะลงทะเบียนเข้าสู่
plugin registry กลาง

registry ติดตามสิ่งต่อไปนี้:

- plugin records (ตัวตน, แหล่งที่มา, origin, สถานะ, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands ที่เป็นเจ้าของโดย plugin

จากนั้นฟีเจอร์ของ core จะอ่านจาก registry นี้ แทนการคุยกับโมดูล plugin โดยตรง
ซึ่งทำให้การโหลดเป็นทางเดียว:

- plugin module -> registry registration
- core runtime -> registry consumption

การแยกนี้สำคัญต่อการบำรุงรักษา เพราะหมายความว่าพื้นผิวส่วนใหญ่ของ core ต้องมี
integration point เพียงหนึ่งเดียว: “อ่าน registry” ไม่ใช่ “ทำกรณีพิเศษให้ทุก plugin
module”

## callback สำหรับการผูกบทสนทนา

Plugins ที่ผูกบทสนทนาสามารถตอบสนองได้เมื่อการอนุมัติถูก resolve แล้ว

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
ได้รับการอนุมัติหรือปฏิเสธ:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // ตอนนี้มี binding สำหรับ plugin + conversation นี้แล้ว
        console.log(event.binding?.conversationId);
        return;
      }

      // คำขอถูกปฏิเสธ; ล้างสถานะ pending ภายในเครื่องที่มีอยู่
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

ฟิลด์ของ payload ใน callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่ได้รับอนุมัติ
- `request`: สรุปคำขอเดิม, detach hint, sender id และ
  conversation metadata

callback นี้มีไว้เพื่อการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
บทสนทนา และจะรันหลังจากการจัดการการอนุมัติของ core เสร็จสิ้นแล้ว

## runtime hooks ของผู้ให้บริการ

ตอนนี้ provider plugins มีสองชั้น:

- metadata ใน manifest: `providerAuthEnvVars` สำหรับการ lookup auth แบบ env ของผู้ให้บริการอย่างประหยัด
  ก่อนโหลดรันไทม์, `providerAuthAliases` สำหรับรูปแบบ provider ที่ใช้
  auth ร่วมกัน, `channelEnvVars` สำหรับการ lookup env/setup ของช่องแบบประหยัดก่อน
  โหลดรันไทม์ รวมถึง `providerAuthChoices` สำหรับป้ายกำกับ onboarding/auth-choice แบบประหยัดและ
  metadata ของ CLI flag ก่อนโหลดรันไทม์
- hooks ตอนคอนฟิก: `catalog` / `discovery` แบบเดิม รวมถึง `applyConfigDefaults`
- runtime hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw ยังคงเป็นเจ้าของ agent loop แบบทั่วไป, failover, transcript handling และ
tool policy hooks เหล่านี้คือพื้นผิวสำหรับขยายพฤติกรรมเฉพาะของผู้ให้บริการโดยไม่
จำเป็นต้องมี inference transport แบบกำหนดเองทั้งก้อน

ใช้ `providerAuthEnvVars` ใน manifest เมื่อผู้ให้บริการมีข้อมูลรับรองแบบ env
ที่เส้นทาง generic auth/status/model-picker ควรมองเห็นได้โดยไม่ต้องโหลด runtime ของ plugin ใช้ manifest `providerAuthAliases` เมื่อ provider id หนึ่งควรนำ env vars, auth profiles, config-backed auth และตัวเลือก onboarding แบบ API-key
ของ provider id อื่นกลับมาใช้ซ้ำ ใช้ manifest `providerAuthChoices` เมื่อพื้นผิว CLI ของ onboarding/auth-choice
ควรทราบ choice id ของผู้ให้บริการ, group labels และการเชื่อม auth แบบ one-flag ง่าย ๆ โดยไม่ต้องโหลด runtime ของ provider ส่วน `envVars` ใน runtime ของ provider ให้เก็บไว้สำหรับคำใบ้ฝั่ง operator เช่นป้าย onboarding หรือ
ตัวแปรสำหรับตั้งค่า OAuth client-id/client-secret

ใช้ `channelEnvVars` ใน manifest เมื่อช่องมี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง
generic shell-env fallback, การตรวจสอบ config/status หรือ setup prompts ควรมองเห็นได้
โดยไม่ต้องโหลด runtime ของช่อง

### ลำดับของ hooks และการใช้งาน

สำหรับ model/provider plugins OpenClaw จะเรียก hooks ตามลำดับคร่าว ๆ ดังนี้
คอลัมน์ “ใช้เมื่อใด” คือคู่มือการตัดสินใจอย่างรวดเร็ว

| #   | Hook                              | ทำอะไร                                                                                                   | ใช้เมื่อใด                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่คอนฟิกผู้ให้บริการไปยัง `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ base URL                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นคอนฟิกส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการ materialize คอนฟิก                                      | ค่าเริ่มต้นขึ้นกับโหมด auth, env หรือความหมายของตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(built-in model lookup)_         | OpenClaw ลองเส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ plugin hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | normalize aliases ของ model-id แบบ legacy หรือ preview ก่อน lookup                                                     | ผู้ให้บริการเป็นเจ้าของการล้าง alias ก่อนการ resolve โมเดล canonical                                                                                 |
| 4   | `normalizeTransport`              | normalize `api` / `baseUrl` ของตระกูลผู้ให้บริการก่อนการประกอบโมเดลทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับ provider ids แบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | normalize `models.providers.<id>` ก่อนการ resolve runtime/provider                                           | ผู้ให้บริการต้องมีการล้างคอนฟิกที่ควรอยู่กับ plugin; helper ของตระกูล Google ที่รวมมาให้ยังช่วยรองรับรายการคอนฟิก Google ที่รองรับด้วย   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การ rewrite ความเข้ากันได้ของ native streaming-usage กับคอนฟิกผู้ให้บริการ                                               | ผู้ให้บริการต้องแก้ไข metadata ของ native streaming usage ตาม endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | resolve auth แบบ env-marker สำหรับคอนฟิกผู้ให้บริการก่อนโหลด runtime auth                                       | ผู้ให้บริการมีการ resolve API-key แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ก็มี built-in AWS env-marker resolver ตรงนี้ด้วย                  |
| 8   | `resolveSyntheticAuth`            | แสดง auth แบบ local/self-hosted หรือแบบคอนฟิกโดยไม่เก็บ plaintext                                   | ผู้ให้บริการสามารถทำงานได้ด้วย marker ข้อมูลรับรองแบบ synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับ external auth profiles ที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลรับรองที่ CLI/แอปเป็นเจ้าของ | ผู้ให้บริการนำข้อมูลรับรอง auth ภายนอกกลับมาใช้ซ้ำโดยไม่เก็บ refresh token ที่คัดลอกมา; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ placeholder ของ synthetic profile ที่เก็บไว้ให้ตามหลัง auth ที่รองรับด้วย env/config                                      | ผู้ให้บริการเก็บ synthetic placeholder profiles ที่ไม่ควรมีลำดับความสำคัญเหนือกว่า                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบ sync สำหรับ model ids ที่ผู้ให้บริการเป็นเจ้าของแต่ยังไม่มีใน local registry                                       | ผู้ให้บริการยอมรับ upstream model ids ตามอำเภอใจ                                                                                                 |
| 12  | `prepareDynamicModel`             | วอร์มอัปแบบ async แล้ว `resolveDynamicModel` จะรันอีกครั้ง                                                           | ผู้ให้บริการต้องใช้ metadata จากเครือข่ายก่อน resolve ids ที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | rewrite ขั้นสุดท้ายก่อน embedded runner จะใช้โมเดลที่ resolve แล้ว                                               | ผู้ให้บริการต้อง rewrite transport แต่ยังคงใช้ core transport อยู่                                                                             |
| 14  | `contributeResolvedModelCompat`   | ส่งต่อ compat flags สำหรับ vendor models ที่อยู่หลัง transport ที่เข้ากันได้อีกชั้นหนึ่ง                                  | ผู้ให้บริการรู้จักโมเดลของตนเองบน proxy transports โดยไม่เข้าควบคุมผู้ให้บริการนั้น                                                       |
| 15  | `capabilities`                    | metadata ด้าน transcript/tooling ที่ผู้ให้บริการเป็นเจ้าของและถูกใช้โดย shared core logic                                           | ผู้ให้บริการต้องการ quirks ของ transcript/ตระกูลผู้ให้บริการ                                                                                              |
| 16  | `normalizeToolSchemas`            | normalize tool schemas ก่อน embedded runner จะมองเห็นพวกมัน                                                    | ผู้ให้บริการต้องล้าง schema ของตระกูล transport                                                                                                |
| 17  | `inspectToolSchemas`              | แสดง diagnostics ของ schema ที่ผู้ให้บริการเป็นเจ้าของหลังการ normalize                                                  | ผู้ให้บริการต้องการคำเตือนระดับ keyword โดยไม่สอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 18  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบ native หรือแบบ tagged                                                              | ผู้ให้บริการต้องใช้ tagged reasoning/final output แทนฟิลด์แบบ native                                                                         |
| 19  | `prepareExtraParams`              | normalize request-param ก่อน generic stream option wrappers                                              | ผู้ให้บริการต้องการ request params เริ่มต้นหรือการล้างพารามิเตอร์เฉพาะผู้ให้บริการ                                                                           |
| 20  | `createStreamFn`                  | แทนที่เส้นทาง stream ปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการ wire protocol แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 21  | `wrapStreamFn`                    | stream wrapper หลังจากใช้ generic wrappers แล้ว                                                              | ผู้ให้บริการต้องการ wrappers สำหรับ request headers/body/model compat โดยไม่ต้องมี custom transport                                                          |
| 22  | `resolveTransportTurnState`       | แนบ headers หรือ metadata ต่อรอบแบบ native                                                           | ผู้ให้บริการต้องการให้ generic transports ส่งตัวตนของรอบแบบ native ของผู้ให้บริการ                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | แนบ headers แบบ native ของ WebSocket หรือนโยบาย cool-down ของเซสชัน                                                    | ผู้ให้บริการต้องการให้ generic WS transports ปรับแต่ง session headers หรือนโยบาย fallback                                                               |
| 24  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: profile ที่เก็บไว้จะกลายเป็นสตริง `apiKey` ในรันไทม์                                     | ผู้ให้บริการเก็บ metadata auth เพิ่มเติมและต้องการรูปร่างโทเค็นในรันไทม์แบบกำหนดเอง                                                                    |
| 25  | `refreshOAuth`                    | override การรีเฟรช OAuth สำหรับ refresh endpoints แบบกำหนดเองหรือนโยบายตอน refresh ล้มเหลว                                  | ผู้ให้บริการไม่เข้ากับ refreshers แบบใช้ร่วมกันของ `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | คำใบ้สำหรับซ่อมแซมที่จะถูกต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำซ่อมแซม auth ที่ผู้ให้บริการเป็นเจ้าของหลังการรีเฟรชล้มเหลว                                                                      |
| 27  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic ทั่วไปจะพลาด                                                                                |
| 28  | `classifyFailoverReason`          | การจัดประเภทสาเหตุ failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาดดิบจาก API/transport เป็น rate-limit/overload ฯลฯ                                                                          |
| 29  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการแบบ proxy/backhaul                                                               | ผู้ให้บริการต้องการ gating ของ cache TTL แบบเฉพาะ proxy                                                                                                |
| 30  | `buildMissingAuthMessage`         | ใช้แทนข้อความกู้คืนเมื่อไม่มี auth แบบทั่วไป                                                      | ผู้ให้บริการต้องการคำใบ้การกู้คืนเมื่อไม่มี auth แบบเฉพาะผู้ให้บริการ                                                                                 |
| 31  | `suppressBuiltInModel`            | การซ่อนโมเดล upstream ที่เก่า พร้อมคำใบ้ข้อผิดพลาดสำหรับผู้ใช้แบบไม่บังคับ                                          | ผู้ให้บริการต้องการซ่อนแถว upstream ที่เก่า หรือแทนที่ด้วยคำใบ้จากผู้ขาย                                                                 |
| 32  | `augmentModelCatalog`             | แถวแค็ตตาล็อกแบบ synthetic/final ที่ถูกต่อท้ายหลัง discovery                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบ synthetic ใน `models list` และตัวเลือก                                                                     |
| 33  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, ป้ายแสดงผล และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผย thinking ladder แบบกำหนดเองหรือป้ายแบบไบนารีสำหรับโมเดลที่เลือก                                                                 |
| 34  | `isBinaryThinking`                | hook ความเข้ากันได้สำหรับสวิตช์ reasoning แบบเปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเพียง thinking แบบไบนารีเปิด/ปิด                                                                                                  |
| 35  | `supportsXHighThinking`           | hook ความเข้ากันได้สำหรับการรองรับ reasoning ระดับ `xhigh`                                                                   | ผู้ให้บริการต้องการให้ `xhigh` ใช้ได้เฉพาะกับบางโมเดล                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | hook ความเข้ากันได้สำหรับระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 37  | `isModernModelRef`                | ตัวจับคู่ modern-model สำหรับตัวกรอง live profile และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่ preferred-model สำหรับ live/smoke                                                                                             |
| 38  | `prepareRuntimeAuth`              | แลกข้อมูลรับรองที่กำหนดค่าไว้ให้เป็นโทเค็น/คีย์จริงในรันไทม์ก่อนการอนุมาน                       | ผู้ให้บริการต้องการการแลกโทเค็นหรือข้อมูลรับรองคำขออายุสั้น                                                                             |
| 39  | `resolveUsageAuth`                | resolve ข้อมูลรับรองการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการ parse โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลรับรองการใช้งานอีกชนิดหนึ่ง                                                               |
| 40  | `fetchUsageSnapshot`              | ดึงและ normalize สแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการหลังจาก resolve auth แล้ว                             | ผู้ให้บริการต้องการ endpoint การใช้งานเฉพาะผู้ให้บริการหรือ parser ของ payload                                                                           |
| 41  | `createEmbeddingProvider`         | สร้าง embedding adapter ที่ผู้ให้บริการเป็นเจ้าของสำหรับ memory/search                                                     | พฤติกรรม embedding ของ Memory ควรอยู่กับ provider plugin                                                                                    |
| 42  | `buildReplayPolicy`               | คืนค่านโยบาย replay ที่ควบคุมการจัดการ transcript สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบาย transcript แบบกำหนดเอง (เช่น การตัด thinking-block ออก)                                                               |
| 43  | `sanitizeReplayHistory`           | rewrite ประวัติ replay หลังจากการล้าง transcript แบบทั่วไป                                                        | ผู้ให้บริการต้องการ rewrite replay แบบเฉพาะผู้ให้บริการนอกเหนือจาก helpers ของ Compaction ที่ใช้ร่วมกัน                                                             |
| 44  | `validateReplayTurns`             | ตรวจสอบหรือปรับรูปร่าง replay-turn ขั้นสุดท้ายก่อน embedded runner                                           | transport ของผู้ให้บริการต้องการการตรวจสอบ turn ที่เข้มงวดยิ่งขึ้นหลังการ sanitize แบบทั่วไป                                                                    |
| 45  | `onModelSelected`                 | รัน side effects หลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการ telemetry หรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลถูกเปิดใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ provider plugin ที่
ตรงกันก่อน จากนั้นจึงไล่ไปยัง provider plugins อื่นที่รองรับ hook
จนกว่าจะมีตัวหนึ่งเปลี่ยน model id หรือ transport/config จริง วิธีนี้ทำให้ shim สำหรับ
alias/compat provider ยังทำงานได้โดยไม่บังคับให้ผู้เรียกรู้ว่า bundled plugin ใดเป็นเจ้าของ rewrite
หากไม่มี provider hook ใด rewrite รายการคอนฟิกของตระกูล Google ที่รองรับ
ตัว Google config normalizer ที่รวมมาให้ก็ยังคงทำ compatibility cleanup นั้นต่อไป

หากผู้ให้บริการต้องการ wire protocol แบบกำหนดเองเต็มรูปแบบ หรือ request executor แบบกำหนดเอง
นั่นเป็น extension อีกประเภทหนึ่ง hooks เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังคงทำงานอยู่บน inference loop ปกติของ OpenClaw

### ตัวอย่างผู้ให้บริการ

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### ตัวอย่างที่มีมาให้ในระบบ

bundled provider plugins ใช้ hooks ข้างต้นในชุดผสมที่ปรับให้เหมาะกับ
ความต้องการด้าน catalog, auth, thinking, replay และ usage-tracking ของแต่ละ
ผู้ขาย ชุด hook ที่แน่นอนของแต่ละผู้ให้บริการอยู่กับ source ของ plugin ภายใต้ `extensions/`; ให้ถือว่านั่นเป็นรายการที่อ้างอิงได้จริง แทนการทำซ้ำไว้ที่นี่

รูปแบบตัวอย่าง:

- **ผู้ให้บริการ catalog แบบ pass-through** (OpenRouter, Kilocode, Z.AI, xAI) ลงทะเบียน
  `catalog` พร้อม `resolveDynamicModel`/`prepareDynamicModel` เพื่อให้สามารถแสดง
  upstream model ids ได้ก่อน static catalog ของ OpenClaw
- **ผู้ให้บริการแบบ OAuth + usage endpoint** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) จับคู่ `prepareRuntimeAuth` หรือ `formatApiKey`
  กับ `resolveUsageAuth` + `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลกโทเค็นและ
  integration ของ `/usage`
- **การล้าง replay / transcript** ถูกใช้ร่วมกันผ่านตระกูลที่มีชื่อ:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai` ผู้ให้บริการเลือกใช้ผ่าน `buildReplayPolicy`
  แทนที่จะให้แต่ละรายติดตั้งการล้าง transcript เอง
- **bundled providers แบบ catalog-only** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) ลงทะเบียนแค่ `catalog` และใช้
  inference loop ที่ใช้ร่วมกัน
- **ตัวช่วย stream เฉพาะของ Anthropic** (beta headers, `/fast`/`serviceTier`,
  `context1m`) อยู่ภายใน seam สาธารณะ `api.ts` /
  `contract-api.ts` ของ bundled plugin Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) ไม่ได้อยู่ใน
  SDK ทั่วไป

## runtime helpers

Plugins สามารถเข้าถึง core helpers บางส่วนได้ผ่าน `api.runtime` สำหรับ TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

หมายเหตุ:

- `textToSpeech` จะคืน payload เอาต์พุต TTS ปกติของ core สำหรับพื้นผิวแบบไฟล์/voice-note
- ใช้คอนฟิก `messages.tts` และการเลือกผู้ให้บริการของ core
- คืนค่า PCM audio buffer + sample rate โดย plugins ต้อง resample/encode เองสำหรับผู้ให้บริการ
- `listVoices` เป็นแบบไม่บังคับตามผู้ให้บริการ ใช้มันสำหรับตัวเลือกเสียงหรือโฟลว์ setup ที่ผู้ให้บริการเป็นเจ้าของ
- รายการเสียงอาจมี metadata ที่ละเอียดขึ้น เช่น locale, gender และ personality tags สำหรับตัวเลือกที่รับรู้ผู้ให้บริการ
- ปัจจุบัน OpenAI และ ElevenLabs รองรับ telephony ส่วน Microsoft ยังไม่รองรับ

Plugins สามารถลงทะเบียน speech providers ได้ด้วย `api.registerSpeechProvider(...)`

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

หมายเหตุ:

- คงนโยบาย TTS, fallback และการส่งการตอบกลับไว้ใน core
- ใช้ speech providers สำหรับพฤติกรรม synthesis ที่ผู้ให้บริการเป็นเจ้าของ
- อินพุต `edge` แบบเดิมของ Microsoft จะถูก normalize เป็น provider id `microsoft`
- โมเดล ownership ที่แนะนำคือมองตามบริษัท: vendor plugin หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และ media providers ในอนาคตได้เมื่อ OpenClaw เพิ่ม capability contracts เหล่านั้น

สำหรับ image/audio/video understanding, plugins จะลงทะเบียน
provider แบบ media-understanding ที่มีชนิดเพียงตัวเดียว แทนการใช้ key/value bag ทั่วไป:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

หมายเหตุ:

- คง orchestration, fallback, config และ channel wiring ไว้ใน core
- คงพฤติกรรมของ vendor ไว้ใน provider plugin
- การขยายแบบ additive ควรคงความมีชนิดไว้: methods ใหม่แบบไม่บังคับ, ฟิลด์ผลลัพธ์ใหม่แบบไม่บังคับ, capabilities ใหม่แบบไม่บังคับ
- การสร้างวิดีโอก็ใช้รูปแบบเดียวกันนี้อยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - vendor plugins ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helpers ของ media-understanding, plugins สามารถเรียก:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

สำหรับการถอดเสียงจากเสียง Plugins สามารถใช้ได้ทั้ง runtime ของ media-understanding
หรือ alias STT แบบเก่า:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // ไม่บังคับเมื่อไม่สามารถอนุมาน MIME ได้อย่างน่าเชื่อถือ:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวแบบใช้ร่วมกันที่แนะนำสำหรับ
  image/audio/video understanding
- ใช้คอนฟิกเสียงของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- คืนค่า `{ text: undefined }` เมื่อไม่มีผลลัพธ์การถอดเสียง (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่ในฐานะ alias ด้านความเข้ากันได้

Plugins สามารถเปิดการรัน background subagent ได้ผ่าน `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

หมายเหตุ:

- `provider` และ `model` เป็น override ต่อการรันแต่ละครั้ง ไม่ใช่การเปลี่ยนเซสชันแบบถาวร
- OpenClaw จะยอมรับฟิลด์ override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับ fallback runs ที่ plugin เป็นเจ้าของ ผู้ปฏิบัติการต้องเลือกใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด plugin ที่เชื่อถือได้ให้ใช้ได้เฉพาะเป้าหมาย canonical `provider/model` ที่กำหนด หรือ `"*"` เพื่ออนุญาตเป้าหมายใดก็ได้อย่างชัดเจน
- การรัน subagent ของ plugin ที่ไม่เชื่อถือได้ยังใช้งานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ

สำหรับ web search, plugins สามารถใช้ shared runtime helper ได้แทน
การเจาะเข้าไปใน wiring ของ agent tool:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins ยังสามารถลงทะเบียน web-search providers ได้ผ่าน
`api.registerWebSearchProvider(...)`

หมายเหตุ:

- คงการเลือกผู้ให้บริการ, การ resolve ข้อมูลรับรอง และ semantics ของคำขอแบบใช้ร่วมกันไว้ใน core
- ใช้ web-search providers สำหรับ search transports ที่เฉพาะกับ vendor
- `api.runtime.webSearch.*` คือพื้นผิวแบบใช้ร่วมกันที่แนะนำสำหรับ feature/channel plugins ที่ต้องการพฤติกรรมการค้นหาโดยไม่ต้องพึ่ง wrapper ของ agent tool

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: สร้างภาพโดยใช้เชนผู้ให้บริการ image-generation ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่ใช้งานได้และ capabilities ของพวกเขา

## HTTP routes ของ Gateway

Plugins สามารถเปิดเผย HTTP endpoints ได้ด้วย `api.registerHttpRoute(...)`

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ฟิลด์ของ route:

- `path`: path ของ route ภายใต้เซิร์ฟเวอร์ HTTP ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อบังคับใช้ auth ปกติของ gateway หรือ `"plugin"` สำหรับ auth/webhook verification ที่ plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ plugin เดิมแทนที่การลงทะเบียน route เดิมของตนเอง
- `handler`: คืนค่า `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกลบออกแล้ว และจะทำให้เกิดข้อผิดพลาดตอนโหลด plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- plugin routes ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบ exact จะถูกปฏิเสธ เว้นแต่จะตั้ง `replaceExisting: true` และ plugin หนึ่งไม่สามารถแทนที่ route ของอีก plugin ได้
- routes ที่ซ้อนทับกันแต่มีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คง chain แบบ fallthrough ของ `exact`/`prefix` ไว้ที่ auth ระดับเดียวกันเท่านั้น
- routes ที่ใช้ `auth: "plugin"` **จะไม่ได้รับ** operator runtime scopes โดยอัตโนมัติ ใช้สำหรับ webhooks/การตรวจสอบลายเซ็นที่ plugin จัดการเอง ไม่ใช่สำหรับการเรียก Gateway helper แบบมีสิทธิ์สูง
- routes ที่ใช้ `auth: "gateway"` จะทำงานภายใน runtime scope ของคำขอ Gateway แต่ scope นั้นถูกทำให้ระมัดระวังไว้โดยตั้งใจ:
  - bearer auth แบบ shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึง runtime scopes ของ plugin-route ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes`
  - โหมด HTTP แบบมีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress แบบ private) จะใช้ `x-openclaw-scopes` ก็ต่อเมื่อมี header นี้อย่างชัดเจนเท่านั้น
  - หากไม่มี `x-openclaw-scopes` ในคำขอ plugin-route แบบมีตัวตนเหล่านั้น runtime scope จะ fallback เป็น `operator.write`
- กฎเชิงปฏิบัติ: อย่าคิดว่า plugin route ที่ใช้ gateway-auth เป็นพื้นผิวระดับผู้ดูแลระบบโดยปริยาย หาก route ของคุณต้องการพฤติกรรมเฉพาะผู้ดูแลระบบ ให้บังคับใช้โหมด auth แบบมีตัวตน และบันทึกสัญญาของ header `x-openclaw-scopes` แบบชัดเจน

## import paths ของ Plugin SDK

ใช้ SDK subpaths แบบแคบแทน root
barrel ขนาดใหญ่ `openclaw/plugin-sdk` เมื่อเขียน plugins ใหม่ Core subpaths:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helper สำหรับ entry/build ของช่อง                        |
| `openclaw/plugin-sdk/core`          | helper ที่ใช้ร่วมกันทั่วไปและ umbrella contract       |
| `openclaw/plugin-sdk/config-schema` | Zod schema ของ root `openclaw.json` (`OpenClawSchema`) |

Channel plugins เลือกใช้ได้จากตระกูล seam แบบแคบ — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรถูกรวมไว้บน
contract `approvalCapability` ตัวเดียว แทนการปะปนข้ามฟิลด์ plugin ที่ไม่เกี่ยวข้อง
ดู [Channel plugins](/th/plugins/sdk-channel-plugins)

runtime และ config helpers อยู่ภายใต้ subpaths `*-runtime`
ที่สอดคล้องกัน (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` ฯลฯ)

<Info>
`openclaw/plugin-sdk/channel-runtime` เลิกใช้แล้ว — เป็น compatibility shim สำหรับ
plugins รุ่นเก่า โค้ดใหม่ควร import primitive ทั่วไปที่แคบกว่าแทน
</Info>

entry points ภายใน repo (ต่อ root ของแพ็กเกจ bundled plugin แต่ละตัว):

- `index.js` — entry ของ bundled plugin
- `api.js` — barrel ของ helper/types
- `runtime-api.js` — barrel สำหรับ runtime เท่านั้น
- `setup-entry.js` — entry ของ setup plugin

external plugins ควร import เฉพาะ subpaths ของ `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของแพ็กเกจ plugin อื่นจาก core หรือจาก plugin อื่น
entry points ที่โหลดผ่าน facade จะให้ความสำคัญกับสแนปช็อตคอนฟิกรันไทม์ที่ใช้งานอยู่หากมีอยู่ ก่อนจะ fallback ไปยังไฟล์คอนฟิกที่ resolve แล้วบนดิสก์

subpaths เฉพาะ capability เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ bundled plugins ใช้งานอยู่ในปัจจุบัน สิ่งเหล่านี้ไม่ได้
เป็นสัญญาภายนอกระยะยาวที่ถูกตรึงโดยอัตโนมัติ — ให้ตรวจสอบหน้าเอกสารอ้างอิง SDK ที่เกี่ยวข้องเมื่อจะพึ่งพาพวกมัน

## schema ของ message tool

Plugins ควรเป็นเจ้าของ schema contributions ของ `describeMessageTool(...)` ที่เฉพาะกับช่อง
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
การนำเสนอสำหรับการส่งแบบใช้ร่วมกันควรใช้ contract `MessagePresentation` แบบทั่วไป
แทนฟิลด์แบบ native ของผู้ให้บริการ เช่น button, component, block หรือ card
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา
กฎ fallback, การแมปผู้ให้บริการ และเช็กลิสต์สำหรับผู้เขียน plugin

plugins ที่ส่งข้อความได้จะประกาศสิ่งที่สามารถเรนเดอร์ได้ผ่าน message capabilities:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอส่งแบบปักหมุด

core จะตัดสินใจว่าจะเรนเดอร์การนำเสนอแบบ native หรือ degrade เป็นข้อความ
ห้ามเปิดเผย escape hatches ของ UI แบบ provider-native จาก generic message tool
SDK helpers ที่เลิกใช้แล้วสำหรับ native schemas แบบเดิมยังคง export อยู่เพื่อ
รองรับ third-party plugins ที่มีอยู่ แต่ plugins ใหม่ไม่ควรใช้

## การ resolve เป้าหมายของช่อง

Channel plugins ควรเป็นเจ้าของ semantics ของเป้าหมายที่เฉพาะกับช่อง คง outbound host ที่ใช้ร่วมกัน
ให้เป็นแบบทั่วไป และใช้พื้นผิว messaging adapter สำหรับกฎของผู้ให้บริการ:

- `messaging.inferTargetChatType({ to })` ตัดสินว่า normalized target
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อน directory lookup
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า
  อินพุตควรข้ามไปยังการ resolve แบบ id-like โดยตรงแทนการค้นหาใน directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ผู้ให้บริการเป็นเจ้าของหลังการ normalize หรือหลัง
  หาใน directory ไม่เจอ
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route เฉพาะผู้ให้บริการ
  เมื่อ resolve เป้าหมายแล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจเรื่องหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจสอบแนว “มองสิ่งนี้เป็น native target id/explicit target id”
- ใช้ `resolveTarget` สำหรับ fallback การ normalize ที่เฉพาะกับผู้ให้บริการ ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- คง provider-native ids เช่น chat ids, thread ids, JIDs, handles และ room
  ids ไว้ภายในค่า `target` หรือพารามิเตอร์ที่เฉพาะกับผู้ให้บริการ ไม่ใช่ในฟิลด์ SDK ทั่วไป

## directories ที่รองรับด้วยคอนฟิก

Plugins ที่สร้างรายการ directory จากคอนฟิกควรเก็บตรรกะนั้นไว้ใน
plugin และนำ helper ที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/directory-runtime` กลับมาใช้

ใช้สิ่งนี้เมื่อช่องต้องการ peers/groups ที่รองรับด้วยคอนฟิก เช่น:

- peers ของ DM ที่ขับเคลื่อนด้วย allowlist
- แผนที่ channel/group ที่กำหนดค่าไว้
- fallback ของ static directory แบบ account-scoped

helper ที่ใช้ร่วมกันใน `directory-runtime` จะจัดการเฉพาะงานทั่วไป:

- การกรอง query
- การใช้ limit
- helpers สำหรับ deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id ที่เฉพาะกับช่องควรอยู่ใน
implementation ของ plugin เอง

## catalogs ของผู้ให้บริการ

Provider plugins สามารถกำหนด model catalogs สำหรับการอนุมานได้ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` จะคืนค่าในรูปแบบเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับรายการผู้ให้บริการรายการเดียว
- `{ providers }` สำหรับหลายรายการผู้ให้บริการ

ใช้ `catalog` เมื่อ plugin เป็นเจ้าของ model ids, ค่าเริ่มต้นของ base URL หรือ metadata ของโมเดลที่ขึ้นกับ auth ซึ่งเฉพาะกับผู้ให้บริการ

`catalog.order` ควบคุมเวลาที่ catalog ของ plugin จะ merge เมื่อเทียบกับ
implicit providers แบบ built-in ของ OpenClaw:

- `simple`: ผู้ให้บริการที่ใช้ plain API-key หรือ env
- `profile`: ผู้ให้บริการที่ปรากฏเมื่อมี auth profiles
- `paired`: ผู้ให้บริการที่สังเคราะห์รายการผู้ให้บริการที่เกี่ยวข้องหลายรายการ
- `late`: รอบสุดท้าย หลัง implicit providers อื่น ๆ

ผู้ให้บริการที่มาทีหลังจะชนะเมื่อ key ชนกัน ดังนั้น plugins จึงสามารถ override
รายการผู้ให้บริการแบบ built-in ที่มี provider id เดียวกันได้โดยตั้งใจ

ความเข้ากันได้:

- `discovery` ยังใช้งานได้ในฐานะ alias แบบ legacy
- หากลงทะเบียนทั้ง `catalog` และ `discovery`, OpenClaw จะใช้ `catalog`

## การตรวจสอบช่องแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนช่อง ให้เลือกติดตั้งใช้งาน
`plugin.config.inspectAccount(cfg, accountId)` ร่วมกับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทางรันไทม์ มันสามารถสมมติได้ว่าข้อมูลรับรอง
  ถูก materialize ครบแล้ว และล้มเหลวได้ทันทีเมื่อไม่มี secrets ที่จำเป็น
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และโฟลว์ doctor/config
  repair ไม่ควรต้อง materialize ข้อมูลรับรองในรันไทม์เพียงเพื่อ
  อธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนค่าเฉพาะสถานะเชิงพรรณนาของบัญชี
- คงค่า `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะของข้อมูลรับรองเมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่าโทเค็นดิบเพื่อรายงานความพร้อมใช้งานแบบอ่านอย่างเดียว
  การคืนค่า `tokenStatus: "available"` (พร้อมฟิลด์ source ที่ตรงกัน)
  ก็เพียงพอสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อข้อมูลรับรองถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

วิธีนี้ทำให้คำสั่งแบบอ่านอย่างเดียวสามารถรายงานว่า “กำหนดค่าไว้แต่ไม่พร้อมในเส้นทางคำสั่งนี้” แทนที่จะล่มหรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## package packs

ไดเรกทอรีของ plugin สามารถมี `package.json` พร้อม `openclaw.extensions` ได้:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น plugin หาก pack แสดงหลาย extensions, plugin id
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import npm deps ให้ติดตั้งไว้ในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

ราวกันด้านความปลอดภัย: ทุก entry ใน `openclaw.extensions` ต้องคงอยู่ภายในไดเรกทอรี plugin
หลังการ resolve symlink รายการที่หลุดออกนอกไดเรกทอรีแพ็กเกจจะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` จะติดตั้ง dependency ของ plugin ด้วย
`npm install --omit=dev --ignore-scripts` (ไม่มี lifecycle scripts และไม่มี dev dependencies ในรันไทม์) ให้รักษา dependency
trees ของ plugin ให้เป็น “pure JS/TS” และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ `postinstall` builds

ทางเลือกเสริม: `openclaw.setupEntry` สามารถชี้ไปยังโมดูล setup-only ที่มีน้ำหนักเบาได้
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ channel plugin ที่ถูกปิดใช้งาน หรือ
เมื่อ channel plugin ถูกเปิดใช้งานแต่ยังไม่ได้กำหนดค่า OpenClaw จะโหลด `setupEntry`
แทน full plugin entry วิธีนี้ช่วยให้การเริ่มต้นระบบและ setup เบาขึ้น
เมื่อ main plugin entry ของคุณยังเชื่อม tools, hooks หรือโค้ดเฉพาะรันไทม์อื่นด้วย

ทางเลือกเสริม: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถให้ channel plugin เลือกใช้เส้นทาง `setupEntry` เดียวกันในช่วง
pre-listen startup ของ gateway ได้ แม้ว่าช่องจะถูกกำหนดค่าไว้แล้วก็ตาม

ให้ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ทั้งหมดที่ต้องมีอยู่
ก่อนที่ gateway จะเริ่มฟังจริง ในทางปฏิบัติหมายความว่า setup entry
ต้องลงทะเบียนทุก capability ที่ช่องเป็นเจ้าของซึ่ง startup พึ่งพา เช่น:

- การลงทะเบียนช่องเอง
- HTTP routes ใด ๆ ที่ต้องพร้อมก่อน gateway เริ่มฟัง
- gateway methods, tools หรือ services ใด ๆ ที่ต้องมีในช่วงเวลาเดียวกันนั้น

หาก full entry ของคุณยังเป็นเจ้าของ capability ด้าน startup ที่จำเป็นใดอยู่ อย่าเปิด
แฟล็กนี้ ให้คง plugin ไว้ที่พฤติกรรมเริ่มต้น และให้ OpenClaw โหลด
full entry ระหว่าง startup

bundled channels ยังสามารถเผยแพร่ helper ของ contract-surface แบบ setup-only ที่ core
ปรึกษาได้ก่อน full channel runtime จะถูกโหลด พื้นผิว setup
promotion ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนี้เมื่อต้อง promote คอนฟิกของช่อง legacy แบบ single-account
ไปยัง `channels.<id>.accounts.*` โดยไม่ต้องโหลด full plugin entry
Matrix คือตัวอย่าง bundled ปัจจุบัน: มันจะย้ายเฉพาะคีย์ auth/bootstrap ไปยัง
บัญชี promoted ที่มีชื่อ เมื่อ named accounts มีอยู่แล้ว และมันสามารถคงค่า default-account key แบบไม่ canonical ที่กำหนดไว้ได้ แทนที่จะสร้าง
`accounts.default` เสมอ

setup patch adapters เหล่านั้นทำให้การค้นหา contract-surface ของ bundled เป็นแบบ lazy
ช่วง import ยังคงเบา; พื้นผิว promotion จะถูกโหลดเมื่อใช้ครั้งแรกเท่านั้น แทนที่จะย้อนกลับไปเริ่ม bundled channel startup ตอน import โมดูล

เมื่อพื้นผิว startup เหล่านั้นรวม gateway RPC methods ไว้ด้วย ให้เก็บไว้ภายใต้
prefix เฉพาะของ plugin namespaces สำหรับผู้ดูแลของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ resolve
เป็น `operator.admin` เสมอ แม้ plugin จะขอ scope ที่แคบกว่าก็ตาม

ตัวอย่าง:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### metadata ของ channel catalog

Channel plugins สามารถโฆษณา metadata สำหรับ setup/discovery ผ่าน `openclaw.channel` และ
คำใบ้การติดตั้งผ่าน `openclaw.install` วิธีนี้ทำให้ข้อมูล catalog ของ core ไม่ต้องผูกกับข้อมูลเฉพาะ

ตัวอย่าง:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "แชตแบบ self-hosted ผ่านบอต webhook ของ Nextcloud Talk",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

ฟิลด์ `openclaw.channel` ที่มีประโยชน์นอกเหนือจากตัวอย่างขั้นต่ำ:

- `detailLabel`: ป้ายรองสำหรับพื้นผิว catalog/status ที่ละเอียดขึ้น
- `docsLabel`: override ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่า ซึ่งรายการ catalog นี้ควรมีอันดับเหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความสำหรับพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าช่องนี้รองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องนี้จากพื้นผิวรายการช่องที่กำหนดค่าแล้วเมื่อกำหนดเป็น `false`
- `exposure.setup`: ซ่อนช่องนี้จากตัวเลือก setup/configure แบบโต้ตอบเมื่อกำหนดเป็น `false`
- `exposure.docs`: ทำเครื่องหมายว่าช่องนี้เป็น internal/private สำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบ legacy ที่ยังคงรองรับเพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: ให้ช่องนี้เลือกใช้โฟลว์ quickstart `allowFrom` แบบมาตรฐาน
- `forceAccountBinding`: บังคับให้ bind บัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับการ lookup session เมื่อ resolve announce targets

OpenClaw ยังสามารถ merge **external channel catalogs** ได้ด้วย (เช่น export จาก
registry ของ MPM) ให้วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือหลายไฟล์ (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควร
มีรูปแบบ `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังรองรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมของคีย์ `"entries"` ได้ด้วย

## Context engine plugins

Context engine plugins เป็นเจ้าของ orchestration ของ session context สำหรับการ ingest, assembly
และ Compaction ลงทะเบียนจาก plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` จากนั้นเลือก engine ที่ใช้งานอยู่ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ plugin ของคุณต้องการแทนที่หรือขยาย context
pipeline เริ่มต้น แทนที่จะเพียงเพิ่ม memory search หรือ hooks

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

หาก engine ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()`
ไว้และ delegate มันอย่างชัดเจน:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## การเพิ่ม capability ใหม่

เมื่อ plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้าม
ระบบ plugin ด้วยการเจาะเข้าถึงแบบ private ให้เพิ่ม capability ที่ขาดหายไปแทน

ลำดับที่แนะนำ:

1. กำหนด core contract
   ตัดสินใจว่าพฤติกรรมแบบใช้ร่วมกันใดที่ core ควรเป็นเจ้าของ: policy, fallback, config merge,
   lifecycle, semantics ที่หันออกสู่ channel และรูปร่างของ runtime helper
2. เพิ่มพื้นผิว plugin registration/runtime แบบมีชนิด
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิว capability แบบมีชนิด
   ที่เล็กที่สุดแต่มีประโยชน์
3. เชื่อมผู้ใช้จาก core + channel/feature
   channels และ feature plugins ควรใช้ capability ใหม่ผ่าน core
   ไม่ใช่ import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementation ของ vendor
   จากนั้น vendor plugins จึงลงทะเบียนแบ็กเอนด์ของตนเข้ากับ capability
5. เพิ่ม contract coverage
   เพิ่ม tests เพื่อให้ ownership และรูปร่างของการลงทะเบียนยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีจุดยืนได้โดยไม่กลายเป็นระบบที่ hardcode ตาม
โลกทัศน์ของผู้ให้บริการรายใดรายหนึ่ง ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับเช็กลิสต์ไฟล์แบบเป็นรูปธรรมและตัวอย่างที่ทำเสร็จแล้ว

### เช็กลิสต์ของ capability

เมื่อคุณเพิ่ม capability ใหม่ implementation โดยทั่วไปควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- ชนิดของ core contract ใน `src/<capability>/types.ts`
- runner/runtime helper ของ core ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน plugin API ใน `src/plugins/types.ts`
- การเชื่อม plugin registry ใน `src/plugins/registry.ts`
- การเปิดเผย plugin runtime ใน `src/plugins/runtime/*` เมื่อ feature/channel
  plugins ต้องใช้มัน
- helpers สำหรับ capture/test ใน `src/test-utils/plugin-registration.ts`
- การยืนยัน ownership/contract ใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับ operator/plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งขาดหายไป นั่นมักเป็นสัญญาณว่า capability
ยังไม่ได้ถูกรวมเข้ามาอย่างสมบูรณ์

### แม่แบบ capability

รูปแบบขั้นต่ำ:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

รูปแบบ contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

ทำให้กฎเรียบง่าย:

- core เป็นเจ้าของ capability contract + orchestration
- vendor plugins เป็นเจ้าของ implementation ของ vendor
- feature/channel plugins ใช้ runtime helpers
- contract tests ทำให้ ownership ชัดเจน
