---
read_when:
    - การสร้างหรือดีบัก Plugin เนทีฟของ OpenClaw
    - การทำความเข้าใจโมเดลความสามารถของ Plugin หรือขอบเขตความเป็นเจ้าของ
    - กำลังทำงานกับไปป์ไลน์การโหลด Plugin หรือรีจิสทรี
    - การใช้งานฮุกของรันไทม์ผู้ให้บริการหรือ Plugin ช่องทาง
sidebarTitle: Internals
summary: 'กลไกภายในของ Plugin: โมเดลความสามารถ ความเป็นเจ้าของ สัญญา ไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: ภายในของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

นี่คือ**เอกสารอ้างอิงสถาปัตยกรรมเชิงลึก**สำหรับระบบ Plugin ของ OpenClaw สำหรับคู่มือเชิงปฏิบัติ ให้เริ่มจากหน้าที่เจาะจงด้านล่างนี้

<CardGroup cols={2}>
  <Card title="ติดตั้งและใช้ Plugin" icon="plug" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการเพิ่ม เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="การสร้าง Plugin" icon="rocket" href="/th/plugins/building-plugins">
    บทช่วยสอน Plugin แรกพร้อม manifest ที่เล็กที่สุดซึ่งใช้งานได้
  </Card>
  <Card title="Plugin ช่องทาง" icon="comments" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="microchip" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book" href="/th/plugins/sdk-overview">
    เอกสารอ้างอิง import map และ API การลงทะเบียน
  </Card>
</CardGroup>

## โมเดลความสามารถสาธารณะ

ความสามารถคือโมเดล **Plugin แบบเนทีฟ**สาธารณะภายใน OpenClaw Plugin แบบเนทีฟของ OpenClaw ทุกตัวจะลงทะเบียนกับประเภทความสามารถอย่างน้อยหนึ่งประเภท:

| ความสามารถ             | วิธีลงทะเบียน                              | ตัวอย่าง Plugin                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| การอนุมานข้อความ         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| แบ็กเอนด์การอนุมาน CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Plugin เวกเตอร์ที่ผู้ให้บริการเป็นเจ้าของ        |
| เสียงพูด                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| การเข้าใจสื่อ            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| แหล่งที่มาของ transcript | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| การสร้างภาพ             | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| การสร้างเพลง            | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| การสร้างวิดีโอ           | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| การดึงข้อมูลเว็บ         | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| การค้นหาเว็บ            | `api.registerWebSearchProvider(...)`             | `google`                             |
| ช่องทาง / การรับส่งข้อความ | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| การค้นพบ Gateway        | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin ที่ลงทะเบียนความสามารถเป็นศูนย์ แต่มี hooks, เครื่องมือ, บริการค้นพบ หรือบริการเบื้องหลัง คือ Plugin แบบ **legacy hook-only** รูปแบบนี้ยังคงรองรับเต็มรูปแบบ
</Note>

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดลความสามารถถูกนำเข้า core แล้วและใช้งานโดย Plugin แบบ bundled/เนทีฟในปัจจุบัน แต่ความเข้ากันได้ของ Plugin ภายนอกยังต้องมีเกณฑ์ที่เข้มงวดกว่า "ถูก export แล้ว จึงถือว่าคงที่"

| สถานการณ์ของ Plugin                                  | แนวทาง                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin ภายนอกที่มีอยู่                         | รักษาให้ integration แบบ hook-based ใช้งานได้ต่อไป นี่คือ baseline ด้านความเข้ากันได้                        |
| Plugin แบบ bundled/เนทีฟใหม่                        | ควรใช้การลงทะเบียนความสามารถอย่างชัดเจนแทนการเข้าถึงเฉพาะผู้จำหน่ายหรือการออกแบบใหม่แบบ hook-only |
| Plugin ภายนอกที่นำการลงทะเบียนความสามารถมาใช้ | อนุญาต แต่ให้ถือว่าพื้นผิว helper เฉพาะความสามารถยังอาจเปลี่ยนแปลงได้ เว้นแต่ docs ระบุว่า stable |

การลงทะเบียนความสามารถคือทิศทางที่ตั้งใจไว้ Legacy hooks ยังคงเป็นเส้นทางที่ปลอดภัยที่สุดจากการเปลี่ยนแปลงที่ทำให้แตกหักสำหรับ Plugin ภายนอกระหว่างช่วงเปลี่ยนผ่าน subpath helper ที่ถูก export ไม่ได้เท่าเทียมกันทั้งหมด — ควรใช้สัญญาแคบ ๆ ที่มีเอกสารกำกับแทน export helper ที่เกิดขึ้นโดยบังเอิญ

### รูปร่างของ Plugin

OpenClaw จัดประเภท Plugin ทุกตัวที่โหลดแล้วเป็นรูปร่างตามพฤติกรรมการลงทะเบียนจริงของมัน (ไม่ใช่เพียง metadata แบบคงที่):

<AccordionGroup>
  <Accordion title="plain-capability">
    ลงทะเบียนประเภทความสามารถเดียวเท่านั้น (เช่น Plugin ที่เป็นผู้ให้บริการอย่างเดียว เช่น `mistral`)
  </Accordion>
  <Accordion title="hybrid-capability">
    ลงทะเบียนความสามารถหลายประเภท (เช่น `openai` เป็นเจ้าของการอนุมานข้อความ เสียงพูด การเข้าใจสื่อ และการสร้างภาพ)
  </Accordion>
  <Accordion title="hook-only">
    ลงทะเบียนเฉพาะ hooks (แบบมี type หรือแบบกำหนดเอง) ไม่มีความสามารถ เครื่องมือ คำสั่ง หรือบริการ
  </Accordion>
  <Accordion title="non-capability">
    ลงทะเบียนเครื่องมือ คำสั่ง บริการ หรือ routes แต่ไม่มีความสามารถ
  </Accordion>
</AccordionGroup>

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปร่างของ Plugin และรายละเอียดความสามารถ ดูรายละเอียดที่ [เอกสารอ้างอิง CLI](/th/cli/plugins#inspect)

### Legacy hooks

hook `before_agent_start` ยังคงรองรับเป็นเส้นทางความเข้ากันได้สำหรับ Plugin แบบ hook-only Plugin จริงแบบ legacy ยังพึ่งพามันอยู่

ทิศทาง:

- รักษาให้ใช้งานได้ต่อไป
- ระบุในเอกสารว่าเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override โมเดล/ผู้ให้บริการ
- ควรใช้ `before_prompt_build` สำหรับงานแก้ไข prompt
- ลบออกหลังจากการใช้งานจริงลดลงแล้วเท่านั้น และ coverage ของ fixture พิสูจน์ว่าการ migration ปลอดภัย

### สัญญาณความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็นป้ายกำกับเหล่านี้:

| สัญญาณ                     | ความหมาย                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config parse ได้ถูกต้องและ Plugin resolve ได้                       |
| **compatibility advisory** | Plugin ใช้รูปแบบที่รองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**         | Plugin ใช้ `before_agent_start` ซึ่งถูกเลิกแนะนำแล้ว        |
| **hard error**             | Config ไม่ถูกต้องหรือ Plugin โหลดไม่สำเร็จ                   |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ Plugin ของคุณพังในวันนี้: `hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะทำให้เกิดเฉพาะคำเตือนเท่านั้น สัญญาณเหล่านี้ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ Plugin ของ OpenClaw มีสี่ชั้น:

<Steps>
  <Step title="Manifest + การค้นพบ">
    OpenClaw ค้นหา Plugin ตัวเลือกจาก path ที่กำหนดค่าไว้, workspace roots, global plugin roots และ bundled plugins การค้นพบจะอ่าน manifest แบบเนทีฟ `openclaw.plugin.json` รวมถึง bundle manifests ที่รองรับก่อน
  </Step>
  <Step title="การเปิดใช้งาน + การตรวจสอบความถูกต้อง">
    Core ตัดสินว่า Plugin ที่ค้นพบควรเปิดใช้งาน ปิดใช้งาน บล็อก หรือเลือกสำหรับ slot แบบ exclusive เช่น memory
  </Step>
  <Step title="การโหลด runtime">
    Plugin แบบเนทีฟของ OpenClaw จะถูกโหลดใน process และลงทะเบียนความสามารถลงใน registry กลาง JavaScript แบบ packaged โหลดผ่าน `require` แบบเนทีฟ ส่วน TypeScript จาก source ภายในเครื่องของบุคคลที่สามเป็น fallback ฉุกเฉินของ Jiti bundle ที่เข้ากันได้จะถูก normalize เป็น registry records โดยไม่ import runtime code
  </Step>
  <Step title="การใช้งานพื้นผิว">
    ส่วนอื่นของ OpenClaw อ่าน registry เพื่อเปิดเผยเครื่องมือ ช่องทาง การตั้งค่าผู้ให้บริการ hooks, HTTP routes, คำสั่ง CLI และบริการ
  </Step>
</Steps>

สำหรับ CLI ของ Plugin โดยเฉพาะ การค้นพบคำสั่ง root แบ่งเป็นสองระยะ:

- metadata ขณะ parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI จริงของ Plugin สามารถยังคง lazy และลงทะเบียนเมื่อถูกเรียกใช้งานครั้งแรก

สิ่งนี้ทำให้ code CLI ที่ Plugin เป็นเจ้าของอยู่ภายใน Plugin ขณะเดียวกันยังให้ OpenClaw จองชื่อคำสั่ง root ก่อน parse ได้

ขอบเขตการออกแบบที่สำคัญ:

- การตรวจสอบ manifest/config ควรทำงานได้จาก **manifest/schema metadata** โดยไม่ execute code ของ Plugin
- การค้นพบความสามารถแบบเนทีฟอาจโหลด entry code ของ Plugin ที่เชื่อถือได้เพื่อสร้าง snapshot ของ registry ที่ไม่ activate
- พฤติกรรม runtime แบบเนทีฟมาจาก path `register(api)` ของโมดูล Plugin พร้อม `api.registrationMode === "full"`

การแยกนี้ทำให้ OpenClaw ตรวจสอบ config, อธิบาย Plugin ที่หายไป/ถูกปิดใช้งาน และสร้างคำใบ้ UI/schema ก่อน runtime เต็มรูปแบบจะ active

### Snapshot metadata ของ Plugin และ lookup table

การเริ่มต้น Gateway สร้าง `PluginMetadataSnapshot` หนึ่งรายการสำหรับ snapshot config ปัจจุบัน snapshot นี้เป็น metadata-only: มันเก็บ installed plugin index, manifest registry, manifest diagnostics, owner maps, normalizer ของ plugin id และ manifest records มันไม่เก็บโมดูล Plugin ที่โหลดแล้ว, provider SDKs, package contents หรือ runtime exports

การตรวจสอบ config แบบรู้จัก Plugin, startup auto-enable และ bootstrap Plugin ของ Gateway ใช้ snapshot นั้นแทนการ rebuild manifest/index metadata แยกกัน `PluginLookUpTable` ถูก derive จาก snapshot เดียวกันและเพิ่ม startup plugin plan สำหรับ config runtime ปัจจุบัน

หลัง startup Gateway เก็บ metadata snapshot ปัจจุบันเป็นผลิตภัณฑ์ runtime ที่เปลี่ยนแทนได้ การค้นพบผู้ให้บริการ runtime ซ้ำ ๆ สามารถยืม snapshot นั้นแทนการ reconstruct installed index และ manifest registry สำหรับแต่ละรอบ provider-catalog snapshot จะถูกล้างหรือแทนที่เมื่อ Gateway shutdown, config/plugin inventory เปลี่ยน และมีการเขียน installed index; caller จะ fallback ไปยัง path manifest/index แบบเย็นเมื่อไม่มี snapshot ปัจจุบันที่เข้ากันได้ การตรวจสอบความเข้ากันได้ต้องรวม plugin discovery roots เช่น `plugins.load.paths` และ workspace agent เริ่มต้น เพราะ workspace plugins เป็นส่วนหนึ่งของขอบเขต metadata

snapshot และ lookup table ทำให้การตัดสินใจ startup ซ้ำ ๆ อยู่บน fast path:

- ความเป็นเจ้าของช่องทาง
- การ startup ช่องทางแบบ deferred
- startup plugin ids
- ความเป็นเจ้าของผู้ให้บริการและ CLI backend
- ความเป็นเจ้าของ setup provider, command alias, model catalog provider และ manifest contract
- การตรวจสอบ plugin config schema และ channel config schema
- การตัดสินใจ startup auto-enable

ขอบเขตความปลอดภัยคือการแทนที่ snapshot ไม่ใช่การ mutate ให้ rebuild snapshot เมื่อ config, plugin inventory, install records หรือนโยบาย persisted index เปลี่ยน อย่าถือว่ามันเป็น registry แบบ global ที่ mutable กว้าง ๆ และอย่าเก็บ snapshot ประวัติไว้แบบไม่จำกัด การโหลด Plugin runtime ยังคงแยกจาก metadata snapshots เพื่อไม่ให้ state runtime ที่ล้าสมัยถูกซ่อนหลัง metadata cache

กฎ cache ระบุไว้ใน [ภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals#plugin-cache-boundary): manifest และ discovery metadata สดใหม่ เว้นแต่ caller จะถือ snapshot, lookup table หรือ manifest registry ที่ explicit สำหรับ flow ปัจจุบัน metadata cache ที่ซ่อนอยู่และ TTL ตาม wall-clock ไม่ใช่ส่วนหนึ่งของการโหลด Plugin เฉพาะ cache ของ runtime loader, module และ dependency-artifact เท่านั้นที่อาจคงอยู่หลังจาก code หรือ artifact ที่ติดตั้งถูกโหลดจริงแล้ว

caller ใน cold-path บางตัวยังคง reconstruct manifest registries โดยตรงจาก persisted installed plugin index แทนที่จะรับ `PluginLookUpTable` ของ Gateway path นั้นตอนนี้ reconstruct registry ตามต้องการ; ควรส่ง lookup table ปัจจุบันหรือ manifest registry ที่ explicit ผ่าน runtime flows เมื่อ caller มีอยู่แล้ว

### การวางแผน activation

การวางแผน activation เป็นส่วนหนึ่งของ control plane caller สามารถถามได้ว่า Plugin ใดเกี่ยวข้องกับคำสั่ง ผู้ให้บริการ ช่องทาง route, agent harness หรือความสามารถที่เป็นรูปธรรม ก่อนโหลด runtime registries ที่กว้างขึ้น

planner รักษาพฤติกรรม manifest ปัจจุบันให้เข้ากันได้:

- ฟิลด์ `activation.*` เป็นคำใบ้สำหรับตัววางแผนอย่างชัดเจน
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` และ hooks ยังคงเป็นทางสำรองของความเป็นเจ้าของใน manifest
- API ตัววางแผนแบบมีเฉพาะ ids ยังคงพร้อมใช้งานสำหรับผู้เรียกเดิม
- API แผนรายงานป้ายกำกับเหตุผลเพื่อให้การวินิจฉัยแยกคำใบ้ที่ชัดเจนออกจากทางสำรองของความเป็นเจ้าของได้

<Warning>
อย่ามองว่า `activation` เป็น lifecycle hook หรือสิ่งทดแทน `register(...)` นี่คือ metadata ที่ใช้เพื่อจำกัดขอบเขตการโหลดให้แคบลง ควรใช้ฟิลด์ความเป็นเจ้าของเมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์อยู่แล้ว ใช้ `activation` เฉพาะสำหรับคำใบ้เพิ่มเติมให้ตัววางแผนเท่านั้น
</Warning>

### Plugin ช่องทางและเครื่องมือข้อความที่ใช้ร่วมกัน

Plugin ช่องทางไม่จำเป็นต้องลงทะเบียนเครื่องมือส่ง/แก้ไข/ตอบสนองแยกต่างหากสำหรับการกระทำแชทตามปกติ OpenClaw เก็บเครื่องมือ `message` ที่ใช้ร่วมกันหนึ่งตัวไว้ในแกนหลัก และ Plugin ช่องทางเป็นเจ้าของการค้นพบและการดำเนินการเฉพาะช่องทางที่อยู่เบื้องหลังเครื่องมือนั้น

ขอบเขตปัจจุบันคือ:

- แกนหลักเป็นเจ้าของโฮสต์เครื่องมือ `message` ที่ใช้ร่วมกัน การเชื่อมต่อ prompt การทำบัญชี session/thread และการ dispatch การดำเนินการ
- Plugin ช่องทางเป็นเจ้าของการค้นพบการกระทำตามขอบเขต การค้นพบความสามารถ และส่วนย่อย schema เฉพาะช่องทางใดๆ
- Plugin ช่องทางเป็นเจ้าของไวยากรณ์บทสนทนา session เฉพาะ provider เช่น วิธีที่ conversation ids เข้ารหัส thread ids หรือสืบทอดจากบทสนทนาหลัก
- Plugin ช่องทางดำเนินการขั้นสุดท้ายผ่าน action adapter ของตน

สำหรับ Plugin ช่องทาง พื้นผิว SDK คือ `ChannelMessageActionAdapter.describeMessageTool(...)` การเรียกค้นพบแบบรวมนี้ทำให้ Plugin ส่งคืนการกระทำที่มองเห็นได้ ความสามารถ และส่วนร่วมของ schema พร้อมกัน เพื่อให้ชิ้นส่วนเหล่านั้นไม่คลาดเคลื่อนออกจากกัน

เมื่อพารามิเตอร์ของเครื่องมือข้อความเฉพาะช่องทางมีแหล่งสื่อ เช่น path ในเครื่องหรือ URL สื่อระยะไกล Plugin ควรส่งคืน `mediaSourceParams` จาก `describeMessageTool(...)` ด้วย แกนหลักใช้รายการที่ชัดเจนนั้นเพื่อใช้การปรับ path ใน sandbox ให้เป็นมาตรฐานและคำใบ้การเข้าถึงสื่อขาออก โดยไม่ hardcode ชื่อพารามิเตอร์ที่ Plugin เป็นเจ้าของ ควรใช้ map ที่จำกัดตามการกระทำ ไม่ใช่รายการแบนเดียวทั้งช่องทาง เพื่อไม่ให้พารามิเตอร์สื่อที่ใช้เฉพาะ profile ถูกปรับมาตรฐานในการกระทำที่ไม่เกี่ยวข้อง เช่น `send`

แกนหลักส่งขอบเขต runtime เข้าไปในขั้นตอนการค้นพบนั้น ฟิลด์สำคัญรวมถึง:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ขาเข้าที่เชื่อถือได้

สิ่งนี้สำคัญสำหรับ Plugin ที่อิงบริบท ช่องทางสามารถซ่อนหรือแสดงการกระทำข้อความตามบัญชีที่ใช้งานอยู่ ห้อง/thread/ข้อความปัจจุบัน หรือ identity ของผู้ร้องขอที่เชื่อถือได้ โดยไม่ต้อง hardcode สาขาเฉพาะช่องทางในเครื่องมือ `message` ของแกนหลัก

นี่คือเหตุผลที่การเปลี่ยนแปลง routing ของ embedded-runner ยังคงเป็นงานของ Plugin: runner มีหน้าที่ส่งต่อ identity ของแชท/session ปัจจุบันเข้าสู่ขอบเขตการค้นพบของ Plugin เพื่อให้เครื่องมือ `message` ที่ใช้ร่วมกันแสดงพื้นผิวที่ช่องทางเป็นเจ้าของอย่างถูกต้องสำหรับ turn ปัจจุบัน

สำหรับ helper การดำเนินการที่ช่องทางเป็นเจ้าของ Plugin ที่ bundle มาด้วยควรเก็บ runtime การดำเนินการไว้ภายในโมดูลส่วนขยายของตนเอง แกนหลักไม่เป็นเจ้าของ runtime การกระทำข้อความของ Discord, Slack, Telegram หรือ WhatsApp ภายใต้ `src/agents/tools` อีกต่อไป เราไม่เผยแพร่ subpath `plugin-sdk/*-action-runtime` แยกต่างหาก และ Plugin ที่ bundle มาด้วยควร import โค้ด runtime ภายในของตนโดยตรงจากโมดูลที่ส่วนขยายเป็นเจ้าของ

ขอบเขตเดียวกันนี้ใช้กับรอยต่อ SDK ที่ตั้งชื่อตาม provider โดยทั่วไป: แกนหลักไม่ควร import barrel อำนวยความสะดวกเฉพาะช่องทางสำหรับ Slack, Discord, Signal, WhatsApp หรือส่วนขยายที่คล้ายกัน หากแกนหลักต้องการพฤติกรรมหนึ่ง ให้ใช้ barrel `api.ts` / `runtime-api.ts` ของ Plugin ที่ bundle มาด้วยเอง หรือยกระดับความต้องการนั้นเป็นความสามารถ generic แบบแคบใน SDK ที่ใช้ร่วมกัน

Plugin ที่ bundle มาด้วยปฏิบัติตามกฎเดียวกัน `runtime-api.ts` ของ Plugin ที่ bundle มาด้วยไม่ควร re-export facade `openclaw/plugin-sdk/<plugin-id>` ที่มีแบรนด์ของตนเอง facade ที่มีแบรนด์เหล่านั้นยังคงเป็น compatibility shim สำหรับ Plugin ภายนอกและผู้ใช้เดิม แต่ Plugin ที่ bundle มาด้วยควรใช้ export ภายในเครื่องร่วมกับ subpath SDK generic แบบแคบ เช่น `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` หรือ `openclaw/plugin-sdk/webhook-ingress` โค้ดใหม่ไม่ควรเพิ่ม facade SDK เฉพาะ plugin-id เว้นแต่ขอบเขตความเข้ากันได้สำหรับระบบนิเวศภายนอกที่มีอยู่จำเป็นต้องใช้

สำหรับโพลโดยเฉพาะ มีเส้นทางการดำเนินการสองเส้นทาง:

- `outbound.sendPoll` เป็น baseline ที่ใช้ร่วมกันสำหรับช่องทางที่เข้ากับโมเดลโพลทั่วไป
- `actions.handleAction("poll")` เป็นเส้นทางที่แนะนำสำหรับ semantic โพลเฉพาะช่องทางหรือพารามิเตอร์โพลเพิ่มเติม

ตอนนี้แกนหลักเลื่อนการ parse โพลที่ใช้ร่วมกันออกไปจนกว่าการ dispatch โพลของ Plugin จะปฏิเสธการกระทำ เพื่อให้ handler โพลที่ Plugin เป็นเจ้าของสามารถรับฟิลด์โพลเฉพาะช่องทางได้โดยไม่ถูกตัว parse โพล generic บล็อกก่อน

ดู [สถาปัตยกรรมภายในของ Plugin](/th/plugins/architecture-internals) สำหรับลำดับการเริ่มต้นแบบเต็ม

## โมเดลความเป็นเจ้าของความสามารถ

OpenClaw มอง Plugin แบบ native เป็นขอบเขตความเป็นเจ้าของสำหรับ **บริษัท** หรือ **ฟีเจอร์** ไม่ใช่ถุงรวม integration ที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- Plugin ของบริษัทมักควรเป็นเจ้าของพื้นผิวทั้งหมดของบริษัทนั้นที่หันเข้าหา OpenClaw
- Plugin ของฟีเจอร์มักควรเป็นเจ้าของพื้นผิวฟีเจอร์ทั้งหมดที่มันแนะนำ
- ช่องทางควรใช้ความสามารถแกนหลักที่ใช้ร่วมกันแทนการ implement พฤติกรรม provider เฉพาะกิจซ้ำ

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` เป็นเจ้าของการ inference ข้อความ เสียงพูด เสียง realtime การทำความเข้าใจสื่อ และการสร้างภาพ `google` เป็นเจ้าของการ inference ข้อความ รวมถึงการทำความเข้าใจสื่อ การสร้างภาพ และการค้นเว็บ `qwen` เป็นเจ้าของการ inference ข้อความ รวมถึงการทำความเข้าใจสื่อและการสร้างวิดีโอ
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` และ `microsoft` เป็นเจ้าของเสียงพูด; `firecrawl` เป็นเจ้าของ web-fetch; `minimax` / `mistral` / `moonshot` / `zai` เป็นเจ้าของ backend การทำความเข้าใจสื่อ
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` เป็นเจ้าของการส่งผ่านสาย เครื่องมือ CLI routes และการเชื่อม Twilio media-stream แต่ใช้ความสามารถเสียงพูด การถอดเสียง realtime และเสียง realtime ที่ใช้ร่วมกันแทนการ import Plugin vendor โดยตรง
  </Accordion>
</AccordionGroup>

สถานะปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน Plugin เดียว แม้มันจะครอบคลุมโมเดลข้อความ เสียงพูด รูปภาพ และวิดีโอในอนาคต
- vendor อื่นสามารถทำแบบเดียวกันสำหรับพื้นที่พื้นผิวของตนเอง
- ช่องทางไม่สนใจว่า Plugin vendor ใดเป็นเจ้าของ provider; ช่องทางใช้สัญญาความสามารถที่ใช้ร่วมกันซึ่งแกนหลักเปิดเผย

นี่คือความแตกต่างสำคัญ:

- **plugin** = ขอบเขตความเป็นเจ้าของ
- **capability** = สัญญาแกนหลักที่ Plugin หลายตัวสามารถ implement หรือใช้ได้

ดังนั้นหาก OpenClaw เพิ่มโดเมนใหม่ เช่น วิดีโอ คำถามแรกไม่ใช่ "provider ใดควร hardcode การจัดการวิดีโอ?" คำถามแรกคือ "สัญญาความสามารถวิดีโอของแกนหลักคืออะไร?" เมื่อสัญญานั้นมีอยู่แล้ว Plugin vendor สามารถลงทะเบียนกับสัญญานั้น และ Plugin ช่องทาง/ฟีเจอร์สามารถใช้งานได้

หากความสามารถนั้นยังไม่มี แนวทางที่ถูกต้องมักเป็น:

<Steps>
  <Step title="Define the capability">
    กำหนดความสามารถที่ขาดหายในแกนหลัก
  </Step>
  <Step title="Expose through the SDK">
    เปิดเผยผ่าน Plugin API/runtime แบบมี type
  </Step>
  <Step title="Wire consumers">
    เชื่อมช่องทาง/ฟีเจอร์เข้ากับความสามารถนั้น
  </Step>
  <Step title="Vendor implementations">
    ให้ Plugin vendor ลงทะเบียน implementation
  </Step>
</Steps>

สิ่งนี้ทำให้ความเป็นเจ้าของชัดเจน ขณะเดียวกันก็หลีกเลี่ยงพฤติกรรมแกนหลักที่ขึ้นกับ vendor เดียวหรือ code path เฉพาะ Plugin แบบครั้งเดียว

### การจัดชั้นความสามารถ

ใช้โมเดลความคิดนี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ใด:

<Tabs>
  <Tab title="Core capability layer">
    การประสานงาน นโยบาย ทางสำรอง กฎการ merge config semantic การส่งมอบ และสัญญาแบบมี type ที่ใช้ร่วมกัน
  </Tab>
  <Tab title="Vendor plugin layer">
    API เฉพาะ vendor, auth, catalog โมเดล, การสังเคราะห์เสียงพูด, การสร้างภาพ, backend วิดีโอในอนาคต, endpoint การใช้งาน
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Integration ของ Slack/Discord/voice-call/etc. ที่ใช้ความสามารถแกนหลักและนำเสนอความสามารถเหล่านั้นบนพื้นผิวหนึ่ง
  </Tab>
</Tabs>

ตัวอย่างเช่น TTS มีรูปแบบนี้:

- แกนหลักเป็นเจ้าของนโยบาย TTS ณ เวลาตอบกลับ ลำดับ fallback, prefs และการส่งมอบผ่านช่องทาง
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementation การสังเคราะห์
- `voice-call` ใช้ helper runtime TTS สำหรับโทรศัพท์

ควรใช้รูปแบบเดียวกันนี้เป็นหลักสำหรับความสามารถในอนาคต

### ตัวอย่าง Plugin บริษัทแบบหลายความสามารถ

Plugin ของบริษัทควรรู้สึกเป็นอันหนึ่งอันเดียวกันจากภายนอก หาก OpenClaw มีสัญญาที่ใช้ร่วมกันสำหรับโมเดล เสียงพูด การถอดเสียง realtime เสียง realtime การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ web fetch และการค้นเว็บ vendor สามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนในที่เดียว:

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

สิ่งที่สำคัญไม่ใช่ชื่อ helper ที่ตรงเป๊ะ แต่เป็นรูปแบบ:

- Plugin เดียวเป็นเจ้าของพื้นผิว vendor
- แกนหลักยังคงเป็นเจ้าของสัญญาความสามารถ
- ช่องทางและ Plugin ฟีเจอร์ใช้ helper `api.runtime.*` ไม่ใช่โค้ด vendor
- การทดสอบสัญญาสามารถยืนยันได้ว่า Plugin ลงทะเบียนความสามารถที่อ้างว่าเป็นเจ้าของไว้แล้ว

### ตัวอย่างความสามารถ: การทำความเข้าใจวิดีโอ

OpenClaw มองการทำความเข้าใจภาพ/เสียง/วิดีโอเป็นความสามารถที่ใช้ร่วมกันหนึ่งเดียวอยู่แล้ว โมเดลความเป็นเจ้าของเดียวกันใช้ที่นั่นด้วย:

<Steps>
  <Step title="Core defines the contract">
    แกนหลักกำหนดสัญญา media-understanding
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor ลงทะเบียน `describeImage`, `transcribeAudio` และ `describeVideo` ตามที่ใช้ได้
  </Step>
  <Step title="Consumers use the shared behavior">
    ช่องทางและ Plugin ฟีเจอร์ใช้พฤติกรรมแกนหลักที่ใช้ร่วมกันแทนการเชื่อมตรงกับโค้ด vendor
  </Step>
</Steps>

สิ่งนี้หลีกเลี่ยงการฝังสมมติฐานวิดีโอของ provider รายเดียวไว้ในแกนหลัก Plugin เป็นเจ้าของพื้นผิว vendor; แกนหลักเป็นเจ้าของสัญญาความสามารถและพฤติกรรม fallback

การสร้างวิดีโอใช้ลำดับเดียวกันนั้นอยู่แล้ว: แกนหลักเป็นเจ้าของสัญญาความสามารถแบบมี type และ helper runtime และ Plugin vendor ลงทะเบียน implementation `api.registerVideoGenerationProvider(...)` กับสัญญานั้น

ต้องการ checklist การ rollout ที่เป็นรูปธรรมใช่ไหม? ดู [Capability Cookbook](/th/plugins/adding-capabilities)

## สัญญาและการบังคับใช้

พื้นผิว Plugin API ถูกทำให้มี type และรวมศูนย์ไว้ใน `OpenClawPluginApi` โดยตั้งใจ สัญญานั้นกำหนดจุดลงทะเบียนที่รองรับและ helper runtime ที่ Plugin อาจพึ่งพาได้

เหตุผลที่สิ่งนี้สำคัญ:

- ผู้เขียน Plugin ได้มาตรฐานภายในที่เสถียรเพียงหนึ่งเดียว
- แกนหลักสามารถปฏิเสธความเป็นเจ้าของซ้ำ เช่น Plugin สองตัวลงทะเบียน provider id เดียวกัน
- startup สามารถแสดงการวินิจฉัยที่นำไปปฏิบัติได้สำหรับการลงทะเบียนที่ผิดรูปแบบ
- การทดสอบสัญญาสามารถบังคับใช้ความเป็นเจ้าของของ Plugin ที่ bundle มาด้วยและป้องกันการคลาดเคลื่อนแบบเงียบ

มีการบังคับใช้สองชั้น:

<AccordionGroup>
  <Accordion title="การบังคับใช้การลงทะเบียนขณะรันไทม์">
    รีจิสทรีของ Plugin จะตรวจสอบการลงทะเบียนเมื่อโหลด Plugin ตัวอย่าง: id ของผู้ให้บริการที่ซ้ำกัน, id ของผู้ให้บริการเสียงพูดที่ซ้ำกัน และการลงทะเบียนที่มีรูปแบบไม่ถูกต้อง จะสร้างการวินิจฉัย Plugin แทนพฤติกรรมที่ไม่กำหนดชัดเจน
  </Accordion>
  <Accordion title="การทดสอบสัญญา">
    Plugin ที่รวมมาในชุดจะถูกบันทึกไว้ในรีจิสทรีสัญญาระหว่างการรันทดสอบ เพื่อให้ OpenClaw สามารถยืนยันความเป็นเจ้าของได้อย่างชัดเจน ปัจจุบันใช้กับผู้ให้บริการโมเดล, ผู้ให้บริการเสียงพูด, ผู้ให้บริการค้นหาเว็บ และความเป็นเจ้าของการลงทะเบียนที่รวมมาในชุด
  </Accordion>
</AccordionGroup>

ผลในทางปฏิบัติคือ OpenClaw รู้ตั้งแต่ต้นว่า Plugin ใดเป็นเจ้าของพื้นผิวใด สิ่งนี้ทำให้แกนหลักและช่องทางประกอบเข้าด้วยกันได้อย่างราบรื่น เพราะมีการประกาศความเป็นเจ้าของ มีชนิดข้อมูล และทดสอบได้ แทนที่จะเป็นนัยโดยไม่ระบุชัด

### สิ่งที่ควรอยู่ในสัญญา

<Tabs>
  <Tab title="สัญญาที่ดี">
    - มีชนิดข้อมูล
    - เล็ก
    - เฉพาะความสามารถ
    - เป็นของแกนหลัก
    - ใช้ซ้ำได้โดย Plugin หลายตัว
    - ช่องทาง/ฟีเจอร์สามารถใช้ได้โดยไม่ต้องมีความรู้เกี่ยวกับผู้ขาย

  </Tab>
  <Tab title="สัญญาที่ไม่ดี">
    - นโยบายเฉพาะผู้ขายที่ซ่อนอยู่ในแกนหลัก
    - ช่องทางหลบเลี่ยงเฉพาะกิจของ Plugin ที่ข้ามรีจิสทรี
    - โค้ดช่องทางที่เข้าถึงการใช้งานของผู้ขายโดยตรง
    - อ็อบเจ็กต์รันไทม์เฉพาะกิจที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ `api.runtime`

  </Tab>
</Tabs>

เมื่อไม่แน่ใจ ให้ยกระดับนามธรรมขึ้น: กำหนดความสามารถก่อน แล้วให้ Plugin เสียบเข้ากับความสามารถนั้น

## โมเดลการดำเนินการ

Plugin แบบเนทีฟของ OpenClaw รัน **ในกระบวนการเดียวกัน** กับ Gateway โดยไม่ถูกแซนด์บ็อกซ์ Plugin แบบเนทีฟที่โหลดแล้วมีขอบเขตความเชื่อถือระดับกระบวนการเดียวกับโค้ดแกนหลัก

<Warning>
ผลกระทบของ Plugin แบบเนทีฟ: Plugin สามารถลงทะเบียนเครื่องมือ, ตัวจัดการเครือข่าย, hook และบริการได้; บั๊กใน Plugin อาจทำให้ Gateway ล่มหรือไม่เสถียร; และ Plugin แบบเนทีฟที่เป็นอันตรายเทียบเท่ากับการรันโค้ดใด ๆ ภายในกระบวนการ OpenClaw
</Warning>

บันเดิลที่เข้ากันได้จะปลอดภัยกว่าโดยค่าเริ่มต้น เพราะปัจจุบัน OpenClaw มองว่าเป็นแพ็กเมทาดาทา/เนื้อหา ในรุ่นปัจจุบัน ส่วนใหญ่หมายถึง Skills ที่รวมมาในชุด

ใช้รายการอนุญาตและเส้นทางติดตั้ง/โหลดที่ชัดเจนสำหรับ Plugin ที่ไม่ได้รวมมาในชุด ให้ถือว่า Plugin ในเวิร์กสเปซเป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับโปรดักชัน

สำหรับชื่อแพ็กเกจเวิร์กสเปซที่รวมมาในชุด ให้ยึด id ของ Plugin ไว้กับชื่อ npm: ค่าเริ่มต้นคือ `@openclaw/<id>` หรือใช้คำต่อท้ายที่มีชนิดและได้รับอนุมัติ เช่น `-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อแพ็กเกจตั้งใจเปิดเผยบทบาท Plugin ที่แคบกว่า

<Note>
**หมายเหตุด้านความเชื่อถือ:** `plugins.allow` เชื่อถือ **id ของ Plugin** ไม่ใช่ที่มาของซอร์ส Plugin ในเวิร์กสเปซที่มี id เดียวกับ Plugin ที่รวมมาในชุดจะตั้งใจบังสำเนาที่รวมมาในชุดเมื่อ Plugin ในเวิร์กสเปซนั้นถูกเปิดใช้งาน/อยู่ในรายการอนุญาต นี่เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง, การทดสอบแพตช์ และ hotfix ความเชื่อถือของ Plugin ที่รวมมาในชุดจะตัดสินจากสแนปช็อตของซอร์ส — manifest และโค้ดบนดิสก์ ณ เวลาโหลด — ไม่ใช่จากเมทาดาทาการติดตั้ง ระเบียนการติดตั้งที่เสียหายหรือถูกแทนที่ไม่สามารถขยายพื้นผิวความเชื่อถือของ Plugin ที่รวมมาในชุดอย่างเงียบ ๆ เกินกว่าสิ่งที่ซอร์สจริงอ้างไว้
</Note>

## ขอบเขตการส่งออก

OpenClaw ส่งออกความสามารถ ไม่ใช่ความสะดวกของการใช้งานภายใน

คงการลงทะเบียนความสามารถไว้เป็นสาธารณะ ตัดการส่งออกตัวช่วยที่ไม่ใช่สัญญาออก:

- พาธย่อยตัวช่วยเฉพาะ Plugin ที่รวมมาในชุด
- พาธย่อยระบบท่อรันไทม์ที่ไม่ได้ตั้งใจให้เป็น API สาธารณะ
- ตัวช่วยอำนวยความสะดวกเฉพาะผู้ขาย
- ตัวช่วยตั้งค่า/เริ่มใช้งานที่เป็นรายละเอียดการใช้งานภายใน

พาธย่อยตัวช่วยของ Plugin ที่รวมมาในชุดซึ่งสงวนไว้ถูกเลิกใช้จากแผนที่การส่งออก SDK ที่สร้างขึ้นแล้ว ให้เก็บตัวช่วยเฉพาะเจ้าของไว้ภายในแพ็กเกจ Plugin ที่เป็นเจ้าของ; เลื่อนเฉพาะพฤติกรรมโฮสต์ที่ใช้ซ้ำได้ให้เป็นสัญญา SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`

## ภายในและข้อมูลอ้างอิง

สำหรับไปป์ไลน์การโหลด, โมเดลรีจิสทรี, hook รันไทม์ของผู้ให้บริการ, เส้นทาง HTTP ของ Gateway, schema เครื่องมือข้อความ, การแก้ปลายทางของช่องทาง, แคตตาล็อกผู้ให้บริการ, Plugin ของเอนจินบริบท และคู่มือการเพิ่มความสามารถใหม่ โปรดดู [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
