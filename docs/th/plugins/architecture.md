---
read_when:
    - การบิลด์หรือดีบัก Plugin เนทีฟของ OpenClaw
    - ทำความเข้าใจโมเดลความสามารถของ Plugin หรือขอบเขตความเป็นเจ้าของ
    - การทำงานกับไปป์ไลน์การโหลด Plugin หรือรีจิสทรี
    - การใช้งานฮุกรันไทม์ของผู้ให้บริการหรือ Plugin ช่องทาง
sidebarTitle: Internals
summary: 'ภายในของ Plugin: แบบจำลองความสามารถ ความเป็นเจ้าของ สัญญา ไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: รายละเอียดภายในของ Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

นี่คือ **ข้อมูลอ้างอิงสถาปัตยกรรมเชิงลึก** สำหรับระบบ Plugin ของ OpenClaw สำหรับคู่มือเชิงปฏิบัติ ให้เริ่มจากหน้าที่เจาะจงด้านล่าง

<CardGroup cols={2}>
  <Card title="ติดตั้งและใช้ Plugin" icon="plug" href="/th/tools/plugin">
    คู่มือผู้ใช้สำหรับเพิ่ม เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="การสร้าง Plugin" icon="rocket" href="/th/plugins/building-plugins">
    บทเรียน Plugin แรกพร้อม manifest ที่ใช้งานได้ขนาดเล็กที่สุด
  </Card>
  <Card title="Plugin ช่องทาง" icon="comments" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="microchip" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิง import map และ API การลงทะเบียน
  </Card>
</CardGroup>

## โมเดลความสามารถสาธารณะ

ความสามารถคือโมเดล **Plugin ดั้งเดิม** สาธารณะภายใน OpenClaw Plugin ดั้งเดิมของ OpenClaw ทุกตัวจะลงทะเบียนกับประเภทความสามารถหนึ่งประเภทขึ้นไป:

| ความสามารถ             | วิธีลงทะเบียน                              | ตัวอย่าง Plugin                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| การอนุมานข้อความ         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| แบ็กเอนด์การอนุมาน CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| เสียงพูด                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| เสียงแบบเรียลไทม์       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| ความเข้าใจสื่อ           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| การสร้างภาพ              | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| การสร้างเพลง             | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| การสร้างวิดีโอ           | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| การดึงข้อมูลเว็บ         | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | `google`                             |
| ช่องทาง / การรับส่งข้อความ | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| การค้นพบ Gateway        | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin ที่ลงทะเบียนความสามารถเป็นศูนย์แต่มี hooks, tools, discovery services หรือ background services คือ Plugin **แบบ legacy hook-only** รูปแบบนี้ยังรองรับอย่างเต็มที่
</Note>

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดลความสามารถอยู่ใน core แล้วและใช้งานโดย Plugin แบบ bundled/native ในปัจจุบัน แต่ความเข้ากันได้ของ Plugin ภายนอกยังต้องมีเกณฑ์ที่เข้มกว่าคำว่า "ถูกส่งออกแล้ว ดังนั้นจึงถูกตรึงไว้"

| สถานการณ์ของ Plugin                                  | คำแนะนำ                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin ภายนอกที่มีอยู่                         | รักษาให้การผสานรวมแบบ hook ยังใช้งานได้ นี่คือ baseline ความเข้ากันได้                        |
| Plugin แบบ bundled/native ใหม่                        | ควรใช้การลงทะเบียนความสามารถแบบชัดเจนแทนการเข้าถึงเฉพาะ vendor หรือการออกแบบแบบ hook-only ใหม่ |
| Plugin ภายนอกที่นำการลงทะเบียนความสามารถมาใช้ | อนุญาต แต่ให้ถือว่าพื้นผิว helper เฉพาะความสามารถยังเปลี่ยนแปลงได้ เว้นแต่เอกสารระบุว่าเสถียร |

การลงทะเบียนความสามารถคือทิศทางที่ตั้งใจไว้ hooks เดิมยังคงเป็นเส้นทางที่ปลอดภัยที่สุดต่อการไม่ทำให้ Plugin ภายนอกเสียหายระหว่างช่วงเปลี่ยนผ่าน subpaths ของ helper ที่ส่งออกไม่ได้เท่ากันทั้งหมด — ควรใช้ contract แบบแคบที่มีเอกสารกำกับมากกว่า helper exports ที่เกิดขึ้นโดยบังเอิญ

### รูปทรงของ Plugin

OpenClaw จัดประเภท Plugin ที่โหลดทุกตัวเป็นรูปทรงตามพฤติกรรมการลงทะเบียนจริงของมัน (ไม่ใช่เฉพาะ metadata แบบคงที่):

<AccordionGroup>
  <Accordion title="plain-capability">
    ลงทะเบียนประเภทความสามารถเพียงหนึ่งประเภทพอดี (เช่น Plugin ที่เป็น provider-only อย่าง `mistral`)
  </Accordion>
  <Accordion title="hybrid-capability">
    ลงทะเบียนความสามารถหลายประเภท (เช่น `openai` เป็นเจ้าของการอนุมานข้อความ เสียงพูด ความเข้าใจสื่อ และการสร้างภาพ)
  </Accordion>
  <Accordion title="hook-only">
    ลงทะเบียนเฉพาะ hooks (typed หรือ custom) ไม่มีความสามารถ tools commands หรือ services
  </Accordion>
  <Accordion title="non-capability">
    ลงทะเบียน tools commands services หรือ routes แต่ไม่มีความสามารถ
  </Accordion>
</AccordionGroup>

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปทรงและรายละเอียดความสามารถของ Plugin ดูรายละเอียดที่ [ข้อมูลอ้างอิง CLI](/th/cli/plugins#inspect)

### Legacy hooks

hook `before_agent_start` ยังคงรองรับเป็นเส้นทางความเข้ากันได้สำหรับ Plugin แบบ hook-only Plugin ที่ใช้งานจริงแบบเดิมยังคงพึ่งพามันอยู่

ทิศทาง:

- รักษาให้มันใช้งานได้
- บันทึกไว้ในเอกสารว่าเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override โมเดล/provider
- ควรใช้ `before_prompt_build` สำหรับงานปรับเปลี่ยน prompt
- ลบเฉพาะหลังจากการใช้งานจริงลดลงและ coverage ของ fixture พิสูจน์ความปลอดภัยของการย้ายแล้ว

### สัญญาณความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็นป้ายกำกับเหล่านี้:

| สัญญาณ                     | ความหมาย                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config parse ได้ดีและ Plugin resolve ได้                       |
| **compatibility advisory** | Plugin ใช้รูปแบบที่รองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**         | Plugin ใช้ `before_agent_start` ซึ่งเลิกแนะนำให้ใช้แล้ว        |
| **hard error**             | Config ไม่ถูกต้องหรือ Plugin โหลดไม่สำเร็จ                   |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ Plugin ของคุณเสียหายในวันนี้: `hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` แค่ทำให้เกิดคำเตือน สัญญาณเหล่านี้ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ Plugin ของ OpenClaw มีสี่เลเยอร์:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw ค้นหา Plugin ผู้สมัครจาก paths ที่กำหนดค่าไว้, workspace roots, global plugin roots และ Plugin ที่ bundled ไว้ Discovery จะอ่าน manifest ดั้งเดิม `openclaw.plugin.json` รวมถึง bundle manifests ที่รองรับก่อน
  </Step>
  <Step title="Enablement + validation">
    Core ตัดสินว่า Plugin ที่ค้นพบจะถูกเปิดใช้งาน ปิดใช้งาน บล็อก หรือเลือกไว้สำหรับช่องแบบ exclusive เช่น memory
  </Step>
  <Step title="Runtime loading">
    Plugin ดั้งเดิมของ OpenClaw ถูกโหลดใน process ผ่าน jiti และลงทะเบียนความสามารถเข้า central registry bundle ที่เข้ากันได้จะถูก normalize เป็น registry records โดยไม่ต้อง import runtime code
  </Step>
  <Step title="Surface consumption">
    ส่วนที่เหลือของ OpenClaw อ่าน registry เพื่อเปิดเผย tools, channels, provider setup, hooks, HTTP routes, CLI commands และ services
  </Step>
</Steps>

สำหรับ CLI ของ Plugin โดยเฉพาะ การค้นพบคำสั่ง root ถูกแบ่งเป็นสองเฟส:

- metadata เวลา parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI จริงของ Plugin สามารถยังคง lazy และลงทะเบียนเมื่อถูกเรียกใช้ครั้งแรก

สิ่งนี้ทำให้โค้ด CLI ที่ Plugin เป็นเจ้าของอยู่ภายใน Plugin ขณะเดียวกันยังให้ OpenClaw จองชื่อคำสั่ง root ก่อน parse ได้

ขอบเขตการออกแบบที่สำคัญ:

- การตรวจสอบ manifest/config ควรทำงานจาก **manifest/schema metadata** ได้โดยไม่ต้อง execute โค้ด Plugin
- การค้นพบความสามารถดั้งเดิมอาจโหลด entry code ของ Plugin ที่เชื่อถือได้เพื่อสร้าง registry snapshot แบบไม่ activate
- พฤติกรรม runtime ดั้งเดิมมาจาก path `register(api)` ของโมดูล Plugin โดยมี `api.registrationMode === "full"`

การแยกนี้ช่วยให้ OpenClaw ตรวจสอบ config อธิบาย Plugin ที่หายไป/ถูกปิดใช้งาน และสร้างคำแนะนำ UI/schema ก่อนที่ runtime เต็มจะ active

### Snapshot metadata ของ Plugin และ lookup table

การเริ่มต้น Gateway สร้าง `PluginMetadataSnapshot` หนึ่งรายการสำหรับ config snapshot ปัจจุบัน snapshot นี้เป็น metadata-only: มันเก็บ installed plugin index, manifest registry, manifest diagnostics, owner maps, ตัว normalize id ของ Plugin และ manifest records มันไม่เก็บโมดูล Plugin ที่โหลดแล้ว, provider SDKs, package contents หรือ runtime exports

การตรวจสอบ config ที่รู้จัก Plugin, startup auto-enable และ bootstrap Plugin ของ Gateway ใช้ snapshot นั้นแทนการสร้าง manifest/index metadata ใหม่แยกกัน `PluginLookUpTable` ได้มาจาก snapshot เดียวกันและเพิ่ม startup plugin plan สำหรับ runtime config ปัจจุบัน

หลัง startup แล้ว Gateway จะเก็บ metadata snapshot ปัจจุบันเป็น runtime product ที่แทนที่ได้ การค้นพบ runtime provider ซ้ำๆ สามารถยืม snapshot นั้นแทนการ reconstruct installed index และ manifest registry สำหรับ provider-catalog pass แต่ละครั้ง snapshot จะถูกล้างหรือแทนที่เมื่อ Gateway shutdown, config/plugin inventory เปลี่ยนแปลง และ installed index writes; callers จะ fallback ไปยัง path manifest/index แบบ cold เมื่อไม่มี snapshot ปัจจุบันที่เข้ากันได้ การตรวจสอบความเข้ากันได้ต้องรวม plugin discovery roots เช่น `plugins.load.paths` และ default agent workspace เพราะ workspace plugins เป็นส่วนหนึ่งของ scope metadata

snapshot และ lookup table รักษาการตัดสินใจ startup ซ้ำๆ ให้อยู่บน fast path:

- ความเป็นเจ้าของช่องทาง
- การเริ่มต้นช่องทางแบบเลื่อนเวลา
- startup plugin ids
- ความเป็นเจ้าของ provider และ CLI backend
- ความเป็นเจ้าของ setup provider, command alias, model catalog provider และ manifest contract
- การตรวจสอบ schema config ของ Plugin และ schema config ของช่องทาง
- การตัดสินใจ startup auto-enable

ขอบเขตด้านความปลอดภัยคือการแทนที่ snapshot ไม่ใช่การกลายพันธุ์ สร้าง snapshot ใหม่เมื่อ config, plugin inventory, install records หรือ persisted index policy เปลี่ยนแปลง อย่าถือว่ามันเป็น broad mutable global registry และอย่าเก็บ historical snapshots แบบไร้ขอบเขต การโหลด runtime Plugin ยังคงแยกจาก metadata snapshots เพื่อไม่ให้ runtime state ที่เก่าถูกซ่อนไว้หลัง metadata cache

กฎ cache ถูกบันทึกไว้ใน [Plugin architecture internals](/th/plugins/architecture-internals#plugin-cache-boundary): manifest และ discovery metadata สดใหม่เสมอ เว้นแต่ caller จะถือ snapshot, lookup table หรือ manifest registry แบบ explicit สำหรับ flow ปัจจุบัน Hidden metadata caches และ wall-clock TTLs ไม่ใช่ส่วนหนึ่งของการโหลด Plugin เฉพาะ runtime loader, module และ dependency-artifact caches เท่านั้นที่อาจคงอยู่หลังจากโค้ดหรือ installed artifacts ถูกโหลดจริง

callers บางส่วนใน cold-path ยังคง reconstruct manifest registries โดยตรงจาก persisted installed plugin index แทนการรับ `PluginLookUpTable` ของ Gateway path นั้นตอนนี้ reconstruct registry on demand; ควรส่ง lookup table ปัจจุบันหรือ manifest registry แบบ explicit ผ่าน runtime flows เมื่อ caller มีอยู่แล้ว

### การวางแผน activation

การวางแผน activation เป็นส่วนหนึ่งของ control plane Callers สามารถถามได้ว่า Plugin ใดเกี่ยวข้องกับคำสั่ง provider ช่องทาง route agent harness หรือความสามารถที่เป็นรูปธรรม ก่อนโหลด runtime registries ที่กว้างขึ้น

planner รักษาพฤติกรรม manifest ปัจจุบันให้เข้ากันได้:

- ฟิลด์ `activation.*` เป็นคำใบ้ planner แบบ explicit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` และ hooks ยังคงเป็น manifest ownership fallback
- API ของ planner แบบ ids-only ยังคงพร้อมใช้งานสำหรับ callers ที่มีอยู่
- API ของ plan รายงานป้ายกำกับเหตุผลเพื่อให้ diagnostics แยกคำใบ้แบบ explicit ออกจาก ownership fallback ได้

<Warning>
อย่าถือว่า `activation` เป็นฮุกวงจรชีวิตหรือเป็นสิ่งทดแทน `register(...)` มันคือเมทาดาทาที่ใช้เพื่อจำกัดขอบเขตการโหลดให้แคบลง เลือกใช้ฟิลด์ความเป็นเจ้าของเมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์นั้นอยู่แล้ว ใช้ `activation` เฉพาะสำหรับคำใบ้เพิ่มเติมให้ตัววางแผนเท่านั้น
</Warning>

### Plugin ช่องทางและเครื่องมือข้อความที่ใช้ร่วมกัน

Plugin ช่องทางไม่จำเป็นต้องลงทะเบียนเครื่องมือส่ง/แก้ไข/แสดงปฏิกิริยาแยกต่างหากสำหรับการกระทำแชตทั่วไป OpenClaw เก็บเครื่องมือ `message` ที่ใช้ร่วมกันไว้หนึ่งตัวใน core และ Plugin ช่องทางเป็นเจ้าของการค้นหาและการดำเนินการเฉพาะช่องทางที่อยู่เบื้องหลังเครื่องมือนั้น

ขอบเขตปัจจุบันคือ:

- core เป็นเจ้าของโฮสต์เครื่องมือ `message` ที่ใช้ร่วมกัน การเดินสายพรอมป์ การทำบัญชีเซสชัน/เธรด และการส่งต่อการดำเนินการ
- Plugin ช่องทางเป็นเจ้าของการค้นหาการกระทำตามขอบเขต การค้นหาความสามารถ และส่วนย่อยสคีมาเฉพาะช่องทางใดๆ
- Plugin ช่องทางเป็นเจ้าของไวยากรณ์การสนทนาเซสชันเฉพาะผู้ให้บริการ เช่น วิธีที่รหัสการสนทนาเข้ารหัสรหัสเธรดหรือสืบทอดจากการสนทนาแม่
- Plugin ช่องทางดำเนินการขั้นสุดท้ายผ่านอะแดปเตอร์การกระทำของตน

สำหรับ Plugin ช่องทาง พื้นผิว SDK คือ `ChannelMessageActionAdapter.describeMessageTool(...)` การเรียกค้นหาแบบรวมนี้ช่วยให้ Plugin ส่งคืนการกระทำที่มองเห็นได้ ความสามารถ และส่วนที่เพิ่มในสคีมาพร้อมกัน เพื่อให้ส่วนเหล่านั้นไม่คลาดเคลื่อนจากกัน

เมื่อพารามิเตอร์เครื่องมือข้อความเฉพาะช่องทางมีแหล่งสื่อ เช่น พาธภายในเครื่องหรือ URL สื่อระยะไกล Plugin ควรส่งคืน `mediaSourceParams` จาก `describeMessageTool(...)` ด้วย core ใช้รายการแบบชัดเจนนี้เพื่อใช้การทำให้พาธ sandbox เป็นรูปแบบมาตรฐานและคำใบ้การเข้าถึงสื่อขาออก โดยไม่ฮาร์ดโค้ดชื่อพารามิเตอร์ที่ Plugin เป็นเจ้าของ ควรใช้แมปตามขอบเขตการกระทำที่นั่น ไม่ใช่รายการแบนทั้งช่องทาง เพื่อไม่ให้พารามิเตอร์สื่อที่ใช้เฉพาะโปรไฟล์ถูกทำให้เป็นรูปแบบมาตรฐานในการกระทำที่ไม่เกี่ยวข้อง เช่น `send`

core ส่งขอบเขตรันไทม์เข้าไปในขั้นตอนการค้นหานั้น ฟิลด์สำคัญได้แก่:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ขาเข้าที่เชื่อถือได้

สิ่งนี้สำคัญสำหรับ Plugin ที่ไวต่อบริบท ช่องทางสามารถซ่อนหรือแสดงการกระทำข้อความตามบัญชีที่ใช้งานอยู่ ห้อง/เธรด/ข้อความปัจจุบัน หรืออัตลักษณ์ผู้ร้องขอที่เชื่อถือได้ โดยไม่ต้องฮาร์ดโค้ดกิ่งเฉพาะช่องทางในเครื่องมือ `message` ของ core

นี่คือเหตุผลที่การเปลี่ยนแปลงการกำหนดเส้นทางของ embedded-runner ยังเป็นงานของ Plugin: runner รับผิดชอบการส่งต่ออัตลักษณ์แชต/เซสชันปัจจุบันเข้าไปยังขอบเขตการค้นหา Plugin เพื่อให้เครื่องมือ `message` ที่ใช้ร่วมกันแสดงพื้นผิวที่ช่องทางเป็นเจ้าของได้ถูกต้องสำหรับเทิร์นปัจจุบัน

สำหรับตัวช่วยดำเนินการที่ช่องทางเป็นเจ้าของ Plugin ที่บันเดิลมาควรเก็บรันไทม์การดำเนินการไว้ภายในโมดูลส่วนขยายของตนเอง core ไม่ได้เป็นเจ้าของรันไทม์การกระทำข้อความของ Discord, Slack, Telegram หรือ WhatsApp ภายใต้ `src/agents/tools` อีกต่อไป เราไม่ได้เผยแพร่ subpath `plugin-sdk/*-action-runtime` แยกต่างหาก และ Plugin ที่บันเดิลมาควรนำเข้าโค้ดรันไทม์ภายในของตนเองโดยตรงจากโมดูลที่ส่วนขยายของตนเป็นเจ้าของ

ขอบเขตเดียวกันนี้ใช้กับ seam ของ SDK ที่ตั้งชื่อตามผู้ให้บริการโดยทั่วไปด้วย: core ไม่ควรนำเข้า barrel อำนวยความสะดวกเฉพาะช่องทางสำหรับ Slack, Discord, Signal, WhatsApp หรือส่วนขยายที่คล้ายกัน ถ้า core ต้องการพฤติกรรมใด ให้ใช้ barrel `api.ts` / `runtime-api.ts` ของ Plugin ที่บันเดิลมาเอง หรือยกระดับความต้องการนั้นเป็นความสามารถทั่วไปที่แคบใน SDK ที่ใช้ร่วมกัน

Plugin ที่บันเดิลมาปฏิบัติตามกฎเดียวกัน `runtime-api.ts` ของ Plugin ที่บันเดิลมาไม่ควร re-export facade `openclaw/plugin-sdk/<plugin-id>` ที่มีแบรนด์ของตนเอง facade ที่มีแบรนด์เหล่านั้นยังคงเป็น compatibility shim สำหรับ Plugin ภายนอกและผู้บริโภครุ่นเก่า แต่ Plugin ที่บันเดิลมาควรใช้ export ภายในพร้อมกับ subpath SDK ทั่วไปที่แคบ เช่น `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` หรือ `openclaw/plugin-sdk/webhook-ingress` โค้ดใหม่ไม่ควรเพิ่ม facade SDK เฉพาะรหัส Plugin เว้นแต่ขอบเขตความเข้ากันได้สำหรับระบบนิเวศภายนอกที่มีอยู่ต้องการสิ่งนั้น

สำหรับโพลโดยเฉพาะ มีเส้นทางการดำเนินการสองแบบ:

- `outbound.sendPoll` คือค่าพื้นฐานที่ใช้ร่วมกันสำหรับช่องทางที่เข้ากับโมเดลโพลทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่แนะนำสำหรับความหมายของโพลเฉพาะช่องทางหรือพารามิเตอร์โพลเพิ่มเติม

ตอนนี้ core เลื่อนการแยกวิเคราะห์โพลที่ใช้ร่วมกันออกไปจนกว่าการส่งต่อโพลของ Plugin จะปฏิเสธการกระทำนั้น เพื่อให้ตัวจัดการโพลที่ Plugin เป็นเจ้าของสามารถรับฟิลด์โพลเฉพาะช่องทางได้โดยไม่ถูกตัวแยกวิเคราะห์โพลทั่วไปขวางไว้ก่อน

ดู [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals) สำหรับลำดับการเริ่มต้นแบบเต็ม

## โมเดลความเป็นเจ้าของความสามารถ

OpenClaw ถือว่า Plugin แบบเนทีฟเป็นขอบเขตความเป็นเจ้าของสำหรับ **บริษัท** หรือ **ฟีเจอร์** ไม่ใช่ที่รวมการผสานรวมที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- โดยทั่วไป Plugin ของบริษัทควรเป็นเจ้าของพื้นผิวที่หันเข้าหา OpenClaw ทั้งหมดของบริษัทนั้น
- โดยทั่วไป Plugin ของฟีเจอร์ควรเป็นเจ้าของพื้นผิวเต็มของฟีเจอร์ที่มันนำเข้ามา
- ช่องทางควรใช้ความสามารถ core ที่ใช้ร่วมกัน แทนที่จะนำพฤติกรรมผู้ให้บริการไปทำซ้ำแบบเฉพาะกิจ

<AccordionGroup>
  <Accordion title="หลายความสามารถของผู้ขาย">
    `openai` เป็นเจ้าของการอนุมานข้อความ เสียงพูด เสียงแบบเรียลไทม์ ความเข้าใจสื่อ และการสร้างภาพ `google` เป็นเจ้าของการอนุมานข้อความ รวมถึงความเข้าใจสื่อ การสร้างภาพ และการค้นเว็บ `qwen` เป็นเจ้าของการอนุมานข้อความ รวมถึงความเข้าใจสื่อและการสร้างวิดีโอ
  </Accordion>
  <Accordion title="ความสามารถเดี่ยวของผู้ขาย">
    `elevenlabs` และ `microsoft` เป็นเจ้าของเสียงพูด; `firecrawl` เป็นเจ้าของ web-fetch; `minimax` / `mistral` / `moonshot` / `zai` เป็นเจ้าของแบ็กเอนด์ความเข้าใจสื่อ
  </Accordion>
  <Accordion title="Plugin ฟีเจอร์">
    `voice-call` เป็นเจ้าของการขนส่งการโทร เครื่องมือ CLI route และการเชื่อมสะพาน media-stream ของ Twilio แต่ใช้ความสามารถเสียงพูด การถอดเสียงแบบเรียลไทม์ และเสียงแบบเรียลไทม์ที่ใช้ร่วมกันแทนการนำเข้า Plugin ของผู้ขายโดยตรง
  </Accordion>
</AccordionGroup>

สถานะปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน Plugin เดียว แม้ว่าจะครอบคลุมโมเดลข้อความ เสียงพูด ภาพ และวิดีโอในอนาคต
- ผู้ขายรายอื่นสามารถทำแบบเดียวกันกับพื้นที่พื้นผิวของตนเอง
- ช่องทางไม่สนใจว่า Plugin ของผู้ขายรายใดเป็นเจ้าของผู้ให้บริการ ช่องทางใช้สัญญาความสามารถที่ใช้ร่วมกันซึ่ง core เปิดเผย

นี่คือความแตกต่างสำคัญ:

- **plugin** = ขอบเขตความเป็นเจ้าของ
- **capability** = สัญญา core ที่ Plugin หลายตัวสามารถ implement หรือใช้ได้

ดังนั้นถ้า OpenClaw เพิ่มโดเมนใหม่ เช่น วิดีโอ คำถามแรกไม่ใช่ "ผู้ให้บริการรายใดควรฮาร์ดโค้ดการจัดการวิดีโอ?" คำถามแรกคือ "สัญญาความสามารถวิดีโอของ core คืออะไร?" เมื่อสัญญานั้นมีแล้ว Plugin ของผู้ขายสามารถลงทะเบียนกับสัญญานั้น และ Plugin ช่องทาง/ฟีเจอร์สามารถใช้งานได้

ถ้าความสามารถนั้นยังไม่มี แนวทางที่ถูกต้องมักเป็น:

<Steps>
  <Step title="กำหนดความสามารถ">
    กำหนดความสามารถที่ขาดหายใน core
  </Step>
  <Step title="เปิดเผยผ่าน SDK">
    เปิดเผยมันผ่าน API/รันไทม์ Plugin แบบมีชนิดข้อมูล
  </Step>
  <Step title="เดินสายผู้บริโภค">
    เดินสายช่องทาง/ฟีเจอร์กับความสามารถนั้น
  </Step>
  <Step title="implementation ของผู้ขาย">
    ให้ Plugin ของผู้ขายลงทะเบียน implementation
  </Step>
</Steps>

สิ่งนี้ทำให้ความเป็นเจ้าของชัดเจน ขณะเดียวกันก็หลีกเลี่ยงพฤติกรรม core ที่ขึ้นกับผู้ขายรายเดียวหรือเส้นทางโค้ดเฉพาะ Plugin แบบใช้ครั้งเดียว

### การจัดชั้นความสามารถ

ใช้โมเดลความคิดนี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ไหน:

<Tabs>
  <Tab title="ชั้นความสามารถ core">
    การประสานงาน นโยบาย fallback กฎการผสาน config ความหมายการส่งมอบ และสัญญาแบบมีชนิดข้อมูลที่ใช้ร่วมกัน
  </Tab>
  <Tab title="ชั้น Plugin ของผู้ขาย">
    API เฉพาะผู้ขาย auth แคตตาล็อกโมเดล การสังเคราะห์เสียงพูด การสร้างภาพ แบ็กเอนด์วิดีโอในอนาคต endpoint การใช้งาน
  </Tab>
  <Tab title="ชั้น Plugin ช่องทาง/ฟีเจอร์">
    การผสานรวม Slack/Discord/voice-call/อื่นๆ ที่ใช้ความสามารถ core และนำเสนอความสามารถเหล่านั้นบนพื้นผิวหนึ่ง
  </Tab>
</Tabs>

ตัวอย่างเช่น TTS เป็นไปตามรูปทรงนี้:

- core เป็นเจ้าของนโยบาย TTS ตอนตอบกลับ ลำดับ fallback ค่ากำหนด และการส่งมอบผ่านช่องทาง
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementation การสังเคราะห์
- `voice-call` ใช้ตัวช่วยรันไทม์ TTS สำหรับโทรศัพท์

ควรใช้รูปแบบเดียวกันนี้สำหรับความสามารถในอนาคต

### ตัวอย่าง Plugin บริษัทแบบหลายความสามารถ

Plugin ของบริษัทควรรู้สึกเป็นหนึ่งเดียวกันจากภายนอก ถ้า OpenClaw มีสัญญาที่ใช้ร่วมกันสำหรับโมเดล เสียงพูด การถอดเสียงแบบเรียลไทม์ เสียงแบบเรียลไทม์ ความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ การดึงเว็บ และการค้นเว็บ ผู้ขายสามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนได้ในที่เดียว:

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

สิ่งที่สำคัญไม่ใช่ชื่อ helper ที่ตรงกันเป๊ะ แต่เป็นรูปทรง:

- Plugin เดียวเป็นเจ้าของพื้นผิวของผู้ขาย
- core ยังคงเป็นเจ้าของสัญญาความสามารถ
- ช่องทางและ Plugin ฟีเจอร์ใช้ helper `api.runtime.*` ไม่ใช่โค้ดของผู้ขาย
- การทดสอบสัญญาสามารถยืนยันได้ว่า Plugin ลงทะเบียนความสามารถที่อ้างว่าเป็นเจ้าของแล้ว

### ตัวอย่างความสามารถ: ความเข้าใจวิดีโอ

OpenClaw ถือว่าความเข้าใจภาพ/เสียง/วิดีโอเป็นความสามารถที่ใช้ร่วมกันหนึ่งเดียวอยู่แล้ว โมเดลความเป็นเจ้าของเดียวกันใช้กับสิ่งนี้ด้วย:

<Steps>
  <Step title="core กำหนดสัญญา">
    core กำหนดสัญญาความเข้าใจสื่อ
  </Step>
  <Step title="Plugin ของผู้ขายลงทะเบียน">
    Plugin ของผู้ขายลงทะเบียน `describeImage`, `transcribeAudio` และ `describeVideo` ตามที่ใช้ได้
  </Step>
  <Step title="ผู้บริโภคใช้พฤติกรรมที่ใช้ร่วมกัน">
    ช่องทางและ Plugin ฟีเจอร์ใช้พฤติกรรม core ที่ใช้ร่วมกันแทนการเดินสายไปยังโค้ดผู้ขายโดยตรง
  </Step>
</Steps>

สิ่งนั้นหลีกเลี่ยงการฝังสมมติฐานวิดีโอของผู้ให้บริการรายเดียวเข้าไปใน core Plugin เป็นเจ้าของพื้นผิวของผู้ขาย; core เป็นเจ้าของสัญญาความสามารถและพฤติกรรม fallback

การสร้างวิดีโอใช้ลำดับเดียวกันนั้นอยู่แล้ว: core เป็นเจ้าของสัญญาความสามารถแบบมีชนิดข้อมูลและ helper รันไทม์ และ Plugin ของผู้ขายลงทะเบียน implementation `api.registerVideoGenerationProvider(...)` กับสัญญานั้น

ต้องการเช็กลิสต์การ rollout ที่เป็นรูปธรรมหรือไม่? ดู [Capability Cookbook](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว API ของ Plugin ถูกทำให้มีชนิดข้อมูลและรวมศูนย์ไว้ใน `OpenClawPluginApi` โดยตั้งใจ สัญญานั้นกำหนดจุดลงทะเบียนที่รองรับและ helper รันไทม์ที่ Plugin สามารถพึ่งพาได้

เหตุผลที่สิ่งนี้สำคัญ:

- ผู้เขียน Plugin ได้มาตรฐานภายในที่เสถียรหนึ่งเดียว
- core สามารถปฏิเสธความเป็นเจ้าของซ้ำซ้อน เช่น Plugin สองตัวลงทะเบียนรหัสผู้ให้บริการเดียวกัน
- การเริ่มต้นสามารถแสดงการวินิจฉัยที่นำไปดำเนินการได้สำหรับการลงทะเบียนที่ผิดรูปแบบ
- การทดสอบสัญญาสามารถบังคับใช้ความเป็นเจ้าของของ Plugin ที่บันเดิลมาและป้องกันการคลาดเคลื่อนแบบเงียบ

มีการบังคับใช้สองชั้น:

<AccordionGroup>
  <Accordion title="การบังคับใช้การลงทะเบียนขณะรันไทม์">
    รีจิสทรีของ Plugin ตรวจสอบการลงทะเบียนขณะโหลด Plugin ตัวอย่างเช่น id ของผู้ให้บริการที่ซ้ำกัน, id ของผู้ให้บริการเสียงพูดที่ซ้ำกัน และการลงทะเบียนที่มีรูปแบบไม่ถูกต้อง จะสร้าง diagnostics ของ Plugin แทนพฤติกรรมที่ไม่ถูกกำหนด
  </Accordion>
  <Accordion title="การทดสอบสัญญา">
    Plugin ที่มาพร้อมระบบจะถูกบันทึกไว้ในรีจิสทรีสัญญาระหว่างการทดสอบ เพื่อให้ OpenClaw สามารถยืนยันความเป็นเจ้าของได้อย่างชัดเจน ปัจจุบันใช้สิ่งนี้กับผู้ให้บริการโมเดล, ผู้ให้บริการเสียงพูด, ผู้ให้บริการค้นหาเว็บ และความเป็นเจ้าของการลงทะเบียนที่มาพร้อมระบบ
  </Accordion>
</AccordionGroup>

ผลในทางปฏิบัติคือ OpenClaw รู้ล่วงหน้าว่า Plugin ใดเป็นเจ้าของพื้นผิวใด สิ่งนี้ทำให้ core และช่องทางต่างๆ ประกอบเข้าด้วยกันได้อย่างราบรื่น เพราะความเป็นเจ้าของถูกประกาศ มีชนิดข้อมูล และทดสอบได้ แทนที่จะเป็นสิ่งที่แฝงอยู่

### สิ่งที่ควรอยู่ในสัญญา

<Tabs>
  <Tab title="สัญญาที่ดี">
    - มีชนิดข้อมูล
    - เล็ก
    - เฉพาะความสามารถ
    - core เป็นเจ้าของ
    - ใช้ซ้ำได้โดย Plugin หลายตัว
    - ช่องทาง/ฟีเจอร์ใช้งานได้โดยไม่ต้องรู้จักผู้ขาย

  </Tab>
  <Tab title="สัญญาที่ไม่ดี">
    - นโยบายเฉพาะผู้ขายที่ซ่อนอยู่ใน core
    - ช่องทางหลบเลี่ยงเฉพาะ Plugin แบบใช้ครั้งเดียวที่ข้ามรีจิสทรี
    - โค้ดช่องทางเข้าถึงอิมพลีเมนเทชันของผู้ขายโดยตรง
    - ออบเจ็กต์รันไทม์เฉพาะกิจที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ `api.runtime`

  </Tab>
</Tabs>

เมื่อไม่แน่ใจ ให้ยกระดับ abstraction: กำหนดความสามารถก่อน แล้วให้ Plugin เข้ามาเชื่อมต่อกับความสามารถนั้น

## โมเดลการประมวลผล

Plugin แบบเนทีฟของ OpenClaw ทำงาน **ในโปรเซสเดียวกัน** กับ Gateway โดยไม่ได้ถูก sandbox Plugin แบบเนทีฟที่โหลดแล้วมีขอบเขตความไว้วางใจระดับโปรเซสเดียวกับโค้ด core

<Warning>
ผลกระทบของ Plugin แบบเนทีฟ: Plugin สามารถลงทะเบียนเครื่องมือ, ตัวจัดการเครือข่าย, hook และบริการได้; บั๊กของ Plugin อาจทำให้ gateway ล่มหรือไม่เสถียร; และ Plugin แบบเนทีฟที่เป็นอันตรายเทียบเท่ากับการรันโค้ดใดๆ ก็ได้ภายในโปรเซสของ OpenClaw
</Warning>

บันเดิลที่เข้ากันได้ปลอดภัยกว่าโดยค่าเริ่มต้น เพราะปัจจุบัน OpenClaw ปฏิบัติต่อบันเดิลเหล่านั้นเป็นแพ็ก metadata/เนื้อหา ในรุ่นปัจจุบัน ส่วนใหญ่หมายถึง Skills ที่มาพร้อมระบบ

ใช้ allowlist และเส้นทางติดตั้ง/โหลดที่ชัดเจนสำหรับ Plugin ที่ไม่ได้มาพร้อมระบบ ปฏิบัติต่อ Plugin ในเวิร์กสเปซเป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับโปรดักชัน

สำหรับชื่อแพ็กเกจเวิร์กสเปซที่มาพร้อมระบบ ให้ยึด id ของ Plugin กับชื่อ npm: ค่าเริ่มต้นคือ `@openclaw/<id>` หรือ suffix แบบมีชนิดที่ได้รับอนุมัติ เช่น `-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อแพ็กเกจตั้งใจเปิดเผยบทบาท Plugin ที่แคบกว่า

<Note>
**หมายเหตุด้านความไว้วางใจ:** `plugins.allow` ไว้วางใจ **id ของ Plugin** ไม่ใช่แหล่งที่มา Plugin ในเวิร์กสเปซที่มี id เดียวกับ Plugin ที่มาพร้อมระบบจะบังสำเนาที่มาพร้อมระบบโดยเจตนา เมื่อ Plugin ในเวิร์กสเปซนั้นถูกเปิดใช้/อยู่ใน allowlist สิ่งนี้เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง, การทดสอบแพตช์ และ hotfix ความไว้วางใจของ Plugin ที่มาพร้อมระบบจะถูกตัดสินจากสแนปช็อตของซอร์ส ได้แก่ manifest และโค้ดบนดิสก์ ณ เวลาโหลด ไม่ใช่จาก metadata การติดตั้ง ระเบียนการติดตั้งที่เสียหายหรือถูกแทนที่ไม่สามารถขยายพื้นผิวความไว้วางใจของ Plugin ที่มาพร้อมระบบให้กว้างกว่าที่ซอร์สจริงประกาศไว้อย่างเงียบๆ ได้
</Note>

## ขอบเขตการส่งออก

OpenClaw ส่งออกความสามารถ ไม่ใช่ความสะดวกของอิมพลีเมนเทชัน

ให้การลงทะเบียนความสามารถเป็นสาธารณะ ตัด export ของ helper ที่ไม่ใช่สัญญาออก:

- subpath helper เฉพาะ Plugin ที่มาพร้อมระบบ
- subpath งานระบบรันไทม์ที่ไม่ได้ตั้งใจให้เป็น API สาธารณะ
- helper เพื่อความสะดวกเฉพาะผู้ขาย
- helper การตั้งค่า/onboarding ที่เป็นรายละเอียดอิมพลีเมนเทชัน

subpath helper ที่สงวนไว้สำหรับ Plugin ที่มาพร้อมระบบถูกเลิกใช้จาก export map ของ SDK ที่สร้างแล้ว เก็บ helper เฉพาะเจ้าของไว้ภายในแพ็กเกจ Plugin ที่เป็นเจ้าของ; โปรโมตเฉพาะพฤติกรรม host ที่ใช้ซ้ำได้ไปเป็นสัญญา SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`

## รายละเอียดภายในและข้อมูลอ้างอิง

สำหรับ pipeline การโหลด, โมเดลรีจิสทรี, hook รันไทม์ของผู้ให้บริการ, เส้นทาง HTTP ของ Gateway, schema ของเครื่องมือข้อความ, การแก้ target ของช่องทาง, แค็ตตาล็อกผู้ให้บริการ, Plugin ของ context engine และคู่มือการเพิ่มความสามารถใหม่ โปรดดู [รายละเอียดภายในของสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
