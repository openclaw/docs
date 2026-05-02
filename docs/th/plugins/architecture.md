---
read_when:
    - การสร้างหรือการดีบัก Plugin ของ OpenClaw แบบเนทีฟ
    - ทำความเข้าใจโมเดลความสามารถของ Plugin หรือขอบเขตความเป็นเจ้าของ
    - การทำงานกับไปป์ไลน์การโหลด Plugin หรือรีจิสทรี
    - การนำฮุกรันไทม์ของผู้ให้บริการหรือ Plugin ของช่องทางไปใช้
sidebarTitle: Internals
summary: 'ส่วนภายในของ Plugin: โมเดลความสามารถ ความเป็นเจ้าของ สัญญา ไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: กลไกภายในของ Plugin
x-i18n:
    generated_at: "2026-05-02T10:22:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

นี่คือ**เอกสารอ้างอิงสถาปัตยกรรมเชิงลึก**สำหรับระบบ Plugin ของ OpenClaw สำหรับคู่มือเชิงปฏิบัติ ให้เริ่มจากหน้าที่เจาะจงด้านล่าง

<CardGroup cols={2}>
  <Card title="ติดตั้งและใช้ Plugin" icon="plug" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการเพิ่ม เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="การสร้าง Plugin" icon="rocket" href="/th/plugins/building-plugins">
    บทช่วยสอน Plugin แรกพร้อม manifest ที่ใช้งานได้ขนาดเล็กที่สุด
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

ความสามารถคือโมเดล **Plugin แบบเนทีฟ**สาธารณะภายใน OpenClaw Plugin แบบเนทีฟของ OpenClaw ทุกตัวจะลงทะเบียนกับประเภทความสามารถหนึ่งประเภทขึ้นไป:

| ความสามารถ             | เมธอดการลงทะเบียน                              | ตัวอย่าง Plugin                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| การอนุมานข้อความ         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| แบ็กเอนด์การอนุมาน CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| เสียงพูด                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| เสียงพูดแบบเรียลไทม์     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| การทำความเข้าใจสื่อ      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| การสร้างภาพ             | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| การสร้างเพลง            | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| การสร้างวิดีโอ           | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| การดึงข้อมูลเว็บ         | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | `google`                             |
| ช่องทาง / การรับส่งข้อความ | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| การค้นพบ Gateway        | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin ที่ลงทะเบียนความสามารถเป็นศูนย์ แต่มีฮุก เครื่องมือ บริการค้นพบ หรือบริการเบื้องหลัง คือ Plugin แบบ **legacy hook-only** รูปแบบนี้ยังรองรับเต็มรูปแบบ
</Note>

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดลความสามารถถูกนำเข้า core แล้วและ Plugin แบบบันเดิล/เนทีฟใช้งานอยู่ในปัจจุบัน แต่ความเข้ากันได้ของ Plugin ภายนอกยังต้องมีมาตรฐานที่รัดกุมกว่า “ส่งออกแล้ว ดังนั้นจึงถูกตรึงไว้แล้ว”

| สถานการณ์ของ Plugin                                  | แนวทาง                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin ภายนอกที่มีอยู่                         | รักษาการผสานรวมแบบใช้ฮุกให้ทำงานได้ต่อไป นี่คือ baseline ด้านความเข้ากันได้                        |
| Plugin แบบบันเดิล/เนทีฟใหม่                        | ควรใช้การลงทะเบียนความสามารถอย่างชัดเจน แทนการเข้าถึงเฉพาะผู้ขายหรือการออกแบบแบบ hook-only ใหม่ |
| Plugin ภายนอกที่นำการลงทะเบียนความสามารถไปใช้ | อนุญาต แต่ให้ถือว่า helper surfaces เฉพาะความสามารถยังเปลี่ยนแปลงได้ เว้นแต่เอกสารจะระบุว่า stable |

การลงทะเบียนความสามารถคือทิศทางที่ตั้งใจไว้ ฮุกแบบ legacy ยังคงเป็นเส้นทางที่ปลอดภัยที่สุดต่อการไม่ทำให้ Plugin ภายนอกแตกหักในช่วงเปลี่ยนผ่าน subpath ของ helper ที่ส่งออกไม่ได้เท่าเทียมกันทั้งหมด — ควรใช้สัญญาที่แคบและมีเอกสารกำกับมากกว่า export ของ helper ที่เกิดขึ้นโดยบังเอิญ

### รูปทรงของ Plugin

OpenClaw จัดประเภท Plugin ทุกตัวที่โหลดเป็นรูปทรงตามพฤติกรรมการลงทะเบียนจริงของมัน (ไม่ใช่แค่เมทาดาทาแบบสถิต):

<AccordionGroup>
  <Accordion title="plain-capability">
    ลงทะเบียนประเภทความสามารถเพียงหนึ่งประเภท (เช่น Plugin เฉพาะผู้ให้บริการอย่าง `mistral`)
  </Accordion>
  <Accordion title="hybrid-capability">
    ลงทะเบียนความสามารถหลายประเภท (เช่น `openai` เป็นเจ้าของการอนุมานข้อความ เสียงพูด การทำความเข้าใจสื่อ และการสร้างภาพ)
  </Accordion>
  <Accordion title="hook-only">
    ลงทะเบียนเฉพาะฮุก (แบบมีชนิดหรือกำหนดเอง) ไม่มีความสามารถ เครื่องมือ คำสั่ง หรือบริการ
  </Accordion>
  <Accordion title="non-capability">
    ลงทะเบียนเครื่องมือ คำสั่ง บริการ หรือ route แต่ไม่มีความสามารถ
  </Accordion>
</AccordionGroup>

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปทรงของ Plugin และรายละเอียดความสามารถ ดูรายละเอียดได้ที่ [เอกสารอ้างอิง CLI](/th/cli/plugins#inspect)

### ฮุกแบบ Legacy

ฮุก `before_agent_start` ยังรองรับอยู่ในฐานะเส้นทางความเข้ากันได้สำหรับ Plugin แบบ hook-only Plugin ที่ใช้งานจริงแบบ legacy ยังพึ่งพามันอยู่

ทิศทาง:

- รักษาให้ทำงานต่อไป
- ทำเอกสารว่าเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override โมเดล/ผู้ให้บริการ
- ควรใช้ `before_prompt_build` สำหรับงานแก้ไข prompt
- ลบเฉพาะหลังจากการใช้งานจริงลดลงและ coverage ของ fixture พิสูจน์ว่าการย้ายปลอดภัย

### สัญญาณความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็นป้ายกำกับเหล่านี้:

| สัญญาณ                     | ความหมาย                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config parse ได้ปกติและ Plugin resolve ได้                       |
| **compatibility advisory** | Plugin ใช้รูปแบบที่รองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**         | Plugin ใช้ `before_agent_start` ซึ่งถูกเลิกแนะนำแล้ว        |
| **hard error**             | Config ไม่ถูกต้องหรือโหลด Plugin ไม่สำเร็จ                   |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ Plugin ของคุณแตกหักในวันนี้: `hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะทริกเกอร์แค่คำเตือน สัญญาณเหล่านี้ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ Plugin ของ OpenClaw มีสี่ชั้น:

<Steps>
  <Step title="Manifest + การค้นพบ">
    OpenClaw ค้นหา Plugin ที่เป็นตัวเลือกจาก path ที่กำหนดค่าไว้, workspace root, global plugin root และ Plugin แบบบันเดิล การค้นพบจะอ่าน manifest `openclaw.plugin.json` แบบเนทีฟและ manifest ของ bundle ที่รองรับก่อน
  </Step>
  <Step title="การเปิดใช้งาน + การตรวจสอบ">
    Core ตัดสินว่า Plugin ที่ค้นพบถูกเปิดใช้งาน ปิดใช้งาน บล็อก หรือถูกเลือกสำหรับ slot แบบ exclusive เช่น memory
  </Step>
  <Step title="การโหลด runtime">
    Plugin แบบเนทีฟของ OpenClaw ถูกโหลดใน process และลงทะเบียนความสามารถเข้า registry กลาง JavaScript แบบแพ็กเกจโหลดผ่าน `require` แบบเนทีฟ; TypeScript ซอร์สภายในของบุคคลที่สามคือ fallback ฉุกเฉินของ Jiti bundle ที่เข้ากันได้จะถูก normalize เป็นระเบียน registry โดยไม่ import โค้ด runtime
  </Step>
  <Step title="การใช้งาน surface">
    ส่วนที่เหลือของ OpenClaw อ่าน registry เพื่อเปิดเผยเครื่องมือ ช่องทาง การตั้งค่าผู้ให้บริการ ฮุก route ของ HTTP คำสั่ง CLI และบริการ
  </Step>
</Steps>

สำหรับ Plugin CLI โดยเฉพาะ การค้นพบคำสั่ง root แบ่งเป็นสองเฟส:

- เมทาดาทาขณะ parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI จริงของ Plugin สามารถยัง lazy อยู่และลงทะเบียนเมื่อถูกเรียกใช้ครั้งแรก

สิ่งนี้ทำให้โค้ด CLI ที่ Plugin เป็นเจ้าของอยู่ภายใน Plugin ต่อไป ขณะเดียวกันก็ยังให้ OpenClaw จองชื่อคำสั่ง root ได้ก่อนการ parse

ขอบเขตการออกแบบที่สำคัญ:

- การตรวจสอบ manifest/config ควรทำงานจาก **เมทาดาทา manifest/schema** โดยไม่ต้อง execute โค้ด Plugin
- การค้นพบความสามารถแบบเนทีฟอาจโหลดโค้ด entry ของ Plugin ที่เชื่อถือได้เพื่อสร้าง snapshot ของ registry ที่ยังไม่ activate
- พฤติกรรม runtime แบบเนทีฟมาจาก path `register(api)` ของโมดูล Plugin โดยมี `api.registrationMode === "full"`

การแยกนี้ทำให้ OpenClaw ตรวจสอบ config, อธิบาย Plugin ที่ขาดหาย/ถูกปิดใช้งาน และสร้างคำใบ้ UI/schema ได้ก่อน runtime เต็มรูปแบบจะ active

### Snapshot เมทาดาทา Plugin และตาราง lookup

การเริ่มต้น Gateway สร้าง `PluginMetadataSnapshot` หนึ่งรายการสำหรับ snapshot ของ config ปัจจุบัน snapshot นี้มีเฉพาะเมทาดาทา: เก็บดัชนี Plugin ที่ติดตั้ง, manifest registry, diagnostics ของ manifest, owner map, ตัว normalize รหัส Plugin และระเบียน manifest มันไม่เก็บโมดูล Plugin ที่โหลดแล้ว, SDK ของผู้ให้บริการ, เนื้อหา package หรือ runtime export

การตรวจสอบ config ที่รับรู้ Plugin, การ auto-enable ตอนเริ่มต้น และ bootstrap Plugin ของ Gateway ใช้ snapshot นั้นแทนการสร้างเมทาดาทา manifest/index ใหม่แยกกัน `PluginLookUpTable` ถูก derive จาก snapshot เดียวกันและเพิ่มแผน Plugin ตอนเริ่มต้นสำหรับ config runtime ปัจจุบัน

หลังเริ่มต้น Gateway จะเก็บ snapshot เมทาดาทาปัจจุบันไว้เป็นผลิตภัณฑ์ runtime ที่แทนที่ได้ การค้นพบผู้ให้บริการ runtime ซ้ำๆ สามารถยืม snapshot นั้นแทนการสร้างดัชนีที่ติดตั้งและ manifest registry ใหม่สำหรับแต่ละรอบ provider-catalog ได้ snapshot จะถูกล้างหรือแทนที่เมื่อ Gateway shutdown, config/คลัง Plugin เปลี่ยน, และมีการเขียนดัชนีที่ติดตั้ง; caller จะ fallback ไปยัง path manifest/index แบบ cold เมื่อไม่มี snapshot ปัจจุบันที่เข้ากันได้ การตรวจสอบความเข้ากันได้ต้องรวม root การค้นพบ Plugin เช่น `plugins.load.paths` และ workspace ตัวแทนเริ่มต้น เพราะ Plugin ใน workspace เป็นส่วนหนึ่งของขอบเขตเมทาดาทา

snapshot และตาราง lookup ช่วยให้การตัดสินใจตอนเริ่มต้นที่ทำซ้ำอยู่บน path ที่เร็ว:

- ownership ของช่องทาง
- การเริ่มต้นช่องทางแบบ deferred
- รหัส Plugin ตอนเริ่มต้น
- ownership ของผู้ให้บริการและแบ็กเอนด์ CLI
- ownership ของผู้ให้บริการ setup, alias คำสั่ง, ผู้ให้บริการ catalog โมเดล และสัญญา manifest
- การตรวจสอบ schema ของ config Plugin และ schema ของ config ช่องทาง
- การตัดสินใจ auto-enable ตอนเริ่มต้น

ขอบเขตความปลอดภัยคือการแทนที่ snapshot ไม่ใช่การ mutate สร้าง snapshot ใหม่เมื่อ config, คลัง Plugin, ระเบียนการติดตั้ง หรือนโยบายดัชนีที่ persisted เปลี่ยนไป อย่าถือว่ามันเป็น registry global ที่ mutable อย่างกว้าง และอย่าเก็บ snapshot ประวัติแบบไม่จำกัด การโหลด Plugin runtime ยังคงแยกจาก snapshot เมทาดาทา เพื่อไม่ให้สถานะ runtime เก่าถูกซ่อนไว้หลัง cache เมทาดาทา

กฎ cache มีเอกสารใน [สถาปัตยกรรมภายในของ Plugin](/th/plugins/architecture-internals#plugin-cache-boundary): เมทาดาทา manifest และการค้นพบจะสดใหม่เสมอ เว้นแต่ caller จะถือ snapshot, ตาราง lookup หรือ manifest registry อย่างชัดเจนสำหรับ flow ปัจจุบัน cache เมทาดาทาที่ซ่อนอยู่และ TTL ตามเวลานาฬิกาไม่ใช่ส่วนหนึ่งของการโหลด Plugin มีเพียง cache ของ runtime loader, โมดูล และ dependency-artifact เท่านั้นที่อาจคงอยู่หลังจากโหลดโค้ดหรือ artifact ที่ติดตั้งจริงแล้ว

caller บางตัวบน cold-path ยังสร้าง manifest registry ใหม่โดยตรงจากดัชนี Plugin ที่ติดตั้งและ persisted แทนการรับ `PluginLookUpTable` ของ Gateway path นั้นตอนนี้สร้าง registry ใหม่ตามต้องการ; ควรส่งตาราง lookup ปัจจุบันหรือ manifest registry ที่ชัดเจนผ่าน flow runtime เมื่อ caller มีอยู่แล้ว

### การวางแผนการ activate

การวางแผนการ activate เป็นส่วนหนึ่งของ control plane caller สามารถถามได้ว่า Plugin ใดเกี่ยวข้องกับคำสั่ง ผู้ให้บริการ ช่องทาง route, agent harness หรือความสามารถแบบเจาะจง ก่อนโหลด registry runtime ที่กว้างกว่า

planner รักษาพฤติกรรม manifest ปัจจุบันให้เข้ากันได้:

- ฟิลด์ `activation.*` เป็นคำใบ้ planner อย่างชัดเจน
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` และฮุกยังคงเป็น fallback ของ ownership จาก manifest
- API planner แบบมีเฉพาะรหัสยังพร้อมใช้งานสำหรับ caller เดิม
- API plan รายงานป้ายกำกับเหตุผลเพื่อให้ diagnostics แยกคำใบ้ชัดเจนออกจาก fallback ของ ownership ได้

<Warning>
อย่าถือว่า `activation` เป็น hook วงจรชีวิตหรือสิ่งทดแทน `register(...)` มันเป็น metadata ที่ใช้จำกัดขอบเขตการโหลด ให้เลือกใช้ฟิลด์ความเป็นเจ้าของเมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์อยู่แล้ว; ใช้ `activation` เฉพาะสำหรับคำใบ้เพิ่มเติมให้ planner เท่านั้น
</Warning>

### Plugin ช่องทางและเครื่องมือข้อความที่ใช้ร่วมกัน

Plugin ช่องทางไม่จำเป็นต้องลงทะเบียนเครื่องมือส่ง/แก้ไข/ตอบสนองแยกต่างหากสำหรับการกระทำแชตปกติ OpenClaw เก็บเครื่องมือ `message` ที่ใช้ร่วมกันไว้หนึ่งตัวในแกนหลัก และ Plugin ช่องทางเป็นเจ้าของการค้นพบและการดำเนินการเฉพาะช่องทางที่อยู่เบื้องหลังเครื่องมือนั้น

ขอบเขตปัจจุบันคือ:

- แกนหลักเป็นเจ้าของ host ของเครื่องมือ `message` ที่ใช้ร่วมกัน, การเชื่อมต่อ prompt, การทำบัญชี session/thread, และการส่งต่อการดำเนินการ
- Plugin ช่องทางเป็นเจ้าของการค้นพบการกระทำตามขอบเขต, การค้นพบความสามารถ, และ schema fragment เฉพาะช่องทางใด ๆ
- Plugin ช่องทางเป็นเจ้าของไวยากรณ์บทสนทนา session เฉพาะผู้ให้บริการ เช่น วิธีที่ id ของบทสนทนาเข้ารหัส id ของ thread หรือสืบทอดจากบทสนทนาหลัก
- Plugin ช่องทางดำเนินการขั้นสุดท้ายผ่าน action adapter ของตน

สำหรับ Plugin ช่องทาง พื้นผิว SDK คือ `ChannelMessageActionAdapter.describeMessageTool(...)` การเรียกค้นพบแบบรวมนี้ทำให้ Plugin ส่งคืนการกระทำที่มองเห็นได้ ความสามารถ และส่วนร่วมของ schema พร้อมกัน เพื่อไม่ให้ชิ้นส่วนเหล่านั้นคลาดเคลื่อนจากกัน

เมื่อพารามิเตอร์ของเครื่องมือข้อความเฉพาะช่องทางมีแหล่งสื่อ เช่น path ภายในเครื่องหรือ URL สื่อระยะไกล Plugin ควรส่งคืน `mediaSourceParams` จาก `describeMessageTool(...)` ด้วย แกนหลักใช้รายการที่ระบุชัดเจนนี้เพื่อใช้การ normalize path ใน sandbox และคำใบ้การเข้าถึงสื่อขาออกโดยไม่ hardcode ชื่อพารามิเตอร์ที่ Plugin เป็นเจ้าของ ให้เลือกใช้ map ตามขอบเขตการกระทำในจุดนั้น ไม่ใช่รายการแบนเดียวทั้งช่องทาง เพื่อไม่ให้พารามิเตอร์สื่อที่ใช้เฉพาะ profile ถูก normalize กับการกระทำที่ไม่เกี่ยวข้องอย่าง `send`

แกนหลักส่ง scope ขณะรันไทม์เข้าสู่ขั้นตอนการค้นพบนั้น ฟิลด์สำคัญได้แก่:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ขาเข้าที่เชื่อถือได้

สิ่งนี้สำคัญสำหรับ Plugin ที่ไวต่อบริบท ช่องทางสามารถซ่อนหรือแสดงการกระทำข้อความตามบัญชีที่ใช้งานอยู่ ห้อง/thread/ข้อความปัจจุบัน หรือ identity ของผู้ร้องขอที่เชื่อถือได้ โดยไม่ต้อง hardcode branch เฉพาะช่องทางในเครื่องมือ `message` ของแกนหลัก

นี่คือเหตุผลที่การเปลี่ยนแปลง routing ของ embedded-runner ยังคงเป็นงานของ Plugin: runner มีหน้าที่ส่งต่อ identity ของแชต/session ปัจจุบันเข้าไปยังขอบเขตการค้นพบของ Plugin เพื่อให้เครื่องมือ `message` ที่ใช้ร่วมกันแสดงพื้นผิวที่ช่องทางเป็นเจ้าของอย่างถูกต้องสำหรับ turn ปัจจุบัน

สำหรับ helper การดำเนินการที่ช่องทางเป็นเจ้าของ Plugin ที่ bundled ควรเก็บ execution runtime ไว้ภายในโมดูล extension ของตนเอง แกนหลักไม่ได้เป็นเจ้าของ runtime ของการกระทำข้อความ Discord, Slack, Telegram หรือ WhatsApp ใต้ `src/agents/tools` อีกต่อไป เราไม่ได้เผยแพร่ subpath `plugin-sdk/*-action-runtime` แยกต่างหาก และ Plugin ที่ bundled ควร import โค้ด runtime ภายในของตนโดยตรงจากโมดูลที่ extension ของตนเป็นเจ้าของ

ขอบเขตเดียวกันนี้ใช้กับ seam ของ SDK ที่ตั้งชื่อตามผู้ให้บริการโดยทั่วไป: แกนหลักไม่ควร import barrel อำนวยความสะดวกเฉพาะช่องทางสำหรับ Slack, Discord, Signal, WhatsApp หรือ extension ลักษณะคล้ายกัน หากแกนหลักต้องการพฤติกรรมหนึ่ง ให้ consume barrel `api.ts` / `runtime-api.ts` ของ Plugin ที่ bundled เอง หรือยกระดับความต้องการนั้นเป็นความสามารถทั่วไปขนาดแคบใน SDK ที่ใช้ร่วมกัน

Plugin ที่ bundled ทำตามกฎเดียวกัน `runtime-api.ts` ของ Plugin ที่ bundled ไม่ควร re-export facade `openclaw/plugin-sdk/<plugin-id>` ที่มีแบรนด์ของตนเอง facade ที่มีแบรนด์เหล่านั้นยังคงเป็น compatibility shim สำหรับ Plugin ภายนอกและ consumer รุ่นเก่า แต่ Plugin ที่ bundled ควรใช้ export ภายในร่วมกับ subpath SDK ทั่วไปแบบแคบ เช่น `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, หรือ `openclaw/plugin-sdk/webhook-ingress` โค้ดใหม่ไม่ควรเพิ่ม SDK facade เฉพาะ plugin-id เว้นแต่ขอบเขต compatibility สำหรับ ecosystem ภายนอกที่มีอยู่ต้องการ

สำหรับ poll โดยเฉพาะ มีเส้นทางการดำเนินการสองแบบ:

- `outbound.sendPoll` คือ baseline ที่ใช้ร่วมกันสำหรับช่องทางที่เข้ากับโมเดล poll ทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่แนะนำสำหรับความหมายของ poll เฉพาะช่องทางหรือพารามิเตอร์ poll เพิ่มเติม

ตอนนี้แกนหลักเลื่อนการ parse poll ที่ใช้ร่วมกันออกไปจนกว่าการ dispatch poll ของ Plugin จะปฏิเสธการกระทำนั้น ดังนั้น handler poll ที่ Plugin เป็นเจ้าของจึงสามารถรับฟิลด์ poll เฉพาะช่องทางได้โดยไม่ถูก parser poll ทั่วไปขวางไว้ก่อน

ดู [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals) สำหรับลำดับ startup ทั้งหมด

## โมเดลความเป็นเจ้าของความสามารถ

OpenClaw ถือว่า native Plugin เป็นขอบเขตความเป็นเจ้าของสำหรับ **บริษัท** หรือ **ฟีเจอร์** ไม่ใช่ถุงรวม integration ที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- Plugin ของบริษัทโดยปกติควรเป็นเจ้าของพื้นผิวทั้งหมดของบริษัทนั้นที่หันเข้าหา OpenClaw
- Plugin ของฟีเจอร์โดยปกติควรเป็นเจ้าของพื้นผิวฟีเจอร์ทั้งหมดที่มันนำเข้ามา
- ช่องทางควร consume ความสามารถแกนหลักที่ใช้ร่วมกัน แทนที่จะ implement พฤติกรรมผู้ให้บริการใหม่แบบเฉพาะกิจ

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` เป็นเจ้าของ text inference, speech, realtime voice, media understanding, และ image generation `google` เป็นเจ้าของ text inference รวมถึง media understanding, image generation, และ web search `qwen` เป็นเจ้าของ text inference รวมถึง media understanding และ video generation
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` และ `microsoft` เป็นเจ้าของ speech; `firecrawl` เป็นเจ้าของ web-fetch; `minimax` / `mistral` / `moonshot` / `zai` เป็นเจ้าของ backend สำหรับ media-understanding
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` เป็นเจ้าของ call transport, tools, CLI, routes, และการ bridge media-stream ของ Twilio แต่ consume ความสามารถ speech, realtime transcription, และ realtime voice ที่ใช้ร่วมกัน แทนที่จะ import Plugin ผู้ให้บริการโดยตรง
  </Accordion>
</AccordionGroup>

สถานะปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน Plugin เดียว แม้ว่าจะครอบคลุมโมเดลข้อความ, speech, รูปภาพ, และวิดีโอในอนาคต
- vendor รายอื่นสามารถทำแบบเดียวกันกับพื้นที่พื้นผิวของตนเอง
- ช่องทางไม่สนใจว่า Plugin vendor ใดเป็นเจ้าของ provider; ช่องทาง consume สัญญาความสามารถที่ใช้ร่วมกันซึ่งแกนหลักเปิดเผย

นี่คือความแตกต่างสำคัญ:

- **Plugin** = ขอบเขตความเป็นเจ้าของ
- **ความสามารถ** = สัญญาแกนหลักที่ Plugin หลายตัวสามารถ implement หรือ consume ได้

ดังนั้นถ้า OpenClaw เพิ่มโดเมนใหม่ เช่น วิดีโอ คำถามแรกไม่ใช่ "provider ใดควร hardcode การจัดการวิดีโอ?" คำถามแรกคือ "สัญญาความสามารถวิดีโอของแกนหลักคืออะไร?" เมื่อสัญญานั้นมีอยู่แล้ว Plugin vendor สามารถลงทะเบียนกับสัญญานั้น และ Plugin ช่องทาง/ฟีเจอร์สามารถ consume ได้

หากความสามารถยังไม่มีอยู่ แนวทางที่ถูกต้องมักเป็น:

<Steps>
  <Step title="Define the capability">
    กำหนดความสามารถที่ขาดหายไปในแกนหลัก
  </Step>
  <Step title="Expose through the SDK">
    เปิดเผยผ่าน Plugin API/runtime ในแบบ typed
  </Step>
  <Step title="Wire consumers">
    เชื่อมช่องทาง/ฟีเจอร์เข้ากับความสามารถนั้น
  </Step>
  <Step title="Vendor implementations">
    ให้ Plugin vendor ลงทะเบียน implementation
  </Step>
</Steps>

วิธีนี้ทำให้ความเป็นเจ้าของชัดเจน ขณะหลีกเลี่ยงพฤติกรรมแกนหลักที่ขึ้นกับ vendor เดียวหรือ code path เฉพาะ Plugin แบบครั้งเดียว

### การแบ่งชั้นความสามารถ

ใช้ mental model นี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ไหน:

<Tabs>
  <Tab title="Core capability layer">
    การ orchestration, policy, fallback, กฎ merge config, semantics การส่งมอบ, และสัญญา typed ที่ใช้ร่วมกัน
  </Tab>
  <Tab title="Vendor plugin layer">
    API เฉพาะ vendor, auth, model catalog, speech synthesis, image generation, backend วิดีโอในอนาคต, endpoint การใช้งาน
  </Tab>
  <Tab title="Channel/feature plugin layer">
    integration อย่าง Slack/Discord/voice-call/etc. ที่ consume ความสามารถแกนหลักและนำเสนอความสามารถนั้นบนพื้นผิวหนึ่ง
  </Tab>
</Tabs>

ตัวอย่างเช่น TTS มีรูปแบบดังนี้:

- แกนหลักเป็นเจ้าของ policy TTS ณ เวลาตอบกลับ, ลำดับ fallback, prefs, และการส่งมอบผ่านช่องทาง
- `openai`, `elevenlabs`, และ `microsoft` เป็นเจ้าของ implementation การสังเคราะห์
- `voice-call` consume runtime helper TTS สำหรับโทรศัพท์

ควรเลือกใช้ pattern เดียวกันนี้สำหรับความสามารถในอนาคต

### ตัวอย่าง Plugin บริษัทแบบหลายความสามารถ

Plugin ของบริษัทควรรู้สึกเป็นหนึ่งเดียวจากภายนอก หาก OpenClaw มีสัญญาที่ใช้ร่วมกันสำหรับโมเดล, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch, และ web search vendor สามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนไว้ในที่เดียว:

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

สิ่งสำคัญไม่ใช่ชื่อ helper ที่ตรงตัว แต่เป็นรูปแบบ:

- Plugin หนึ่งตัวเป็นเจ้าของพื้นผิว vendor
- แกนหลักยังคงเป็นเจ้าของสัญญาความสามารถ
- ช่องทางและ Plugin ฟีเจอร์ consume helper `api.runtime.*` ไม่ใช่โค้ด vendor
- contract test สามารถ assert ได้ว่า Plugin ลงทะเบียนความสามารถที่อ้างว่าเป็นเจ้าของแล้ว

### ตัวอย่างความสามารถ: การทำความเข้าใจวิดีโอ

OpenClaw ถือว่าการทำความเข้าใจรูปภาพ/เสียง/วิดีโอเป็นความสามารถที่ใช้ร่วมกันหนึ่งเดียวอยู่แล้ว โมเดลความเป็นเจ้าของเดียวกันใช้กับกรณีนั้น:

<Steps>
  <Step title="Core defines the contract">
    แกนหลักกำหนดสัญญา media-understanding
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor ลงทะเบียน `describeImage`, `transcribeAudio`, และ `describeVideo` ตามที่ใช้ได้
  </Step>
  <Step title="Consumers use the shared behavior">
    ช่องทางและ Plugin ฟีเจอร์ consume พฤติกรรมแกนหลักที่ใช้ร่วมกัน แทนที่จะเชื่อมตรงกับโค้ด vendor
  </Step>
</Steps>

สิ่งนี้หลีกเลี่ยงการฝังสมมติฐานวิดีโอของ provider รายเดียวเข้าไปในแกนหลัก Plugin เป็นเจ้าของพื้นผิว vendor; แกนหลักเป็นเจ้าของสัญญาความสามารถและพฤติกรรม fallback

Video generation ใช้ลำดับเดียวกันนี้อยู่แล้ว: แกนหลักเป็นเจ้าของสัญญาความสามารถ typed และ runtime helper และ Plugin vendor ลงทะเบียน implementation `api.registerVideoGenerationProvider(...)` เข้ากับสัญญานั้น

ต้องการ checklist การ rollout ที่เป็นรูปธรรมใช่ไหม? ดู [Capability Cookbook](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว Plugin API ตั้งใจให้ typed และรวมศูนย์ใน `OpenClawPluginApi` สัญญานั้นกำหนดจุดลงทะเบียนที่รองรับและ runtime helper ที่ Plugin อาจพึ่งพาได้

เหตุผลที่สิ่งนี้สำคัญ:

- ผู้เขียน Plugin ได้มาตรฐานภายในที่เสถียรหนึ่งชุด
- แกนหลักสามารถปฏิเสธความเป็นเจ้าของที่ซ้ำกัน เช่น Plugin สองตัวลงทะเบียน provider id เดียวกัน
- startup สามารถแสดง diagnostic ที่ดำเนินการได้สำหรับการลงทะเบียนที่ผิดรูปแบบ
- contract test สามารถบังคับใช้ความเป็นเจ้าของของ Plugin ที่ bundled และป้องกัน drift แบบเงียบได้

การบังคับใช้มีสองชั้น:

<AccordionGroup>
  <Accordion title="การบังคับใช้การลงทะเบียนขณะรันไทม์">
    รีจิสทรี Plugin ตรวจสอบการลงทะเบียนเมื่อโหลด Plugin ตัวอย่างเช่น รหัสผู้ให้บริการซ้ำ รหัสผู้ให้บริการเสียงพูดซ้ำ และการลงทะเบียนที่ผิดรูปแบบจะสร้างการวินิจฉัย Plugin แทนที่จะเกิดพฤติกรรมที่ไม่ระบุแน่ชัด
  </Accordion>
  <Accordion title="การทดสอบสัญญา">
    Plugin ที่มาพร้อมแพ็กเกจจะถูกบันทึกไว้ในรีจิสทรีสัญญาระหว่างการรันทดสอบ เพื่อให้ OpenClaw สามารถยืนยันความเป็นเจ้าของได้อย่างชัดเจน ปัจจุบันสิ่งนี้ใช้กับผู้ให้บริการโมเดล ผู้ให้บริการเสียงพูด ผู้ให้บริการค้นหาเว็บ และความเป็นเจ้าของการลงทะเบียนที่มาพร้อมแพ็กเกจ
  </Accordion>
</AccordionGroup>

ผลในทางปฏิบัติคือ OpenClaw รู้ล่วงหน้าว่า Plugin ใดเป็นเจ้าของพื้นผิวใด สิ่งนี้ช่วยให้คอร์และช่องทางประกอบกันได้อย่างราบรื่น เพราะความเป็นเจ้าของถูกประกาศ มีชนิดข้อมูล และทดสอบได้ แทนที่จะเป็นสิ่งโดยนัย

### สิ่งที่ควรอยู่ในสัญญา

<Tabs>
  <Tab title="สัญญาที่ดี">
    - มีชนิดข้อมูล
    - เล็ก
    - เจาะจงตามความสามารถ
    - เป็นของคอร์
    - ใช้ซ้ำได้โดย Plugin หลายตัว
    - ช่องทาง/ฟีเจอร์ใช้งานได้โดยไม่ต้องรู้จักผู้ขาย

  </Tab>
  <Tab title="สัญญาที่ไม่ดี">
    - นโยบายเฉพาะผู้ขายที่ซ่อนอยู่ในคอร์
    - ช่องทางหลบเลี่ยงแบบเฉพาะกิจของ Plugin ที่ข้ามรีจิสทรี
    - โค้ดช่องทางเข้าถึงการใช้งานของผู้ขายโดยตรง
    - อ็อบเจ็กต์รันไทม์แบบเฉพาะกิจที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ `api.runtime`

  </Tab>
</Tabs>

เมื่อไม่แน่ใจ ให้ยกระดับนามธรรมขึ้น: กำหนดความสามารถก่อน จากนั้นให้ Plugin เสียบเข้ากับความสามารถนั้น

## โมเดลการดำเนินการ

Plugin แบบเนทีฟของ OpenClaw รัน **ในกระบวนการเดียวกัน** กับ Gateway โดยไม่ถูกแซนด์บ็อกซ์ Plugin แบบเนทีฟที่โหลดแล้วมีขอบเขตความเชื่อถือระดับกระบวนการเดียวกับโค้ดคอร์

<Warning>
ผลกระทบของ Plugin แบบเนทีฟ: Plugin สามารถลงทะเบียนเครื่องมือ ตัวจัดการเครือข่าย hook และบริการได้ บั๊กใน Plugin อาจทำให้ Gateway ขัดข้องหรือไม่เสถียร และ Plugin แบบเนทีฟที่ประสงค์ร้ายเทียบเท่ากับการรันโค้ดใดก็ได้ภายในกระบวนการ OpenClaw
</Warning>

บันเดิลที่เข้ากันได้จะปลอดภัยกว่าโดยค่าเริ่มต้น เพราะปัจจุบัน OpenClaw ถือว่าบันเดิลเหล่านั้นเป็นแพ็กเมทาดาทา/เนื้อหา ในรุ่นปัจจุบัน ส่วนใหญ่หมายถึง Skills ที่มาพร้อมแพ็กเกจ

ใช้รายการอนุญาตและเส้นทางติดตั้ง/โหลดที่ชัดเจนสำหรับ Plugin ที่ไม่ได้มาพร้อมแพ็กเกจ ให้ถือว่า Plugin ในเวิร์กสเปซเป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับโปรดักชัน

สำหรับชื่อแพ็กเกจเวิร์กสเปซที่มาพร้อมแพ็กเกจ ให้ยึดรหัส Plugin ไว้กับชื่อ npm: ค่าเริ่มต้นคือ `@openclaw/<id>` หรือส่วนต่อท้ายแบบมีชนิดข้อมูลที่ได้รับอนุมัติ เช่น `-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อแพ็กเกจตั้งใจเปิดเผยบทบาท Plugin ที่แคบกว่า

<Note>
**หมายเหตุด้านความเชื่อถือ:** `plugins.allow` เชื่อถือ **รหัส Plugin** ไม่ใช่ที่มาของซอร์ส Plugin ในเวิร์กสเปซที่มีรหัสเดียวกับ Plugin ที่มาพร้อมแพ็กเกจจะเงาทับสำเนาที่มาพร้อมแพ็กเกจโดยตั้งใจ เมื่อ Plugin ในเวิร์กสเปซนั้นถูกเปิดใช้งาน/อยู่ในรายการอนุญาต สิ่งนี้เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง การทดสอบแพตช์ และฮอตฟิกซ์ ความเชื่อถือของ Plugin ที่มาพร้อมแพ็กเกจจะถูกตัดสินจากสแนปช็อตซอร์ส ได้แก่ manifest และโค้ดบนดิสก์ ณ เวลาโหลด ไม่ใช่จากเมทาดาทาการติดตั้ง ระเบียนการติดตั้งที่เสียหายหรือถูกแทนที่ไม่สามารถขยายพื้นผิวความเชื่อถือของ Plugin ที่มาพร้อมแพ็กเกจอย่างเงียบ ๆ เกินกว่าสิ่งที่ซอร์สจริงประกาศไว้
</Note>

## ขอบเขตการส่งออก

OpenClaw ส่งออกความสามารถ ไม่ใช่ความสะดวกของการใช้งานภายใน

เปิดการลงทะเบียนความสามารถเป็นสาธารณะ ตัดการส่งออกตัวช่วยที่ไม่ใช่สัญญาออก:

- พาธย่อยตัวช่วยเฉพาะ Plugin ที่มาพร้อมแพ็กเกจ
- พาธย่อยระบบรันไทม์ที่ไม่ได้ตั้งใจให้เป็น API สาธารณะ
- ตัวช่วยอำนวยความสะดวกเฉพาะผู้ขาย
- ตัวช่วยการตั้งค่า/การเริ่มใช้งานที่เป็นรายละเอียดการใช้งานภายใน

พาธย่อยตัวช่วยของ Plugin ที่มาพร้อมแพ็กเกจที่สงวนไว้ถูกเลิกใช้จากแผนที่การส่งออก SDK ที่สร้างขึ้นแล้ว เก็บตัวช่วยเฉพาะเจ้าของไว้ภายในแพ็กเกจ Plugin เจ้าของ ยกระดับเฉพาะพฤติกรรมโฮสต์ที่ใช้ซ้ำได้ให้เป็นสัญญา SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`

## อินเทอร์นัลและข้อมูลอ้างอิง

สำหรับไปป์ไลน์การโหลด โมเดลรีจิสทรี hook รันไทม์ของผู้ให้บริการ เส้นทาง HTTP ของ Gateway สคีมาของเครื่องมือข้อความ การแก้เป้าหมายช่องทาง แค็ตตาล็อกผู้ให้บริการ Plugin ของเอนจินบริบท และคู่มือการเพิ่มความสามารถใหม่ ดู [อินเทอร์นัลสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Manifest ของ Plugin](/th/plugins/manifest)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
