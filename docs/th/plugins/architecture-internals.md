---
read_when:
    - การนำฮุกขณะรันไทม์ของผู้ให้บริการ วงจรชีวิตของช่องทาง หรือชุดแพ็กเกจไปใช้
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถใหม่ของ Plugin หรือ Plugin เอนจินบริบท
summary: 'ข้อมูลภายในสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกของรันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: รายละเอียดภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบ Plugin และสัญญาความเป็นเจ้าของ/การดำเนินการ ให้ดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็นเอกสารอ้างอิงสำหรับกลไกภายใน: ลำดับการโหลด, รีจิสทรี, ฮุก runtime, เส้นทาง HTTP ของ Gateway, เส้นทาง import และตาราง schema

## ลำดับการโหลด

เมื่อเริ่มต้น OpenClaw จะทำโดยประมาณดังนี้:

1. ค้นหารากของ Plugin ที่เป็นตัวเลือก
2. อ่าน manifest ของบันเดิลแบบ native หรือแบบเข้ากันได้ และ metadata ของแพ็กเกจ
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ทำให้ config ของ Plugin เป็นรูปแบบมาตรฐาน (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลดโมดูล native ที่เปิดใช้งาน: โมดูลที่บันเดิลมาและ build แล้วใช้ตัวโหลด native;
   ซอร์ส TypeScript ในเครื่องจากบุคคลที่สามใช้ fallback ฉุกเฉินของ Jiti
7. เรียกฮุก native `register(api)` และรวบรวมการลงทะเบียนเข้าไปในรีจิสทรี Plugin
8. เปิดเผยรีจิสทรีให้คำสั่งและพื้นผิว runtime ใช้งาน

<Note>
`activate` เป็น alias เดิมของ `register` — ตัวโหลดจะเลือกตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกที่จุดเดียวกัน Plugin ที่บันเดิลมาทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ให้เลือกใช้ `register`
</Note>

เกตความปลอดภัยจะเกิดขึ้น **ก่อน** การดำเนินการ runtime ตัวเลือกจะถูกบล็อก
เมื่อ entry หลุดออกจากรากของ Plugin, path เขียนได้โดยผู้ใช้ทั้งหมด, หรือความเป็นเจ้าของ
path ดูน่าสงสัยสำหรับ Plugin ที่ไม่ได้บันเดิลมา

ตัวเลือกที่ถูกบล็อกยังคงผูกกับ id ของ Plugin เพื่อการวินิจฉัย หาก config
ยังอ้างถึง id นั้น การตรวจสอบความถูกต้องจะรายงานว่า Plugin มีอยู่แต่ถูกบล็อก
และชี้กลับไปที่คำเตือนความปลอดภัยของ path แทนที่จะถือว่า entry ของ config
ล้าสมัย

### พฤติกรรมที่ยึด manifest เป็นหลัก

manifest คือแหล่งความจริงของ control plane OpenClaw ใช้สิ่งนี้เพื่อ:

- ระบุ Plugin
- ค้นหา channels/skills/config schema ที่ประกาศไว้ หรือความสามารถของบันเดิล
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่มเติม label/placeholder ของ Control UI
- แสดง metadata สำหรับการติดตั้ง/แคตตาล็อก
- รักษา descriptor สำหรับการเปิดใช้งานและการตั้งค่าที่มีต้นทุนต่ำ โดยไม่ต้องโหลด runtime ของ Plugin

สำหรับ Plugin แบบ native โมดูล runtime คือส่วน data plane โมดูลนี้ลงทะเบียน
พฤติกรรมจริง เช่น ฮุก, เครื่องมือ, คำสั่ง หรือ flow ของ provider

บล็อก `activation` และ `setup` แบบไม่บังคับใน manifest จะอยู่บน control plane
ต่อไป ทั้งสองเป็น descriptor แบบ metadata-only สำหรับการวางแผนการเปิดใช้งานและการค้นหาการตั้งค่า;
ไม่ได้แทนที่การลงทะเบียน runtime, `register(...)`, หรือ `setupEntry`
ผู้บริโภคการเปิดใช้งานจริงรายแรกตอนนี้ใช้ hint ของคำสั่ง, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ก่อนการ materialize รีจิสทรีที่กว้างกว่า:

- การโหลด CLI จำกัดให้เหลือ Plugin ที่เป็นเจ้าของคำสั่งหลักที่ร้องขอ
- การตั้งค่า channel/การ resolve Plugin จำกัดให้เหลือ Plugin ที่เป็นเจ้าของ
  id ของ channel ที่ร้องขอ
- การตั้งค่า/การ resolve runtime ของ provider แบบ explicit จำกัดให้เหลือ Plugin ที่เป็นเจ้าของ
  id ของ provider ที่ร้องขอ
- การวางแผนเริ่มต้น Gateway ใช้ `activation.onStartup` สำหรับ import ตอนเริ่มต้น
  และการ opt out จากการเริ่มต้นแบบ explicit; Plugin ที่ไม่มี metadata ตอนเริ่มต้นจะโหลดผ่าน
  trigger การเปิดใช้งานที่แคบกว่าเท่านั้น

การ preload runtime ตอน request ที่ขอ scope กว้าง `all` ยังคง derive
ชุด id ของ Plugin ที่มีผลแบบ explicit จาก config, การวางแผนเริ่มต้น, channel ที่กำหนดค่าไว้, slot และกฎ auto-enable หากชุดที่ derive ว่างเปล่า OpenClaw
จะโหลดรีจิสทรี runtime ว่างแทนการขยายไปยัง Plugin ทุกตัวที่ค้นพบได้

ตัววางแผนการเปิดใช้งานเปิดเผยทั้ง API แบบมีเฉพาะ ids สำหรับ caller เดิม และ
API แบบ plan สำหรับ diagnostics ใหม่ รายการใน plan รายงานว่าเหตุใด Plugin จึงถูกเลือก
โดยแยก hint ของตัววางแผน `activation.*` แบบ explicit ออกจาก fallback ความเป็นเจ้าของของ manifest
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และฮุก การแยกเหตุผลนั้นคือขอบเขตความเข้ากันได้:
metadata ของ Plugin เดิมยังคงทำงาน ขณะที่โค้ดใหม่สามารถตรวจพบ hint แบบกว้าง
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยนความหมายการโหลด runtime

ตอนนี้การค้นหาการตั้งค่าจะเลือก id ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด Plugin ที่เป็นตัวเลือก ก่อน fallback ไปที่
`setup-api` สำหรับ Plugin ที่ยังต้องใช้ฮุก runtime ตอนตั้งค่า รายการตั้งค่า
provider ใช้ `providerAuthChoices` ใน manifest, ตัวเลือกการตั้งค่าที่ derive จาก descriptor
และ metadata ของ install-catalog โดยไม่โหลด runtime ของ provider
`setup.requiresRuntime: false` แบบ explicit คือจุดตัดแบบ descriptor-only; การละเว้น
`requiresRuntime` จะคง fallback `setup-api` แบบเดิมไว้เพื่อความเข้ากันได้ หากมี Plugin
ที่ค้นพบมากกว่าหนึ่งตัว claim id ของ provider หรือ CLI backend สำหรับการตั้งค่าที่ normalize แล้วเหมือนกัน
การค้นหาการตั้งค่าจะปฏิเสธเจ้าของที่กำกวมแทนการพึ่งพาลำดับการค้นพบ
เมื่อ runtime ของการตั้งค่าถูกเรียกใช้ diagnostics ของรีจิสทรีจะรายงาน drift
ระหว่าง `setup.providers` / `setup.cliBackends` กับ provider หรือ CLI
backend ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก Plugin เดิม

### ขอบเขต cache ของ Plugin

OpenClaw ไม่ cache ผลการค้นหา Plugin หรือข้อมูลรีจิสทรี manifest โดยตรง
ไว้หลังช่วงเวลาตามนาฬิกา การติดตั้ง, การแก้ไข manifest และการเปลี่ยน load-path
ต้องมองเห็นได้ในการอ่าน metadata แบบ explicit ครั้งถัดไป หรือการ rebuild snapshot ครั้งถัดไป
parser ของไฟล์ manifest อาจเก็บ cache แบบจำกัดตามลายเซ็นไฟล์ โดย keyed จาก
path ของ manifest ที่เปิด, inode, size และ timestamp; cache นั้นมีไว้เพียงเพื่อหลีกเลี่ยง
การ parse byte ที่ไม่เปลี่ยนแปลงซ้ำ และต้องไม่ cache คำตอบด้านการค้นหา, รีจิสทรี, เจ้าของ หรือ
policy

fast path ของ metadata ที่ปลอดภัยคือความเป็นเจ้าของ object แบบ explicit ไม่ใช่ cache ที่ซ่อนอยู่
hot path ตอนเริ่มต้น Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ derive แล้ว หรือรีจิสทรี manifest แบบ explicit ผ่าน call
chain การตรวจสอบ config, startup auto-enable, การ bootstrap Plugin และการเลือก provider
สามารถใช้ object เหล่านั้นซ้ำได้ตราบใดที่ object เหล่านั้นแทน config และ
inventory ของ Plugin ปัจจุบัน การค้นหาการตั้งค่ายังคงสร้าง metadata manifest ใหม่ตามต้องการ
เว้นแต่ path การตั้งค่าเฉพาะจะได้รับรีจิสทรี manifest แบบ explicit; ให้คงสิ่งนั้น
เป็น fallback ของ cold path แทนการเพิ่ม cache ค้นหาที่ซ่อนอยู่ เมื่อ input
เปลี่ยน ให้ rebuild และแทนที่ snapshot แทนการ mutate snapshot หรือเก็บ
สำเนาประวัติไว้
view เหนือรีจิสทรี Plugin ที่ active และ helper การ bootstrap channel ที่บันเดิลมา
ควรถูกคำนวณใหม่จากรีจิสทรี/root ปัจจุบัน map อายุสั้นใช้ได้
ภายในหนึ่ง call เพื่อ dedupe งานหรือป้องกัน reentry; ต้องไม่กลายเป็น cache
metadata ของ process

สำหรับการโหลด Plugin ชั้น cache แบบ persistent คือการโหลด runtime ชั้นนี้อาจใช้
สถานะของ loader ซ้ำเมื่อโค้ดหรือ artifact ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และรีจิสทรี runtime ที่ active และเข้ากันได้
- cache ของ jiti/module และ cache ของตัวโหลด public-surface ที่ใช้เพื่อหลีกเลี่ยงการ import
  พื้นผิว runtime เดิมซ้ำๆ
- cache ของ filesystem สำหรับ artifact ของ Plugin ที่ติดตั้งแล้ว
- map อายุสั้นต่อ call สำหรับการ normalize path หรือการ resolve รายการซ้ำ

cache เหล่านั้นเป็นรายละเอียด implementation ของ data plane ต้องไม่ตอบ
คำถามของ control plane เช่น "Plugin ใดเป็นเจ้าของ provider นี้?" เว้นแต่
caller จะขอการโหลด runtime โดยเจตนา

อย่าเพิ่ม cache แบบ persistent หรือตามนาฬิกาสำหรับ:

- ผลการค้นหา
- รีจิสทรี manifest โดยตรง
- รีจิสทรี manifest ที่สร้างขึ้นใหม่จาก index ของ Plugin ที่ติดตั้งแล้ว
- การค้นหาเจ้าของ provider, การ suppress model, policy ของ provider หรือ metadata
  public-artifact
- คำตอบอื่นใดที่ derive จาก manifest ซึ่ง manifest, index ที่ติดตั้งแล้ว
  หรือ load path ที่เปลี่ยนไปควรมองเห็นได้ในการอ่าน metadata ครั้งถัดไป

caller ที่ rebuild metadata ของ manifest จาก index ของ Plugin ที่ติดตั้งแล้วซึ่ง persist อยู่
จะสร้างรีจิสทรีนั้นใหม่ตามต้องการ index ที่ติดตั้งแล้วคือสถานะ source-plane
ที่ durable; ไม่ใช่ cache metadata ใน process ที่ซ่อนอยู่

## โมเดลรีจิสทรี

Plugin ที่โหลดแล้วไม่ได้ mutate global แบบสุ่มของ core โดยตรง แต่ลงทะเบียนเข้าไปใน
รีจิสทรี Plugin ส่วนกลาง

รีจิสทรีติดตาม:

- record ของ Plugin (identity, source, origin, status, diagnostics)
- เครื่องมือ
- ฮุกเดิมและฮุกแบบ typed
- channel
- provider
- handler ของ Gateway RPC
- เส้นทาง HTTP
- registrar ของ CLI
- service เบื้องหลัง
- คำสั่งที่ Plugin เป็นเจ้าของ

จากนั้นฟีเจอร์ core จะอ่านจากรีจิสทรีนั้นแทนการคุยกับโมดูล Plugin
โดยตรง วิธีนี้ทำให้การโหลดเป็นแบบทางเดียว:

- โมดูล Plugin -> การลงทะเบียนรีจิสทรี
- runtime ของ core -> การบริโภครีจิสทรี

การแยกนี้สำคัญต่อการบำรุงรักษา หมายความว่าพื้นผิว core ส่วนใหญ่ต้องการ
จุด integration เพียงจุดเดียว: "อ่านรีจิสทรี" ไม่ใช่ "ทำ special-case ให้ทุกโมดูล Plugin"

## callback การผูก conversation

Plugin ที่ผูก conversation สามารถตอบสนองเมื่อ approval ถูก resolve ได้

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจาก request การผูก
ได้รับการอนุมัติหรือปฏิเสธ:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

ฟิลด์ของ payload callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับ request ที่อนุมัติ
- `request`: สรุป request เดิม, detach hint, id ของ sender และ
  metadata ของ conversation

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ผูก
conversation และจะทำงานหลังจาก core จัดการ approval เสร็จแล้ว

## ฮุก runtime ของ provider

Plugin ของ provider มีสามชั้น:

- **metadata ของ manifest** สำหรับการค้นหาก่อน runtime ที่มีต้นทุนต่ำ:
  `setup.providers[].envVars`, ความเข้ากันได้แบบ deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **ฮุกตอน config**: `catalog` (`discovery` เดิม) รวมถึง
  `applyConfigDefaults`
- **ฮุก runtime**: ฮุกแบบ optional มากกว่า 40 รายการ ครอบคลุม auth, การ resolve model,
  การ wrap stream, ระดับ thinking, policy การ replay และ endpoint การใช้งาน ดู
  รายการเต็มใต้ [ลำดับและการใช้งานฮุก](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ loop ของ agent แบบทั่วไป, failover, การจัดการ transcript และ
policy ของเครื่องมือ ฮุกเหล่านี้คือพื้นผิว extension สำหรับพฤติกรรมเฉพาะ provider
โดยไม่จำเป็นต้องมี inference transport แบบกำหนดเองทั้งชุด

ใช้ `setup.providers[].envVars` ใน manifest เมื่อ provider มี credential ที่อิง env
ซึ่ง path auth/status/model-picker แบบทั่วไปควรมองเห็นโดยไม่ต้องโหลด runtime ของ Plugin
`providerAuthEnvVars` ที่ deprecated แล้วยังคงถูกอ่านโดย compatibility adapter
ในช่วง deprecation window และ Plugin ที่ไม่ได้บันเดิลมาซึ่งใช้สิ่งนี้จะได้รับ
diagnostic ของ manifest ใช้ `providerAuthAliases` ใน manifest เมื่อ id ของ provider
หนึ่งควร reuse env var, auth profile, auth ที่ backing ด้วย config และตัวเลือก
onboarding สำหรับ API key ของ id provider อีกตัว ใช้ `providerAuthChoices` ใน manifest
เมื่อพื้นผิว onboarding/auth-choice ของ CLI ควรรู้ id ของตัวเลือก provider, label ของ group
และการต่อ wiring auth แบบ one-flag ง่ายๆ โดยไม่โหลด runtime ของ provider เก็บ
`envVars` ของ runtime provider ไว้สำหรับ hint ที่ operator เห็น เช่น label ของ onboarding
หรือ setup var ของ OAuth client-id/client-secret

ใช้ `channelEnvVars` ใน manifest เมื่อ channel มี auth หรือการตั้งค่าที่ขับเคลื่อนด้วย env
ซึ่ง shell-env fallback แบบทั่วไป, การตรวจสอบ config/status หรือ prompt การตั้งค่าควรมองเห็น
โดยไม่โหลด runtime ของ channel

### ลำดับและการใช้งานฮุก

สำหรับ Plugin ของ model/provider OpenClaw จะเรียกฮุกในลำดับคร่าวๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือตัดสินใจแบบเร็ว
ฟิลด์ provider แบบ compatibility-only ที่ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` ตั้งใจไม่ถูก
แสดงไว้ที่นี่

| #   | ฮุก                               | สิ่งที่ทำ                                                                                                   | ควรใช้เมื่อใด                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการลงใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปธรรม                                      | ค่าเริ่มต้นขึ้นกับโหมด auth, env หรือ semantics ของตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองใช้เส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ฮุกของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้นามแฝง model-id แบบ legacy หรือ preview เป็นมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างนามแฝงก่อนการ resolve โมเดล canonical                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของตระกูลผู้ให้บริการเป็นมาตรฐานก่อนประกอบโมเดลแบบ generic                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับรหัสผู้ให้บริการแบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อนการ resolve runtime/provider                                           | ผู้ให้บริการต้องล้าง config ที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมายังเป็น backstop ให้รายการ config ของ Google ที่รองรับด้วย   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียน compat ของ native streaming-usage ใหม่กับผู้ให้บริการ config                                               | ผู้ให้บริการต้องแก้ metadata การใช้ native streaming ที่ขับเคลื่อนโดย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Resolve auth แบบ env-marker สำหรับผู้ให้บริการ config ก่อนโหลด runtime auth                                       | ผู้ให้บริการมีการ resolve API-key แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมีตัว resolve AWS env-marker ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดง auth แบบ local/self-hosted หรือ config-backed โดยไม่ persist plaintext                                   | ผู้ให้บริการสามารถทำงานด้วย marker credential แบบ synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Overlay โปรไฟล์ auth ภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับ credential ที่ CLI/app เป็นเจ้าของ | ผู้ให้บริการนำ credential auth ภายนอกมาใช้ซ้ำโดยไม่ persist refresh token ที่คัดลอกมา; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ placeholder โปรไฟล์ synthetic ที่จัดเก็บไว้ไว้หลัง auth แบบ env/config-backed                                      | ผู้ให้บริการจัดเก็บโปรไฟล์ placeholder แบบ synthetic ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | Fallback แบบ sync สำหรับรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่อยู่ใน registry ภายในเครื่อง                                       | ผู้ให้บริการยอมรับรหัสโมเดล upstream ใดก็ได้                                                                                                 |
| 12  | `prepareDynamicModel`             | Warm-up แบบ async แล้ว `resolveDynamicModel` จะทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องใช้ metadata จากเครือข่ายก่อน resolve รหัสที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | เขียนใหม่ครั้งสุดท้ายก่อน embedded runner ใช้โมเดลที่ resolve แล้ว                                               | ผู้ให้บริการต้องเขียน transport ใหม่แต่ยังใช้ transport หลัก                                                                             |
| 14  | `contributeResolvedModelCompat`   | เพิ่มธง compat สำหรับโมเดลของผู้ขายที่อยู่หลัง transport อื่นที่เข้ากันได้                                  | ผู้ให้บริการรู้จักโมเดลของตนเองบน proxy transport โดยไม่เข้าควบคุมผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ทำให้ schema ของเครื่องมือเป็นมาตรฐานก่อนที่ embedded runner จะเห็น                                                    | ผู้ให้บริการต้องล้าง schema ของตระกูล transport                                                                                                |
| 16  | `inspectToolSchemas`              | แสดง diagnostics ของ schema ที่ผู้ให้บริการเป็นเจ้าของหลัง normalization                                                  | ผู้ให้บริการต้องการคำเตือน keyword โดยไม่สอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือก contract ของ reasoning-output แบบ native หรือ tagged                                                              | ผู้ให้บริการต้องใช้ reasoning/final output แบบ tagged แทนฟิลด์ native                                                                         |
| 18  | `prepareExtraParams`              | ทำให้ request-param เป็นมาตรฐานก่อน wrapper ตัวเลือก stream แบบ generic                                              | ผู้ให้บริการต้องใช้ request params เริ่มต้นหรือการล้าง param เฉพาะผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่เส้นทาง stream ปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องใช้ wire protocol แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper ของ stream หลังใช้ wrapper แบบ generic แล้ว                                                              | ผู้ให้บริการต้องใช้ wrapper ของ request headers/body/model compat โดยไม่ใช้ transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบ header หรือ metadata ของ transport ต่อ turn แบบ native                                                           | ผู้ให้บริการต้องการให้ transport แบบ generic ส่ง identity ของ turn แบบ native ของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบ header ของ WebSocket แบบ native หรือนโยบาย cool-down ของ session                                                    | ผู้ให้บริการต้องการให้ transport WS แบบ generic ปรับ header ของ session หรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการจัดเก็บ metadata auth เพิ่มเติมและต้องการรูปทรง token ของ runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | Override การ refresh OAuth สำหรับ endpoint refresh แบบกำหนดเองหรือนโยบาย refresh-failure                                  | ผู้ให้บริการไม่เข้ากับ refresher `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมแซมที่ต่อท้ายเมื่อการ refresh OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อม auth ที่ผู้ให้บริการเป็นเจ้าของหลัง refresh ล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | Matcher context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic แบบ generic จะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถ map ข้อผิดพลาด API/transport ดิบเป็น rate-limit/overload/etc                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้อง gating TTL ของ cache เฉพาะ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | ข้อความแทนที่สำหรับข้อความ recovery missing-auth แบบ generic                                                      | ผู้ให้บริการต้องการคำแนะนำ recovery missing-auth เฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อก synthetic/final ที่ต่อท้ายหลัง discovery                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบ synthetic ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล ป้ายกำกับแสดงผล และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับ thinking แบบกำหนดเองหรือป้ายกำกับแบบไบนารีสำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | ฮุกความเข้ากันได้ของ toggle reasoning แบบเปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเพียง thinking แบบไบนารีเปิด/ปิด                                                                                                  |
| 33  | `supportsXHighThinking`           | ฮุกความเข้ากันได้ของการรองรับ reasoning `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะบางโมเดล                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | ฮุกความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 35  | `isModernModelRef`                | Matcher โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่ preferred-model สำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยน credential ที่กำหนดค่าไว้เป็น token/key ของ runtime จริงก่อน inference                       | ผู้ให้บริการต้องใช้การแลกเปลี่ยน token หรือ credential คำขออายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แก้ไขข้อมูลรับรองการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลรับรองการใช้งานที่แตกต่างกัน                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและปรับสแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการให้เป็นรูปแบบมาตรฐานหลังจากแก้ไข auth แล้ว                             | ผู้ให้บริการต้องการ endpoint การใช้งานหรือ parser payload เฉพาะผู้ให้บริการ                                                                           |
| 39  | `createEmbeddingProvider`         | สร้าง adapter embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำเป็นของ Plugin ผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบาย replay ที่ควบคุมการจัดการ transcript สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบาย transcript แบบกำหนดเอง (เช่น การตัด thinking-block ออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติ replay ใหม่หลังจากการล้าง transcript แบบทั่วไป                                                        | ผู้ให้บริการต้องการการเขียน replay ใหม่เฉพาะผู้ให้บริการ นอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องหรือปรับรูปแบบ replay-turn ขั้นสุดท้ายก่อนตัวรันแบบฝัง                                           | ทรานสปอร์ตของผู้ให้บริการต้องการการตรวจสอบ turn ที่เข้มงวดยิ่งขึ้นหลังการทำความสะอาดแบบทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ side effect หลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการ telemetry หรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลกลายเป็นรายการที่ใช้งานอยู่                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ของผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงไล่ไปยัง Plugin ผู้ให้บริการอื่นที่รองรับ hook
จนกว่าจะมีตัวใดเปลี่ยนรหัสโมเดลหรือ transport/config จริง วิธีนี้ทำให้
shim ของผู้ให้บริการสำหรับ alias/compat ยังทำงานได้โดยผู้เรียกไม่ต้องรู้ว่า
Plugin ที่รวมมาด้วยตัวใดเป็นเจ้าของการเขียนใหม่นั้น หากไม่มี hook ของผู้ให้บริการใดเขียนรายการ config
ตระกูล Google ที่รองรับใหม่ ตัวปรับ Google config normalizer ที่รวมมาด้วยจะยังคงใช้
การล้างข้อมูลเพื่อความเข้ากันได้นั้น

หากผู้ให้บริการต้องการ wire protocol แบบกำหนดเองทั้งหมดหรือ request executor แบบกำหนดเอง
นั่นเป็นส่วนขยายอีกประเภทหนึ่ง hook เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังคงทำงานบน inference loop ปกติของ OpenClaw

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

### ตัวอย่างที่มีในตัว

Plugin ผู้ให้บริการที่รวมมาด้วยผสาน hook ข้างต้นเพื่อให้เหมาะกับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของผู้ขายแต่ละราย ชุด hook ที่เป็นแหล่งอ้างอิงจริงอยู่กับ
แต่ละ Plugin ภายใต้ `extensions/`; หน้านี้แสดงรูปแบบแทนการ
ทำสำเนารายการทั้งหมด

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` ร่วมกับ
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้แสดงรหัสโมเดลจาก upstream
    ก่อน catalog แบบคงที่ของ OpenClaw ได้
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลก token และการผสาน `/usage`
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    กลุ่มที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการเลือกใช้
    นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะต้องสร้างการล้างข้อมูลซ้ำเอง
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเพียง `catalog` และใช้ inference loop ร่วม
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน seam สาธารณะ
    `api.ts` / `contract-api.ts` ของ Anthropic Plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) ไม่ใช่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วย runtime

Plugin สามารถเข้าถึงตัวช่วย core ที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS ของ core ปกติสำหรับพื้นผิวไฟล์/voice-note
- ใช้ config `messages.tts` ของ core และการเลือกผู้ให้บริการ
- ส่งคืนบัฟเฟอร์เสียง PCM + sample rate Plugin ต้อง resample/encode สำหรับผู้ให้บริการเอง
- `listVoices` เป็นตัวเลือกตามผู้ให้บริการ ใช้สำหรับตัวเลือกเสียงหรือขั้นตอนตั้งค่าที่ผู้ขายเป็นเจ้าของ
- รายการเสียงอาจรวม metadata ที่ละเอียดขึ้น เช่น locale, gender และแท็ก personality สำหรับตัวเลือกที่รู้จักผู้ให้บริการ
- OpenAI และ ElevenLabs รองรับ telephony ในปัจจุบัน Microsoft ไม่รองรับ

Plugin ยังสามารถลงทะเบียนผู้ให้บริการ speech ผ่าน `api.registerSpeechProvider(...)` ได้ด้วย

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

- เก็บนโยบาย TTS, fallback และการส่ง reply ไว้ใน core
- ใช้ผู้ให้บริการ speech สำหรับพฤติกรรม synthesis ที่ผู้ขายเป็นเจ้าของ
- อินพุต Microsoft `edge` แบบเดิมจะถูกปรับให้เป็นรหัสผู้ให้บริการ `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำคือแบบอิงบริษัท: Plugin ผู้ขายหนึ่งตัวสามารถเป็นเจ้าของ
  ผู้ให้บริการ text, speech, image และสื่อในอนาคตได้เมื่อ OpenClaw เพิ่ม
  สัญญาความสามารถเหล่านั้น

สำหรับการทำความเข้าใจ image/audio/video นั้น Plugin จะลงทะเบียนผู้ให้บริการ
media-understanding แบบ typed หนึ่งตัวแทน key/value bag ทั่วไป:

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

- เก็บ orchestration, fallback, config และการเชื่อม channel ไว้ใน core
- เก็บพฤติกรรมของผู้ขายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบเพิ่มเติมควรยังเป็น typed: เมธอด optional ใหม่ ฟิลด์ผลลัพธ์ optional ใหม่
  ความสามารถ optional ใหม่
- การสร้างวิดีโอใช้รูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของสัญญาความสามารถและ runtime helper
  - Plugin ผู้ขายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin ฟีเจอร์/channel ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helper ของ media-understanding นั้น Plugin สามารถเรียก:

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

สำหรับการถอดเสียง audio นั้น Plugin สามารถใช้ได้ทั้ง runtime ของ media-understanding
หรือ alias STT เดิม:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวร่วมที่แนะนำสำหรับ
  การทำความเข้าใจ image/audio/video
- ใช้ config audio ของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียงเกิดขึ้น (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่เป็น alias เพื่อความเข้ากันได้

Plugin ยังสามารถเริ่มการรัน subagent เบื้องหลังผ่าน `api.runtime.subagent` ได้ด้วย:

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

- `provider` และ `model` เป็น override ต่อการรันแบบ optional ไม่ใช่การเปลี่ยน session แบบถาวร
- OpenClaw จะยอมรับฟิลด์ override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ ผู้ปฏิบัติงานต้องเลือกใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้อยู่ที่เป้าหมาย `provider/model` แบบ canonical ที่เฉพาะเจาะจง หรือ `"*"` เพื่ออนุญาตเป้าหมายใด ๆ อย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่เชื่อถือได้ยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนการ fallback แบบเงียบ
- session ของ subagent ที่ Plugin สร้างจะถูกแท็กด้วยรหัส Plugin ที่สร้างขึ้น Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะ session ที่เป็นเจ้าของเหล่านั้นเท่านั้น; การลบ session ใด ๆ โดยพลการยังต้องใช้คำขอ Gateway ที่มี scope แบบ admin

สำหรับการค้นหาเว็บนั้น Plugin สามารถใช้ runtime helper ร่วมแทน
การเข้าถึง wiring ของ agent tool โดยตรง:

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

Plugin ยังสามารถลงทะเบียนผู้ให้บริการ web-search ผ่าน
`api.registerWebSearchProvider(...)` ได้ด้วย

หมายเหตุ:

- เก็บการเลือกผู้ให้บริการ การแก้ไข credential และ semantics ของคำขอร่วมไว้ใน core
- ใช้ผู้ให้บริการ web-search สำหรับ search transport เฉพาะผู้ขาย
- `api.runtime.webSearch.*` คือพื้นผิวร่วมที่แนะนำสำหรับ Plugin ฟีเจอร์/channel ที่ต้องการพฤติกรรมการค้นหาโดยไม่พึ่งพา wrapper ของ agent tool

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

- `generate(...)`: สร้างรูปภาพโดยใช้ chain ของผู้ให้บริการ image-generation ที่ตั้งค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่พร้อมใช้งานและความสามารถของพวกเขา

## เส้นทาง HTTP ของ Gateway

Plugin สามารถเปิดเผย endpoint HTTP ด้วย `api.registerHttpRoute(...)`

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

- `path`: เส้นทาง route ใต้เซิร์ฟเวอร์ HTTP ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อกำหนดให้ต้องใช้ auth ปกติของ gateway หรือ `"plugin"` สำหรับการยืนยัน auth/webhook ที่ Plugin จัดการเอง
- `match`: optional `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: optional อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตัวเอง
- `handler`: ส่งคืน `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้วและจะทำให้เกิดข้อผิดพลาดในการโหลด Plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบตรงกันทุกประการจะถูกปฏิเสธ เว้นแต่จะตั้งค่า `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่เส้นทางของ Plugin อื่นได้
- เส้นทางที่ทับซ้อนกันซึ่งมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้ใช้สายโซ่ fallthrough ของ `exact`/`prefix` เฉพาะในระดับ auth เดียวกันเท่านั้น
- เส้นทาง `auth: "plugin"` จะ **ไม่ได้** รับสโคปรันไทม์ของผู้ปฏิบัติการโดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ Webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการ ไม่ใช่การเรียกตัวช่วย Gateway ที่มีสิทธิ์สูง
- เส้นทาง `auth: "gateway"` ทำงานภายในสโคปรันไทม์ของคำขอ Gateway แต่สโคปนั้นตั้งใจให้มีข้อจำกัดอย่างรอบคอบ:
  - auth แบบ bearer ด้วยความลับร่วม (`gateway.auth.mode = "token"` / `"password"`) จะตรึงสโคปรันไทม์ของเส้นทาง Plugin ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมีส่วนหัวนี้อย่างชัดเจนเท่านั้น
  - หากไม่มี `x-openclaw-scopes` ในคำขอเส้นทาง Plugin ที่มีตัวตนเหล่านั้น สโคปรันไทม์จะย้อนกลับไปใช้ `operator.write`
- กฎเชิงปฏิบัติ: อย่าถือว่าเส้นทาง Plugin ที่ใช้ gateway-auth เป็นพื้นผิวผู้ดูแลโดยปริยาย หากเส้นทางของคุณต้องการพฤติกรรมเฉพาะผู้ดูแล ให้กำหนดให้ใช้โหมด auth ที่มีตัวตน และจัดทำเอกสารสัญญาส่วนหัว `x-openclaw-scopes` ที่ชัดเจน

## เส้นทางนำเข้าของ Plugin SDK

ใช้ subpath ของ SDK ที่แคบแทน barrel รากแบบรวมศูนย์ `openclaw/plugin-sdk`
เมื่อสร้าง Plugin ใหม่ subpath หลัก:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วยสำหรับ entry/build ของช่องทาง                        |
| `openclaw/plugin-sdk/core`          | ตัวช่วยร่วมทั่วไปและสัญญาครอบคลุม       |
| `openclaw/plugin-sdk/config-schema` | สกีมา Zod ของ `openclaw.json` ราก (`OpenClawSchema`) |

Plugin ช่องทางเลือกใช้จากชุด seam ที่แคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
ไว้ที่สัญญา `approvalCapability` เดียว แทนการผสมข้ามฟิลด์ Plugin
ที่ไม่เกี่ยวข้องกัน ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ตัวช่วยรันไทม์และ config อยู่ภายใต้ subpath `*-runtime` ที่เจาะจงตรงกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ควรใช้ `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation`
แทน barrel ความเข้ากันได้แบบกว้าง `config-runtime`

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น shim ความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควรนำเข้า primitive ทั่วไปที่แคบกว่าแทน
</Info>

entry point ภายใน repo (ต่อรากแพ็กเกจ Plugin ที่บันเดิลมา):

- `index.js` — entry ของ Plugin ที่บันเดิลมา
- `api.js` — barrel ตัวช่วย/ชนิดข้อมูล
- `runtime-api.js` — barrel เฉพาะรันไทม์
- `setup-entry.js` — entry ของ Plugin ตั้งค่า

Plugin ภายนอกควรนำเข้าเฉพาะ subpath `openclaw/plugin-sdk/*` เท่านั้น ห้าม
นำเข้า `src/*` ของแพ็กเกจ Plugin อื่นจาก core หรือจาก Plugin อื่น
entry point ที่โหลดผ่าน facade จะเลือก snapshot config รันไทม์ที่ใช้งานอยู่เมื่อมีอยู่
จากนั้นจึง fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์

subpath เฉพาะ capability เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ Plugin ที่บันเดิลมาใช้งานในปัจจุบัน สิ่งเหล่านี้ไม่ได้เป็น
สัญญาภายนอกที่ถูกตรึงระยะยาวโดยอัตโนมัติ ให้ตรวจสอบหน้าอ้างอิง SDK
ที่เกี่ยวข้องเมื่อพึ่งพาใช้งาน

## สกีมาของเครื่องมือข้อความ

Plugin ควรเป็นเจ้าของการส่งเสริมสกีมา `describeMessageTool(...)`
เฉพาะช่องทางสำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
การนำเสนอการส่งแบบร่วมควรใช้สัญญา `MessagePresentation` ทั่วไป
แทนฟิลด์ button, component, block หรือ card แบบ native ของผู้ให้บริการ
ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญา
กฎ fallback การแมปผู้ให้บริการ และ checklist สำหรับผู้เขียน Plugin

Plugin ที่ส่งข้อความได้ประกาศสิ่งที่สามารถเรนเดอร์ผ่าน capability ของข้อความ:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอปักหมุดการส่ง

Core ตัดสินใจว่าจะเรนเดอร์การนำเสนอแบบ native หรือ degrade เป็นข้อความ
อย่าเปิดเผยช่องทางลัด UI แบบ native ของผู้ให้บริการจากเครื่องมือข้อความทั่วไป
ตัวช่วย SDK ที่เลิกแนะนำแล้วสำหรับสกีมา native แบบเก่ายังคง export ไว้สำหรับ
Plugin ภายนอกที่มีอยู่ แต่ Plugin ใหม่ไม่ควรใช้

## การ resolve เป้าหมายช่องทาง

Plugin ช่องทางควรเป็นเจ้าของความหมายของเป้าหมายเฉพาะช่องทาง เก็บ host
outbound แบบร่วมให้เป็นแบบทั่วไป และใช้พื้นผิว adapter การส่งข้อความสำหรับกฎของผู้ให้บริการ:

- `messaging.inferTargetChatType({ to })` ตัดสินว่าเป้าหมายที่ normalize แล้ว
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อนค้นหาในไดเรกทอรี
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่าอินพุต
  ควรข้ามตรงไปยังการ resolve แบบคล้าย id แทนการค้นหาไดเรกทอรีหรือไม่
- `messaging.targetResolver.resolveTarget(...)` เป็น fallback ของ Plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ผู้ให้บริการเป็นเจ้าของหลังการ normalize หรือหลังจาก
  ไม่พบในไดเรกทอรี
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้างเส้นทางเซสชัน
  เฉพาะผู้ให้บริการเมื่อ resolve เป้าหมายแล้ว

การแยกส่วนที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจว่า "ให้ปฏิบัติต่อสิ่งนี้เป็น id เป้าหมายแบบชัดเจน/native"
- ใช้ `resolveTarget` สำหรับ fallback การ normalize เฉพาะผู้ให้บริการ ไม่ใช่สำหรับ
  การค้นหาไดเรกทอรีแบบกว้าง
- เก็บ id แบบ native ของผู้ให้บริการ เช่น chat ids, thread ids, JIDs, handles และ room
  ids ไว้ภายในค่า `target` หรือพารามิเตอร์เฉพาะผู้ให้บริการ ไม่ใช่ในฟิลด์ SDK
  ทั่วไป

## ไดเรกทอรีที่อิง config

Plugin ที่ derive รายการไดเรกทอรีจาก config ควรเก็บตรรกะนั้นไว้ใน
Plugin และใช้ตัวช่วยร่วมจาก
`openclaw/plugin-sdk/directory-runtime`

ใช้สิ่งนี้เมื่อช่องทางต้องการ peers/groups ที่อิง config เช่น:

- DM peers ที่ขับเคลื่อนด้วย allowlist
- แผนที่ช่องทาง/กลุ่มที่กำหนดค่าไว้
- fallback ไดเรกทอรีแบบ static ตามสโคปบัญชี

ตัวช่วยร่วมใน `directory-runtime` จัดการเฉพาะการดำเนินการทั่วไป:

- การกรอง query
- การใช้ limit
- ตัวช่วย dedupe/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id เฉพาะช่องทางควรอยู่ใน
การใช้งานของ Plugin

## แค็ตตาล็อกผู้ให้บริการ

Plugin ผู้ให้บริการสามารถกำหนดแค็ตตาล็อกโมเดลสำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืนค่ารูปทรงเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับรายการผู้ให้บริการหนึ่งรายการ
- `{ providers }` สำหรับรายการผู้ให้บริการหลายรายการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ id โมเดลเฉพาะผู้ให้บริการ ค่าเริ่มต้น base URL
หรือ metadata โมเดลที่ถูก gate ด้วย auth

`catalog.order` ควบคุมเวลาที่แค็ตตาล็อกของ Plugin merge เทียบกับผู้ให้บริการ implicit
ในตัวของ OpenClaw:

- `simple`: ผู้ให้บริการที่ขับเคลื่อนด้วย API key หรือ env แบบธรรมดา
- `profile`: ผู้ให้บริการที่ปรากฏเมื่อมีโปรไฟล์ auth
- `paired`: ผู้ให้บริการที่สังเคราะห์รายการผู้ให้บริการที่เกี่ยวข้องหลายรายการ
- `late`: pass สุดท้าย หลังผู้ให้บริการ implicit อื่น

ผู้ให้บริการภายหลังชนะเมื่อ key collision ดังนั้น Plugin สามารถ override
รายการผู้ให้บริการในตัวที่มี provider id เดียวกันได้โดยตั้งใจ

ความเข้ากันได้:

- `discovery` ยังทำงานเป็น alias รุ่นเก่า
- หากลงทะเบียนทั้ง `catalog` และ `discovery` แล้ว OpenClaw จะใช้ `catalog`

## การตรวจสอบช่องทางแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนช่องทาง ควร implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` เป็นเส้นทางรันไทม์ อนุญาตให้ถือว่า credential
  ถูก materialize ครบถ้วนแล้ว และสามารถล้มเหลวเร็วเมื่อขาด secret ที่จำเป็น
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และโฟลว์ doctor/config
  repair ไม่ควรต้อง materialize credential รันไทม์เพียงเพื่อ
  อธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะบัญชีแบบบรรยาย
- คงค่า `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่า token ดิบเพียงเพื่อรายงานความพร้อมใช้งาน
  แบบอ่านอย่างเดียว การคืน `tokenStatus: "available"` (และฟิลด์แหล่งที่มาตรงกัน)
  ก็เพียงพอสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

สิ่งนี้ทำให้คำสั่งแบบอ่านอย่างเดียวสามารถรายงานว่า "กำหนดค่าแล้วแต่ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้"
แทนการ crash หรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## แพ็กแพ็กเกจ

ไดเรกทอรี Plugin อาจมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หากแพ็กระบุ extension หลายรายการ id ของ Plugin
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณนำเข้า npm deps ให้ติดตั้งในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

แนวป้องกันด้านความปลอดภัย: entry ทุกตัวใน `openclaw.extensions` ต้องอยู่ภายในไดเรกทอรี Plugin
หลัง resolve symlink แล้ว entry ที่หลุดออกจากไดเรกทอรีแพ็กเกจจะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependency ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบ local ต่อโปรเจกต์ (ไม่มี lifecycle scripts,
ไม่มี dev dependencies ตอนรันไทม์) โดยไม่สนใจการตั้งค่า npm install ส่วนกลางที่สืบทอดมา
รักษา dependency tree ของ Plugin ให้เป็น "JS/TS ล้วน" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้
build แบบ `postinstall`

ไม่บังคับ: `openclaw.setupEntry` สามารถชี้ไปยังโมดูล setup-only ที่เบาได้
เมื่อ OpenClaw ต้องการพื้นผิวการตั้งค่าสำหรับ Plugin ช่องทางที่ปิดใช้งานอยู่ หรือ
เมื่อ Plugin ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า จะโหลด `setupEntry`
แทน entry ของ Plugin แบบเต็ม สิ่งนี้ทำให้การเริ่มต้นและการตั้งค่าเบาลง
เมื่อ entry หลักของ Plugin ของคุณยังต่อสาย tools, hooks หรือโค้ดอื่น
ที่ใช้เฉพาะรันไทม์ด้วย

ไม่บังคับ: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถเลือกให้ Plugin ช่องทางใช้เส้นทาง `setupEntry` เดียวกันระหว่างเฟสเริ่มต้น
ก่อน listen ของ gateway ได้ แม้ว่าช่องทางนั้นจะกำหนดค่าแล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิวเริ่มต้นที่ต้องมีอยู่
ก่อนที่ gateway จะเริ่ม listen อย่างครบถ้วน ในทางปฏิบัติ หมายความว่า setup entry
ต้องลงทะเบียน capability ทุกอย่างที่ช่องทางเป็นเจ้าของและการเริ่มต้นต้องพึ่งพา เช่น:

- การลงทะเบียนช่องทางเอง
- เส้นทาง HTTP ใดๆ ที่ต้องพร้อมใช้งานก่อนที่ gateway จะเริ่ม listen
- gateway methods, tools หรือ services ใดๆ ที่ต้องมีอยู่ระหว่างช่วงเวลาเดียวกันนั้น

หาก entry แบบเต็มของคุณยังเป็นเจ้าของ capability การเริ่มต้นที่จำเป็นใดๆ อยู่ อย่าเปิดใช้
flag นี้ ให้ Plugin ใช้พฤติกรรมเริ่มต้นและให้ OpenClaw โหลด
entry แบบเต็มระหว่างการเริ่มต้น

ช่องทางที่บันเดิลมายังสามารถเผยแพร่ตัวช่วยพื้นผิวสัญญาแบบ setup-only ที่ core
สามารถ consult ก่อนโหลดรันไทม์ช่องทางแบบเต็มได้ พื้นผิวการโปรโมต setup ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนั้นเมื่อต้องโปรโมตการกำหนดค่าช่องทางแบบบัญชีเดียวรุ่นเก่า
ไปเป็น `channels.<id>.accounts.*` โดยไม่โหลดรายการ Plugin เต็มรูปแบบ
Matrix คือตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: โดยจะย้ายเฉพาะคีย์ auth/bootstrap ไปยัง
บัญชีที่ถูกโปรโมตแบบมีชื่อเมื่อมีบัญชีแบบมีชื่ออยู่แล้ว และสามารถรักษาคีย์บัญชีเริ่มต้น
ที่กำหนดค่าไว้แต่ไม่ใช่แบบ canonical แทนที่จะสร้าง `accounts.default` เสมอ

อะแดปเตอร์แพตช์การตั้งค่าเหล่านั้นช่วยให้การค้นพบพื้นผิวสัญญาที่บันเดิลอยู่ยังคงเป็นแบบ lazy
เวลา import จึงยังเบาอยู่; พื้นผิวการโปรโมตจะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะ
กลับเข้าไปสู่การเริ่มต้นช่องทางที่บันเดิลไว้ระหว่างการ import โมดูล

เมื่อพื้นผิวเริ่มต้นเหล่านั้นรวมเมธอด RPC ของ Gateway ไว้ ให้คงไว้บน prefix
เฉพาะ Plugin เนมสเปซผู้ดูแลของ Core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ resolve
เป็น `operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

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

### เมทาดาทาแคตตาล็อกช่องทาง

Plugin ช่องทางสามารถประกาศเมทาดาทาการตั้งค่า/การค้นพบผ่าน `openclaw.channel` และ
คำใบ้การติดตั้งผ่าน `openclaw.install` ได้ วิธีนี้ทำให้แคตตาล็อกของ Core ไม่มีข้อมูลผูกติดอยู่

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: ป้ายกำกับรองสำหรับพื้นผิวแคตตาล็อก/สถานะที่สมบูรณ์ขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการแคตตาล็อกนี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความบนพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายช่องทางว่าใช้ markdown ได้สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการช่องทางที่กำหนดค่าแล้วเมื่อตั้งเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบเมื่อตั้งเป็น `false`
- `exposure.docs`: ทำเครื่องหมายช่องทางว่าเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias รุ่นเก่าที่ยังยอมรับเพื่อความเข้ากันได้; แนะนำให้ใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้ช่องทางเข้าร่วม flow `allowFrom` ของ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียวอยู่
- `preferSessionLookupForAnnounceTarget`: ใช้การค้นหา session เป็นหลักเมื่อ resolve เป้าหมายประกาศ

OpenClaw ยังสามารถรวม **แคตตาล็อกช่องทางภายนอก** ได้ด้วย (เช่น export จาก registry ของ MPM)
วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วยจุลภาค/อัฒภาค/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น alias รุ่นเก่าสำหรับคีย์ `"entries"` ด้วย

รายการแคตตาล็อกช่องทางที่สร้างขึ้นและรายการแคตตาล็อกการติดตั้ง provider จะแสดง
ข้อเท็จจริงแหล่งติดตั้งที่ normalize แล้วถัดจากบล็อก `openclaw.install` ดิบ
ข้อเท็จจริงที่ normalize แล้วจะระบุว่า npm spec เป็นเวอร์ชัน exact หรือ selector แบบลอยตัว
มีเมทาดาทา integrity ที่คาดไว้หรือไม่ และมี path แหล่งที่มาในเครื่องพร้อมใช้งานด้วยหรือไม่
เมื่อทราบตัวตนของแคตตาล็อก/แพ็กเกจ ข้อเท็จจริงที่ normalize แล้วจะเตือนหากชื่อแพ็กเกจ npm
ที่ parse ได้เบี่ยงเบนจากตัวตนนั้น และยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยัง
แหล่งที่มาไม่พร้อมใช้งาน และเมื่อมีเมทาดาทา integrity ของ npm โดยไม่มีแหล่ง npm
ที่ถูกต้อง ผู้บริโภคควรมอง `installSource` เป็นฟิลด์เสริมแบบเติมเพิ่มได้ เพื่อให้
รายการที่สร้างด้วยมือและ shim แคตตาล็อกไม่จำเป็นต้องสังเคราะห์มันขึ้นมา
วิธีนี้ช่วยให้ onboarding และ diagnostics อธิบายสถานะ source-plane ได้โดยไม่ต้อง
import runtime ของ Plugin

รายการ npm ภายนอกอย่างเป็นทางการควรใช้ `npmSpec` แบบ exact พร้อม
`expectedIntegrity` เป็นหลัก ชื่อแพ็กเกจเปล่าและ dist-tag ยังคงใช้งานได้เพื่อ
ความเข้ากันได้ แต่จะแสดงคำเตือน source-plane เพื่อให้แคตตาล็อกขยับไปสู่
การติดตั้งแบบปักหมุดและตรวจ integrity โดยไม่ทำให้ Plugin ที่มีอยู่เสียหาย
เมื่อ onboarding ติดตั้งจาก path แคตตาล็อกในเครื่อง จะบันทึกรายการดัชนี Plugin
ที่จัดการแล้วด้วย `source: "path"` และ `sourcePath` แบบสัมพันธ์กับ workspace
เมื่อเป็นไปได้ path โหลดเชิงปฏิบัติการแบบ absolute จะยังอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งหลีกเลี่ยงการทำซ้ำ path workstation
ในเครื่องเข้าไปในการกำหนดค่าระยะยาว วิธีนี้ทำให้การติดตั้งสำหรับพัฒนาในเครื่อง
มองเห็นได้ต่อ diagnostics ของ source-plane โดยไม่เพิ่มพื้นผิวเปิดเผย raw filesystem-path
ชุดที่สอง ดัชนี Plugin `plugins/installs.json` ที่ persist ไว้คือแหล่งความจริงของ
แหล่งติดตั้งและสามารถ refresh ได้โดยไม่โหลดโมดูล runtime ของ Plugin
map `installRecords` ของมันคงทนแม้ manifest ของ Plugin จะหายไปหรือไม่ถูกต้อง;
array `plugins` ของมันเป็นมุมมอง manifest ที่สร้างใหม่ได้

## Plugin เครื่องมือบริบท

Plugin เครื่องมือบริบทเป็นเจ้าของการจัดการบริบท session สำหรับ ingest, assembly,
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือก engine ที่ใช้งานอยู่ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องแทนที่หรือขยาย pipeline บริบทเริ่มต้น
แทนที่จะเพียงเพิ่มการค้นหาหน่วยความจำหรือ hooks

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

factory `ctx` แสดงค่า `config`, `agentDir`, และ `workspaceDir` แบบไม่บังคับ
สำหรับการเริ่มต้นตอนสร้าง

หาก engine ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()`
ไว้และ delegate อย่างชัดเจน:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าเลี่ยง
ระบบ Plugin ด้วยการ reach-in แบบส่วนตัว ให้เพิ่ม capability ที่ขาดไป

ลำดับที่แนะนำ:

1. กำหนดสัญญา Core
   ตัดสินใจว่า Core ควรเป็นเจ้าของพฤติกรรมร่วมใด: policy, fallback, การ merge config,
   lifecycle, semantics ที่หันหน้าเข้าหาช่องทาง และรูปทรง runtime helper
2. เพิ่มพื้นผิวการลงทะเบียน/runtime ของ Plugin แบบ typed
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิว capability
   แบบ typed ที่เล็กที่สุดแต่มีประโยชน์
3. เชื่อม Core + ผู้บริโภคช่องทาง/ฟีเจอร์
   ช่องทางและ Plugin ฟีเจอร์ควรบริโภค capability ใหม่ผ่าน Core
   ไม่ใช่โดย import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementation ของ vendor
   จากนั้น Plugin vendor จึงลงทะเบียน backend ของตนกับ capability
5. เพิ่ม coverage ของสัญญา
   เพิ่ม tests เพื่อให้ ownership และรูปทรงการลงทะเบียนยังชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw ยังคงมีจุดยืนโดยไม่ถูก hardcode กับมุมมองของ provider รายเดียว
ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับ checklist ไฟล์ที่เป็นรูปธรรมและตัวอย่างที่ลงมือทำแล้ว

### Checklist ของ capability

เมื่อคุณเพิ่ม capability ใหม่ implementation มักควรแตะพื้นผิวเหล่านี้พร้อมกัน:

- ชนิดสัญญา Core ใน `src/<capability>/types.ts`
- runner/runtime helper ของ Core ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน API ของ Plugin ใน `src/plugins/types.ts`
- การเชื่อม registry ของ Plugin ใน `src/plugins/registry.ts`
- การเปิดเผย runtime ของ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/ช่องทาง
  ต้องบริโภคมัน
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- assertion เรื่อง ownership/contract ใน `src/plugins/contracts/registry.ts`
- เอกสาร operator/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป โดยปกตินั่นเป็นสัญญาณว่า capability
ยังไม่ได้ integrate อย่างสมบูรณ์

### Template ของ capability

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

นั่นทำให้กฎเรียบง่าย:

- Core เป็นเจ้าของสัญญา capability + orchestration
- Plugin vendor เป็นเจ้าของ implementation ของ vendor
- Plugin ฟีเจอร์/ช่องทางบริโภค runtime helpers
- contract tests ทำให้ ownership ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรง capability สาธารณะ
- [Subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
