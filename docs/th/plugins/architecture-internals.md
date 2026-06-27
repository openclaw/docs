---
read_when:
    - การใช้งานฮุกของรันไทม์ผู้ให้บริการ วงจรชีวิตของช่องทาง หรือแพ็กชุดแพ็กเกจ
    - การดีบักลำดับการโหลด Plugin หรือสถานะ registry
    - การเพิ่มความสามารถ Plugin ใหม่หรือ Plugin เอนจินบริบท
summary: 'ส่วนภายในของสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, registry, hook รันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: ภายในสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบ Plugin และสัญญาความเป็นเจ้าของ/การดำเนินการ
ดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็น
เอกสารอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด, registry, ฮุกรันไทม์,
เส้นทาง HTTP ของ Gateway, พาธการ import และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มต้น OpenClaw จะทำประมาณนี้:

1. ค้นพบราก Plugin ที่เป็นตัวเลือก
2. อ่าน manifest ของบันเดิลแบบเนทีฟหรือเข้ากันได้และ metadata ของแพ็กเกจ
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ทำให้ config ของ Plugin เป็นรูปแบบปกติ (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลดโมดูลเนทีฟที่เปิดใช้งาน: โมดูลบันเดิลที่ build แล้วใช้ตัวโหลดเนทีฟ;
   ซอร์ส TypeScript ในเครื่องของบุคคลที่สามใช้ fallback ฉุกเฉินของ Jiti
7. เรียกฮุกเนทีฟ `register(api)` และรวบรวมการลงทะเบียนเข้าไปใน registry ของ Plugin
8. เปิดเผย registry ให้กับคำสั่ง/พื้นผิวรันไทม์

<Note>
`activate` เป็น alias เดิมของ `register` — ตัวโหลดจะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกใช้ที่จุดเดียวกัน Plugin ที่บันเดิลทั้งหมดใช้ `register`; ให้เลือกใช้ `register` สำหรับ Plugin ใหม่
</Note>

ประตูความปลอดภัยเกิดขึ้น **ก่อน** การดำเนินการรันไทม์ ตัวเลือกจะถูกบล็อก
เมื่อ entry หลุดออกจากราก Plugin, พาธเป็นแบบ world-writable หรือความเป็นเจ้าของ
พาธดูน่าสงสัยสำหรับ Plugin ที่ไม่ได้บันเดิล

ตัวเลือกที่ถูกบล็อกยังคงผูกกับ id ของ Plugin เพื่อการวินิจฉัย หาก config
ยังอ้างถึง id นั้น validation จะรายงานว่า Plugin มีอยู่แต่ถูกบล็อก
และชี้กลับไปยังคำเตือนความปลอดภัยของพาธแทนที่จะถือว่า entry ของ config
ล้าสมัย

### พฤติกรรมที่ยึด manifest ก่อน

manifest คือแหล่งความจริงของ control plane OpenClaw ใช้มันเพื่อ:

- ระบุ Plugin
- ค้นพบ channel/skills/config schema ที่ประกาศไว้ หรือความสามารถของบันเดิล
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่มข้อมูลให้ labels/placeholders ของ Control UI
- แสดง metadata การติดตั้ง/catalog
- รักษา descriptor สำหรับการเปิดใช้งานและการตั้งค่าที่ประหยัดโดยไม่ต้องโหลดรันไทม์ของ Plugin

สำหรับ Plugin แบบเนทีฟ โมดูลรันไทม์คือส่วน data plane มันลงทะเบียน
พฤติกรรมจริง เช่น ฮุก เครื่องมือ คำสั่ง หรือ flow ของ provider

บล็อก `activation` และ `setup` แบบไม่บังคับของ manifest จะอยู่บน control plane
ต่อไป บล็อกเหล่านี้เป็น descriptor แบบ metadata-only สำหรับการวางแผนการเปิดใช้งานและการค้นพบการตั้งค่า;
ไม่ได้แทนที่การลงทะเบียนรันไทม์, `register(...)` หรือ `setupEntry`
ผู้บริโภคการเปิดใช้งานแบบ live ชุดแรกตอนนี้ใช้ hint ของคำสั่ง, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ก่อนการ materialize registry ที่กว้างขึ้น:

- การโหลด CLI จำกัดเฉพาะ Plugin ที่เป็นเจ้าของคำสั่งหลักที่ร้องขอ
- การตั้งค่า channel/การ resolve Plugin จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การตั้งค่า provider แบบ explicit/การ resolve รันไทม์ จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  provider id ที่ร้องขอ
- การวางแผนการเริ่มต้น Gateway ใช้ `activation.onStartup` สำหรับการ import ตอนเริ่มต้นแบบ explicit
  และการ opt-out ตอนเริ่มต้น; Plugin ที่ไม่มี metadata ตอนเริ่มต้นจะโหลดเฉพาะ
  ผ่าน trigger การเปิดใช้งานที่แคบกว่า

การ preload รันไทม์ ณ เวลาคำขอที่ขอ scope กว้าง `all` ยัง derive
ชุด id ของ Plugin ที่มีผลแบบ explicit จาก config, การวางแผนการเริ่มต้น, channel
ที่กำหนดค่าไว้, slot และกฎ auto-enable หากชุดที่ derive นั้นว่าง OpenClaw
จะโหลด registry รันไทม์ว่างแทนการขยายไปยัง Plugin ทุกตัวที่ค้นพบได้

ตัววางแผนการเปิดใช้งานเปิดเผยทั้ง API แบบ ids-only สำหรับ caller ที่มีอยู่และ
API แบบ plan สำหรับ diagnostics ใหม่ entry ของ plan รายงานเหตุผลที่เลือก Plugin
โดยแยก hint ของตัววางแผน `activation.*` แบบ explicit ออกจาก fallback ความเป็นเจ้าของของ manifest
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และฮุก การแยกเหตุผลนั้นคือขอบเขตความเข้ากันได้:
metadata ของ Plugin ที่มีอยู่ยังทำงานต่อไป ขณะที่โค้ดใหม่สามารถตรวจพบ hint กว้าง
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยน semantics การโหลดรันไทม์

การค้นพบการตั้งค่าตอนนี้เลือกใช้ id ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด Plugin ตัวเลือกก่อนที่จะ fallback ไปยัง
`setup-api` สำหรับ Plugin ที่ยังต้องใช้ฮุกรันไทม์ในช่วงตั้งค่า รายการตั้งค่า
provider ใช้ `providerAuthChoices` จาก manifest, ตัวเลือกการตั้งค่าที่ derive จาก descriptor
และ metadata ของ install-catalog โดยไม่โหลดรันไทม์ของ provider
`setup.requiresRuntime: false` แบบ explicit เป็นจุดตัดแบบ descriptor-only; การละ
`requiresRuntime` ไว้จะคง fallback `setup-api` เดิมเพื่อความเข้ากันได้ หากมี
Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ setup provider หรือ CLI
backend id ที่ normalize แล้วเหมือนกัน การค้นหาการตั้งค่าจะปฏิเสธเจ้าของที่กำกวมแทนการพึ่งพา
ลำดับการค้นพบ เมื่อรันไทม์การตั้งค่าถูกดำเนินการ diagnostics ของ registry จะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ provider หรือ CLI
backend ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก Plugin เดิม

### ขอบเขตแคชของ Plugin

OpenClaw ไม่แคชผลลัพธ์การค้นพบ Plugin หรือข้อมูล registry ของ manifest โดยตรง
ไว้หลังหน้าต่างเวลาตามนาฬิกา การติดตั้ง การแก้ไข manifest และการเปลี่ยน load-path
ต้องมองเห็นได้ในการอ่าน metadata แบบ explicit ครั้งถัดไปหรือการ rebuild snapshot ครั้งถัดไป
parser ไฟล์ manifest อาจเก็บแคช file-signature แบบมีขอบเขตที่ใช้ key เป็น
พาธ manifest ที่เปิดอยู่, inode, ขนาด และ timestamp; แคชนั้นมีไว้เพื่อหลีกเลี่ยง
การ parse bytes ที่ไม่เปลี่ยนแปลงซ้ำเท่านั้น และต้องไม่แคชคำตอบเรื่อง discovery, registry, owner หรือ
policy

fast path ของ metadata ที่ปลอดภัยคือความเป็นเจ้าของ object แบบ explicit ไม่ใช่แคชที่ซ่อนอยู่
hot path ตอนเริ่มต้น Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ derive แล้ว หรือ registry ของ manifest แบบ explicit ผ่าน call
chain การตรวจสอบ config, startup auto-enable, bootstrap ของ Plugin และการเลือก provider
สามารถใช้ object เหล่านั้นซ้ำได้ขณะที่มันแทน config และ inventory ของ Plugin ปัจจุบัน
การค้นหาการตั้งค่ายังคงสร้าง metadata ของ manifest ใหม่ตามต้องการ
เว้นแต่พาธการตั้งค่านั้นจะได้รับ registry ของ manifest แบบ explicit; ให้คงสิ่งนั้น
เป็น fallback ของ cold path แทนการเพิ่มแคช lookup ที่ซ่อนอยู่ เมื่อ input
เปลี่ยน ให้ rebuild และแทนที่ snapshot แทนการ mutate หรือเก็บ
สำเนาประวัติไว้
view เหนือ registry ของ Plugin ที่ active และ helper bootstrap channel ที่บันเดิล
ควรถูกคำนวณใหม่จาก registry/root ปัจจุบัน map อายุสั้นใช้ได้
ภายในหนึ่ง call เพื่อ dedupe งานหรือ guard reentry; มันต้องไม่กลายเป็นแคช
metadata ระดับ process

สำหรับการโหลด Plugin ชั้นแคชถาวรคือการโหลดรันไทม์ มันอาจ reuse
state ของตัวโหลดเมื่อโค้ดหรือ artifact ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และ registry รันไทม์ active ที่เข้ากันได้
- แคช jiti/module และแคชตัวโหลด public-surface ที่ใช้เพื่อหลีกเลี่ยงการ import
  พื้นผิวรันไทม์เดิมซ้ำ
- แคช filesystem สำหรับ artifact ของ Plugin ที่ติดตั้ง
- map ต่อ call อายุสั้นสำหรับการ normalize พาธหรือการ resolve รายการซ้ำ

แคชเหล่านั้นเป็นรายละเอียดการใช้งานของ data plane มันต้องไม่ตอบ
คำถามของ control plane เช่น "Plugin ใดเป็นเจ้าของ provider นี้?" เว้นแต่
caller ตั้งใจขอการโหลดรันไทม์

อย่าเพิ่มแคชถาวรหรือแคชตามนาฬิกาสำหรับ:

- ผลลัพธ์การค้นพบ
- registry ของ manifest โดยตรง
- registry ของ manifest ที่สร้างใหม่จากดัชนี Plugin ที่ติดตั้ง
- lookup เจ้าของ provider, การ suppress model, policy ของ provider หรือ metadata ของ public-artifact
- คำตอบอื่นใดที่ derive จาก manifest ซึ่ง manifest ที่เปลี่ยนไป, ดัชนีที่ติดตั้ง
  หรือ load path ควรมองเห็นได้ในการอ่าน metadata ครั้งถัดไป

caller ที่ rebuild metadata ของ manifest จากดัชนี Plugin ที่ติดตั้งซึ่ง persisted ไว้
จะสร้าง registry นั้นใหม่ตามต้องการ ดัชนีที่ติดตั้งคือ state ของ source plane
ที่คงทน; ไม่ใช่แคช metadata ใน process ที่ซ่อนอยู่

## โมเดล registry

Plugin ที่โหลดแล้วจะไม่ mutate global ของ core แบบสุ่มโดยตรง มันลงทะเบียนเข้าไปใน
registry กลางของ Plugin

registry ติดตาม:

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

จากนั้น feature ของ core จะอ่านจาก registry นั้นแทนที่จะคุยกับโมดูล Plugin
โดยตรง สิ่งนี้ทำให้การโหลดเป็นแบบทางเดียว:

- โมดูล Plugin -> การลงทะเบียน registry
- รันไทม์ core -> การใช้ registry

การแยกนี้สำคัญต่อความสามารถในการบำรุงรักษา หมายความว่าพื้นผิว core ส่วนใหญ่
ต้องการจุด integration เพียงจุดเดียว: "อ่าน registry" ไม่ใช่ "ทำ special-case ทุกโมดูล
Plugin"

## callback การผูก conversation

Plugin ที่ผูก conversation สามารถตอบสนองเมื่อ approval ถูก resolve

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
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

field ของ payload callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่อนุมัติ
- `request`: สรุปคำขอดั้งเดิม, hint การ detach, sender id และ
  metadata ของ conversation

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
conversation และจะทำงานหลังจาก core จัดการ approval เสร็จแล้ว

## ฮุกรันไทม์ของ provider

Plugin ของ provider มีสามชั้น:

- **metadata ของ manifest** สำหรับ lookup ก่อนรันไทม์ที่ประหยัด:
  `setup.providers[].envVars`, ความเข้ากันได้ที่เลิกใช้แล้ว `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **ฮุกช่วง config**: `catalog` (`discovery` เดิม) รวมถึง
  `applyConfigDefaults`
- **ฮุกรันไทม์**: ฮุกแบบไม่บังคับมากกว่า 40 รายการ ครอบคลุม auth, การ resolve model,
  การ wrap stream, ระดับ thinking, policy replay และ endpoint usage ดู
  รายการเต็มใต้ [ลำดับฮุกและการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ agent loop ทั่วไป, failover, การจัดการ transcript และ
policy ของเครื่องมือ ฮุกเหล่านี้คือพื้นผิว extension สำหรับพฤติกรรมเฉพาะ provider
โดยไม่ต้องมี inference transport แบบกำหนดเองทั้งหมด

ใช้ `setup.providers[].envVars` ของ manifest เมื่อ provider มี credential จาก env
ที่พาธ generic auth/status/model-picker ควรมองเห็นโดยไม่โหลดรันไทม์ของ Plugin
`providerAuthEnvVars` ที่เลิกใช้แล้วจะยังถูกอ่านโดย adapter ความเข้ากันได้
ระหว่างช่วง deprecation และ Plugin ที่ไม่ได้บันเดิลซึ่งใช้มันจะได้รับ diagnostic ของ manifest
ใช้ `providerAuthAliases` ของ manifest เมื่อ provider id หนึ่งควร reuse env vars,
auth profile, auth ที่ backed ด้วย config และตัวเลือก onboarding API-key ของ provider id อื่น
ใช้ `providerAuthChoices` ของ manifest เมื่อพื้นผิว CLI สำหรับ onboarding/auth-choice ควรรู้
choice id ของ provider, label ของกลุ่ม และ wiring auth แบบ one-flag ง่ายๆ โดยไม่ต้อง
โหลดรันไทม์ของ provider เก็บ `envVars` ของรันไทม์ provider ไว้สำหรับ hint ที่หันหา operator
เช่น label onboarding หรือ vars สำหรับตั้งค่า OAuth client-id/client-secret

ใช้ `channelEnvVars` ของ manifest เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง
generic shell-env fallback, การตรวจสอบ config/status หรือ prompt การตั้งค่าควรมองเห็น
โดยไม่โหลดรันไทม์ของ channel

### ลำดับฮุกและการใช้งาน

สำหรับ Plugin ของ model/provider OpenClaw จะเรียกฮุกตามลำดับคร่าวๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือตัดสินใจอย่างรวดเร็ว
field ของ provider เพื่อความเข้ากันได้เท่านั้นที่ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` ถูกตั้งใจไม่ให้
แสดงไว้ที่นี่

| #   | Hook                              | สิ่งที่ทำ                                                                                                   | ควรใช้เมื่อ                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการเข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้น URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปธรรม                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมดการตรวจสอบสิทธิ์, env, หรือความหมายของตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองใช้เส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ hook ของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้ alias ของ model-id แบบเดิมหรือแบบพรีวิวเป็นมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้าง alias ก่อนการแปลงเป็นโมเดลมาตรฐาน                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของตระกูลผู้ให้บริการเป็นมาตรฐานก่อนการประกอบโมเดลทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับ id ผู้ให้บริการแบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อนการแปลง runtime/ผู้ให้บริการ                                           | ผู้ให้บริการต้องการการล้างการกำหนดค่าที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมายังทำหน้าที่สำรองรายการการกำหนดค่า Google ที่รองรับ   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียนใหม่เพื่อความเข้ากันได้ของการใช้งานสตรีมมิงแบบ native กับผู้ให้บริการในการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ไขเมตาดาต้าการใช้งานสตรีมมิงแบบ native ที่ขับเคลื่อนโดย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | แปลงการตรวจสอบสิทธิ์แบบ env-marker สำหรับผู้ให้บริการในการกำหนดค่าก่อนโหลดการตรวจสอบสิทธิ์ runtime                                       | ผู้ให้บริการเปิดเผย hook การแปลง API-key แบบ env-marker ของตนเอง                                                                                |
| 8   | `resolveSyntheticAuth`            | แสดงการตรวจสอบสิทธิ์แบบ local/self-hosted หรือที่อิงการกำหนดค่าโดยไม่เก็บ plaintext                                   | ผู้ให้บริการสามารถทำงานด้วยเครื่องหมายข้อมูลรับรอง synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | วางทับโปรไฟล์การตรวจสอบสิทธิ์ภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลรับรองที่ CLI/app เป็นเจ้าของ | ผู้ให้บริการนำข้อมูลรับรองการตรวจสอบสิทธิ์ภายนอกกลับมาใช้โดยไม่เก็บ refresh token ที่คัดลอกมา; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของตัวแทนโปรไฟล์ synthetic ที่จัดเก็บไว้เมื่อมีการตรวจสอบสิทธิ์ที่อิง env/config                                      | ผู้ให้บริการเก็บโปรไฟล์ placeholder แบบ synthetic ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบ sync สำหรับ id โมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่อยู่ใน registry ภายใน                                       | ผู้ให้บริการยอมรับ id โมเดล upstream ใดก็ได้                                                                                                 |
| 12  | `prepareDynamicModel`             | อุ่นเครื่องแบบ async แล้ว `resolveDynamicModel` ทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องการเมตาดาต้าเครือข่ายก่อนแปลง id ที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | การเขียนใหม่ขั้นสุดท้ายก่อนที่ embedded runner จะใช้โมเดลที่แปลงแล้ว                                               | ผู้ให้บริการต้องการเขียน transport ใหม่ แต่ยังใช้ transport หลัก                                                                            |
| 14  | `normalizeToolSchemas`            | ทำให้ schema ของเครื่องมือเป็นมาตรฐานก่อนที่ embedded runner จะเห็น                                                    | ผู้ให้บริการต้องการการล้าง schema ของตระกูล transport                                                                                                |
| 15  | `inspectToolSchemas`              | แสดงการวินิจฉัย schema ที่ผู้ให้บริการเป็นเจ้าของหลังการทำให้เป็นมาตรฐาน                                                  | ผู้ให้บริการต้องการคำเตือน keyword โดยไม่ต้องสอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 16  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบ native เทียบกับแบบ tagged                                                              | ผู้ให้บริการต้องการ reasoning/final output แบบ tagged แทนฟิลด์ native                                                                         |
| 17  | `prepareExtraParams`              | ทำให้พารามิเตอร์คำขอเป็นมาตรฐานก่อน wrapper ตัวเลือกสตรีมทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์คำขอเริ่มต้นหรือการล้างพารามิเตอร์รายผู้ให้บริการ                                                                           |
| 18  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการโปรโตคอลสายสัญญาณแบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper ของสตรีมหลังจากใช้ wrapper ทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการ wrapper สำหรับความเข้ากันได้ของ header/body/model ของคำขอโดยไม่มี transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบ header หรือเมตาดาต้า transport แบบ native ต่อ turn                                                           | ผู้ให้บริการต้องการให้ transport ทั่วไปส่งตัวตน turn แบบ native ของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบ header WebSocket แบบ native หรือนโยบาย cool-down ของเซสชัน                                                    | ผู้ให้บริการต้องการให้ transport WS ทั่วไปปรับ header ของเซสชันหรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบโปรไฟล์การตรวจสอบสิทธิ์: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการเก็บเมตาดาต้าการตรวจสอบสิทธิ์เพิ่มเติมและต้องการรูปแบบ token runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | การแทนที่ OAuth refresh สำหรับ endpoint refresh แบบกำหนดเองหรือนโยบายเมื่อ refresh ล้มเหลว                                  | ผู้ให้บริการไม่เข้ากับตัว refresh ที่ใช้ร่วมกันของ OpenClaw                                                                                          |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมแซมที่ต่อท้ายเมื่อ OAuth refresh ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อมแซมการตรวจสอบสิทธิ์ที่ผู้ให้บริการเป็นเจ้าของหลัง refresh ล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | matcher สำหรับ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic ทั่วไปจะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาด API/transport ดิบไปยัง rate-limit/overload/ฯลฯ                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้องการการควบคุม cache TTL เฉพาะ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | การแทนที่ข้อความกู้คืนเมื่อขาดการตรวจสอบสิทธิ์แบบทั่วไป                                                      | ผู้ให้บริการต้องการคำแนะนำการกู้คืนเมื่อขาดการตรวจสอบสิทธิ์เฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถว catalog แบบ synthetic/final ที่ต่อท้ายหลัง discovery                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบ synthetic ใน `models list` และ picker                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, ป้ายกำกับแสดงผล, และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับขั้น thinking แบบกำหนดเองหรือป้ายกำกับแบบไบนารีสำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | hook ความเข้ากันได้ของ toggle reasoning เปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเฉพาะ thinking แบบไบนารีเปิด/ปิด                                                                                                  |
| 33  | `supportsXHighThinking`           | hook ความเข้ากันได้สำหรับการรองรับ reasoning `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะกับบางโมเดล                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | hook ความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 35  | `isModernModelRef`                | matcher โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลรับรองที่กำหนดค่าไว้เป็น token/key ของ runtime จริงก่อน inference                       | ผู้ให้บริการต้องการการแลกเปลี่ยน token หรือข้อมูลรับรองคำขออายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แปลงข้อมูลรับรอง usage/billing สำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยก token usage/quota แบบกำหนดเองหรือข้อมูลรับรอง usage ที่แตกต่าง                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและทำให้สแนปช็อตการใช้งาน/โควตาเฉพาะ provider เป็นรูปแบบปกติหลังจาก auth ได้รับการแก้ไขแล้ว                             | Provider ต้องมี endpoint การใช้งานเฉพาะ provider หรือ parser ของ payload                                                                           |
| 39  | `createEmbeddingProvider`         | สร้าง adapter สำหรับ embedding ที่ provider เป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำเป็นหน้าที่ของ provider plugin                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบาย replay ที่ควบคุมการจัดการ transcript สำหรับ provider                                        | Provider ต้องมีนโยบาย transcript แบบกำหนดเอง (เช่น การตัด thinking-block ออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติ replay ใหม่หลังจากล้าง transcript แบบทั่วไป                                                        | Provider ต้องมีการเขียน replay ใหม่เฉพาะ provider นอกเหนือจาก helper สำหรับ Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบหรือปรับรูปแบบ replay-turn ขั้นสุดท้ายก่อน embedded runner                                           | การขนส่งของ provider ต้องมีการตรวจสอบ turn ที่เข้มงวดยิ่งขึ้นหลังจากการทำความสะอาดแบบทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ side effect หลังการเลือกที่ provider เป็นเจ้าของ                                                                 | Provider ต้องมี telemetry หรือสถานะที่ provider เป็นเจ้าของเมื่อ model กลายเป็น active                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงไล่ต่อไปยัง Plugins ผู้ให้บริการอื่นที่รองรับ hook
จนกว่าจะมีตัวใดเปลี่ยน model id หรือ transport/config จริง ๆ วิธีนี้ทำให้
shim ผู้ให้บริการสำหรับ alias/compat ยังทำงานได้ โดยไม่กำหนดให้ caller ต้องรู้ว่า
Plugin ที่ bundled ตัวใดเป็นเจ้าของการเขียนใหม่นั้น หากไม่มี hook ของผู้ให้บริการใดเขียนใหม่
entry คอนฟิกตระกูล Google ที่รองรับ ตัวทำ normalization คอนฟิก Google ที่ bundled
จะยังคงใช้การล้างข้อมูล compatibility นั้นอยู่

หากผู้ให้บริการต้องใช้ wire protocol แบบกำหนดเองทั้งหมดหรือ request executor แบบกำหนดเอง
นั่นเป็น extension อีกประเภทหนึ่ง hooks เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังทำงานบน inference loop ปกติของ OpenClaw

`resolveUsageAuth` ตัดสินว่า OpenClaw ควรเรียก `fetchUsageSnapshot` หรือ
fallback ไปใช้การ resolve credential แบบทั่วไปสำหรับ surface ด้าน usage/status ให้คืน
`{ token, accountId? }` เมื่อผู้ให้บริการมี usage credential ให้คืน
`{ handled: true }` เมื่อ usage auth ที่ผู้ให้บริการเป็นเจ้าของจัดการ request แล้วและ
ต้องระงับ fallback แบบ API-key/OAuth ทั่วไป และให้คืน `null` หรือ `undefined`
เมื่อผู้ให้บริการไม่ได้จัดการ usage auth

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

### ตัวอย่างในตัว

Plugins ผู้ให้บริการที่ bundled จะรวม hooks ข้างต้นเพื่อให้เข้ากับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของผู้ขายแต่ละราย ชุด hook ที่เป็นแหล่งอ้างอิงหลักอยู่กับ
แต่ละ Plugin ภายใต้ `extensions/`; หน้านี้แสดงรูปทรงมากกว่าจะ mirror รายการนั้น

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดง
    model ids ต้นทางก่อน catalog แบบ static ของ OpenClaw ได้
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของ token exchange และการผสานรวม `/usage`
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    families แบบตั้งชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ทำให้ผู้ให้บริการ opt in
    เข้าสู่นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะ implement การล้างข้อมูลใหม่เอง
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเฉพาะ `catalog` และใช้ inference loop ร่วม
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam `api.ts` / `contract-api.ts` แบบ public ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วย runtime

Plugins สามารถเข้าถึงตัวช่วย core ที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` คืน payload เอาต์พุต TTS ของ core ตามปกติสำหรับ surface แบบ file/voice-note
- ใช้คอนฟิก core `messages.tts` และการเลือกผู้ให้บริการ
- คืน PCM audio buffer + sample rate Plugins ต้อง resample/encode สำหรับผู้ให้บริการเอง
- `listVoices` เป็น optional ต่อผู้ให้บริการ ใช้สำหรับ voice picker หรือ setup flow ที่ผู้ขายเป็นเจ้าของ
- รายการเสียงอาจมี metadata ที่สมบูรณ์ขึ้น เช่น locale, gender และ personality tags สำหรับ picker ที่รับรู้ผู้ให้บริการ
- OpenAI และ ElevenLabs รองรับ telephony ในปัจจุบัน Microsoft ไม่รองรับ

Plugins ยังสามารถลงทะเบียนผู้ให้บริการ speech ผ่าน `api.registerSpeechProvider(...)` ได้ด้วย

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
- input เดิมของ Microsoft `edge` จะถูก normalize เป็น provider id `microsoft`
- โมเดล ownership ที่แนะนำคือแบบยึดบริษัทเป็นศูนย์กลาง: Plugin ผู้ขายหนึ่งตัวสามารถเป็นเจ้าของ
  ผู้ให้บริการ text, speech, image และ media ในอนาคตได้ เมื่อ OpenClaw เพิ่ม
  capability contracts เหล่านั้น

สำหรับการทำความเข้าใจ image/audio/video Plugins จะลงทะเบียน
ผู้ให้บริการ media-understanding แบบ typed หนึ่งตัว แทน key/value bag ทั่วไป:

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

- เก็บ orchestration, fallback, config และ channel wiring ไว้ใน core
- เก็บพฤติกรรมของผู้ขายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบ additive ควรยังเป็น typed: methods แบบ optional ใหม่, result fields แบบ optional ใหม่,
  capabilities แบบ optional ใหม่
- การสร้างวิดีโอทำตามรูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - Plugins ผู้ขายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugins feature/channel ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helpers ด้าน media-understanding Plugins สามารถเรียก:

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

สำหรับ audio transcription Plugins สามารถใช้ได้ทั้ง runtime ด้าน media-understanding
หรือ alias STT แบบเก่า:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` เป็น shared surface ที่แนะนำสำหรับ
  การทำความเข้าใจ image/audio/video
- `extractStructuredWithModel(...)` เป็น seam ฝั่ง Plugin สำหรับ extraction แบบ image-first
  ที่ผู้ให้บริการเป็นเจ้าของและมีขอบเขตจำกัด ให้ใส่ image input อย่างน้อยหนึ่งรายการ;
  text inputs เป็นบริบทเสริม
  Plugins ผลิตภัณฑ์เป็นเจ้าของ routes และ schemas ของตนเอง ขณะที่ OpenClaw เป็นเจ้าของ
  ขอบเขต provider/runtime
- ใช้คอนฟิก audio ด้าน media-understanding ของ core (`tools.media.audio`) และลำดับ provider fallback
- คืน `{ text: undefined }` เมื่อไม่มีเอาต์พุต transcription ที่ถูกสร้างขึ้น (เช่น input ถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่ในฐานะ compatibility alias

Plugins ยังสามารถเปิดใช้ background subagent runs ผ่าน `api.runtime.subagent` ได้ด้วย:

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

- `provider` และ `model` เป็น overrides ต่อ run แบบ optional ไม่ใช่การเปลี่ยน session แบบ persistent
- OpenClaw จะ honor fields override เหล่านั้นเฉพาะสำหรับ callers ที่ trusted เท่านั้น
- สำหรับ fallback runs ที่ Plugin เป็นเจ้าของ operators ต้อง opt in ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugins ที่ trusted ให้ใช้เป้าหมาย `provider/model` แบบ canonical ที่ระบุเท่านั้น หรือ `"*"` เพื่ออนุญาตเป้าหมายใด ๆ อย่างชัดเจน
- subagent runs ของ Plugin ที่ untrusted ยังคงทำงาน แต่ request override จะถูกปฏิเสธแทนที่จะ fallback อย่างเงียบ ๆ
- sessions subagent ที่ Plugin สร้างจะถูก tag ด้วย plugin id ที่สร้างขึ้น Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะ sessions ที่เป็นเจ้าของเหล่านั้น; การลบ session ตามอำเภอใจยังคงต้องใช้ Gateway request ที่มี scope แบบ admin

สำหรับ web search Plugins สามารถใช้ shared runtime helper แทน
การเข้าไปแตะ agent tool wiring:

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

Plugins ยังสามารถลงทะเบียนผู้ให้บริการ web-search ผ่าน
`api.registerWebSearchProvider(...)` ได้ด้วย

หมายเหตุ:

- เก็บการเลือกผู้ให้บริการ, credential resolution และ shared request semantics ไว้ใน core
- ใช้ผู้ให้บริการ web-search สำหรับ search transports เฉพาะผู้ขาย
- `api.runtime.webSearch.*` เป็น shared surface ที่แนะนำสำหรับ Plugins feature/channel ที่ต้องการพฤติกรรม search โดยไม่ต้องพึ่งพา agent tool wrapper

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

- `generate(...)`: สร้าง image โดยใช้ chain ของผู้ให้บริการ image-generation ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่พร้อมใช้งานและ capabilities ของพวกเขา

## Gateway HTTP routes

Plugins สามารถเปิดเผย HTTP endpoints ด้วย `api.registerHttpRoute(...)`

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

ฟิลด์ route:

- `path`: พาธ route ภายใต้ gateway HTTP server
- `auth`: จำเป็นต้องมี ใช้ `"gateway"` เพื่อกำหนดให้ต้องใช้การยืนยันตัวตนของ gateway ตามปกติ หรือ `"plugin"` สำหรับการยืนยันตัวตน/การตรวจสอบ webhook ที่ Plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตนเองได้
- `handler`: คืนค่า `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกลบออกแล้วและจะทำให้เกิดข้อผิดพลาดในการโหลด Plugin ใช้ `api.registerHttpRoute(...)` แทน
- route ของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบตรงกันทุกประการจะถูกปฏิเสธ เว้นแต่จะใช้ `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่ route ของอีก Plugin ได้
- route ที่ทับซ้อนกันแต่มีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้ใช้สาย fallthrough ของ `exact`/`prefix` เฉพาะในระดับ auth เดียวกันเท่านั้น
- route ที่ใช้ `auth: "plugin"` จะ **ไม่ได้** รับ operator runtime scope โดยอัตโนมัติ route เหล่านี้มีไว้สำหรับ webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการเอง ไม่ใช่การเรียก Gateway helper ที่มีสิทธิพิเศษ
- route ที่ใช้ `auth: "gateway"` ทำงานภายใน runtime scope ของคำขอ Gateway แต่ scope นั้นตั้งใจให้มีขอบเขตแบบระมัดระวัง:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) จะตรึง runtime scope ของ route Plugin ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP ที่มี trusted identity-bearing (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะยอมรับ `x-openclaw-scopes` เฉพาะเมื่อมี header นั้นอย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอ route Plugin แบบ identity-bearing เหล่านั้น runtime scope จะ fallback ไปที่ `operator.write`
- กฎปฏิบัติ: อย่าสันนิษฐานว่า route Plugin ที่ใช้ gateway-auth เป็นพื้นผิว admin โดยนัย หาก route ของคุณต้องใช้พฤติกรรมที่จำกัดเฉพาะ admin ให้กำหนดให้ต้องใช้โหมด auth แบบ identity-bearing และจัดทำเอกสารสัญญา header `x-openclaw-scopes` อย่างชัดเจน

## พาธ import ของ Plugin SDK

ใช้ SDK subpath แบบแคบแทน barrel ราก `openclaw/plugin-sdk` แบบรวมศูนย์
เมื่อเขียน Plugin ใหม่ subpath หลัก:

| Subpath                             | วัตถุประสงค์                                      |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin               |
| `openclaw/plugin-sdk/channel-core`  | helper สำหรับ entry/build ของ channel              |
| `openclaw/plugin-sdk/core`          | helper ที่ใช้ร่วมกันทั่วไปและ umbrella contract    |
| `openclaw/plugin-sdk/config-schema` | Zod schema ของ `openclaw.json` ราก (`OpenClawSchema`) |

Plugin ช่องทางเลือกจากกลุ่ม seam แบบแคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
บน contract `approvalCapability` เดียว แทนการผสมข้าม field ของ Plugin
ที่ไม่เกี่ยวข้อง ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

helper ของ runtime และ config อยู่ใต้ subpath `*-runtime` ที่เน้นเฉพาะด้านตรงกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ควรใช้ `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation`
แทน barrel compatibility กว้างอย่าง `config-runtime`

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
facade helper ขนาดเล็กของ channel, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น compatibility shim ที่เลิกแนะนำแล้วสำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควร import primitive ทั่วไปที่แคบกว่าแทน
</Info>

entry point ภายใน repo (ต่อรากแพ็กเกจ Plugin ที่ bundled แต่ละตัว):

- `index.js` — entry ของ bundled Plugin
- `api.js` — barrel ของ helper/type
- `runtime-api.js` — barrel สำหรับ runtime เท่านั้น
- `setup-entry.js` — entry ของ setup Plugin

Plugin ภายนอกควร import เฉพาะ subpath `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของแพ็กเกจ Plugin อื่นจาก core หรือจาก Plugin อื่น
entry point ที่โหลดผ่าน facade จะเลือก snapshot ของ runtime config ที่ใช้งานอยู่ก่อนเมื่อมี
จากนั้นจึง fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์

subpath เฉพาะ capability เช่น `image-generation`, `media-understanding`,
และ `speech` มีอยู่เพราะ bundled Plugin ใช้งานอยู่ในปัจจุบัน สิ่งเหล่านี้ไม่ได้
กลายเป็นสัญญาภายนอกระยะยาวที่ถูก freeze โดยอัตโนมัติ ให้ตรวจสอบหน้าอ้างอิง SDK
ที่เกี่ยวข้องเมื่อพึ่งพา subpath เหล่านี้

## schema ของ message tool

Plugin ควรเป็นเจ้าของการสนับสนุน schema `describeMessageTool(...)`
เฉพาะ channel สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reaction, read และ poll
การนำเสนอการส่งที่ใช้ร่วมกันควรใช้ contract `MessagePresentation` ทั่วไป
แทน field ปุ่ม, component, block หรือ card แบบ provider-native
ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับ contract,
กฎ fallback, การแมป provider และ checklist สำหรับผู้เขียน Plugin

Plugin ที่ส่งข้อความได้ประกาศสิ่งที่สามารถ render ได้ผ่าน message capability:

- `presentation` สำหรับ block การนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอ pinned-delivery

Core ตัดสินใจว่าจะ render การนำเสนอแบบ native หรือ degrade เป็นข้อความ
อย่าเปิดเผยช่องทาง escape hatch ของ UI แบบ provider-native จาก message tool ทั่วไป
helper SDK ที่เลิกแนะนำแล้วสำหรับ schema native แบบ legacy ยังคง export สำหรับ
Plugin third-party ที่มีอยู่ แต่ Plugin ใหม่ไม่ควรใช้

## การ resolve เป้าหมายของ channel

Plugin ช่องทางควรเป็นเจ้าของความหมายของเป้าหมายที่เฉพาะกับ channel ให้ host
outbound ที่ใช้ร่วมกันคงความทั่วไปไว้ และใช้พื้นผิว messaging adapter สำหรับกฎ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินใจว่าเป้าหมายที่ normalize แล้ว
  ควรถูกปฏิบัติเป็น `direct`, `group` หรือ `channel` ก่อน lookup directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า input
  ควรข้ามไปยังการ resolve แบบคล้าย id โดยตรงแทนการค้นหา directory หรือไม่
- `messaging.targetResolver.reservedLiterals` แสดงรายการคำเดี่ยวที่เป็น
  reference ของ channel/session สำหรับ provider นั้น การ resolve จะรักษา
  entry directory ที่กำหนดค่าไว้ก่อนปฏิเสธ reserved literal จากนั้นจึง fail closed เมื่อ
  directory miss
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ Plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ provider เป็นเจ้าของหลัง normalization หรือหลัง
  directory miss
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง route ของ session
  เฉพาะ provider เมื่อ resolve เป้าหมายแล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจหมวดหมู่ที่ควรเกิดก่อน
  การค้นหา peer/group
- ใช้ `looksLikeId` สำหรับการตรวจสอบ "ปฏิบัติกับค่านี้เป็น target id แบบ explicit/native"
- ใช้ `resolveTarget` สำหรับ fallback การ normalize เฉพาะ provider ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- เก็บ id แบบ provider-native เช่น chat id, thread id, JID, handle และ room id
  ไว้ในค่า `target` หรือ param เฉพาะ provider ไม่ใช่ใน field SDK ทั่วไป

## directory ที่อิง config

Plugin ที่ derive entry ของ directory จาก config ควรเก็บ logic นั้นไว้ใน
Plugin และใช้ helper ที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/directory-runtime`

ใช้สิ่งนี้เมื่อ channel ต้องการ peer/group ที่อิง config เช่น:

- peer DM ที่ขับเคลื่อนด้วย allowlist
- map ของ channel/group ที่กำหนดค่าไว้
- fallback directory แบบ static ที่อยู่ในขอบเขตบัญชี

helper ที่ใช้ร่วมกันใน `directory-runtime` จัดการเฉพาะ operation ทั่วไป:

- การกรอง query
- การใช้ limit
- helper สำหรับ deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id ที่เฉพาะกับ channel ควรอยู่ใน
implementation ของ Plugin

## catalog ของ provider

Plugin provider สามารถกำหนด catalog ของ model สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืน shape เดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับ entry provider หนึ่งรายการ
- `{ providers }` สำหรับ entry provider หลายรายการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ model id เฉพาะ provider, ค่าเริ่มต้นของ base URL
หรือ metadata ของ model ที่ถูกกั้นด้วย auth

`catalog.order` ควบคุมว่า catalog ของ Plugin จะ merge เมื่อใดเมื่อเทียบกับ
provider implicit ในตัวของ OpenClaw:

- `simple`: provider แบบ API-key ล้วนหรือขับเคลื่อนด้วย env
- `profile`: provider ที่ปรากฏเมื่อมี auth profile
- `paired`: provider ที่ synthesize entry provider ที่เกี่ยวข้องหลายรายการ
- `late`: pass สุดท้าย หลัง provider implicit อื่น

provider ที่มาทีหลังจะชนะเมื่อ key ชนกัน ดังนั้น Plugin จึงสามารถ override
entry provider ในตัวที่มี provider id เดียวกันโดยตั้งใจได้

Plugin ยังสามารถ publish แถว model แบบ read-only ผ่าน
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` ได้ นี่คือเส้นทางข้างหน้าสำหรับพื้นผิว list/help/picker และรองรับแถว
`text`, `image_generation`, `video_generation` และ `music_generation`
Plugin provider ยังคงเป็นเจ้าของการเรียก live endpoint, token exchange และการแมป
response ของ vendor; core เป็นเจ้าของ shape แถวทั่วไป, label ของ source และการจัดรูปแบบ
help ของ media tool การลงทะเบียน provider สำหรับ media-generation จะ synthesize แถว
catalog แบบ static โดยอัตโนมัติจาก `defaultModel`, `models` และ `capabilities`

Compatibility:

- `discovery` ยังคงทำงานเป็น alias แบบ legacy แต่จะปล่อยคำเตือน deprecation
- หากมีการลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`
- `augmentModelCatalog` เลิกแนะนำแล้ว; bundled provider ควร publish
  แถวเสริมผ่าน `registerModelCatalogProvider`

## การตรวจสอบ channel แบบ read-only

หาก Plugin ของคุณลงทะเบียน channel ควร implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือ path ของ runtime มันได้รับอนุญาตให้สันนิษฐานว่า credential
  ถูก materialize ครบถ้วนแล้ว และสามารถ fail fast เมื่อ secret ที่จำเป็นขาดหาย
- path ของคำสั่งแบบ read-only เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flow การซ่อมแซม
  doctor/config ไม่ควรต้อง materialize credential ของ runtime เพียงเพื่อ
  อธิบาย configuration

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะบัญชีเชิงอธิบาย
- รักษา `enabled` และ `configured`
- รวม field แหล่งที่มา/สถานะของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่า token ดิบเพียงเพื่อรายงาน availability แบบ read-only
  การคืน `tokenStatus: "available"` (และ field source ที่ตรงกัน) ก็เพียงพอสำหรับคำสั่งแบบ status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  unavailable ใน path ของคำสั่งปัจจุบัน

สิ่งนี้ทำให้คำสั่ง read-only รายงานว่า "กำหนดค่าแล้วแต่ unavailable ใน path ของคำสั่งนี้"
แทนที่จะ crash หรือรายงานบัญชีผิดว่าไม่ได้กำหนดค่า

## package pack

directory ของ Plugin อาจมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หาก pack ระบุ extension หลายรายการ plugin id
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import npm dependency ให้ติดตั้งไว้ใน directory นั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

guardrail ด้านความปลอดภัย: entry ทุกตัวใน `openclaw.extensions` ต้องคงอยู่ภายใน directory ของ Plugin
หลังการ resolve symlink entry ที่หลุดออกจาก directory ของแพ็กเกจจะถูกปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependencies ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบเฉพาะโปรเจกต์ (ไม่มี lifecycle scripts,
ไม่มี dev dependencies ใน runtime) โดยไม่สนใจการตั้งค่า npm install แบบ global ที่สืบทอดมา
ให้ dependency trees ของ Plugin เป็น "JS/TS ล้วน" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้
`postinstall` builds.

ไม่บังคับ: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลขนาดเบาสำหรับ setup เท่านั้นได้
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ Plugin ช่องทางที่ปิดใช้งานอยู่ หรือ
เมื่อ Plugin ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า ระบบจะโหลด `setupEntry`
แทน entry เต็มของ Plugin วิธีนี้ทำให้ startup และ setup เบาลง
เมื่อ entry หลักของ Plugin ของคุณยังเชื่อม tools, hooks หรือโค้ดอื่นที่ใช้เฉพาะ runtime
ด้วย

ไม่บังคับ: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถเลือกให้ Plugin ช่องทางใช้เส้นทาง `setupEntry` เดียวกันระหว่างเฟส startup ก่อน listen ของ Gateway
ได้ แม้ช่องทางจะถูกกำหนดค่าไว้แล้วก็ตาม

ใช้ตัวเลือกนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ที่ต้องมีอยู่
ก่อนที่ Gateway จะเริ่ม listen อย่างครบถ้วน ในทางปฏิบัติ หมายความว่า setup entry
ต้องลงทะเบียน capability ที่ช่องทางเป็นเจ้าของทุกอย่างที่ startup พึ่งพา เช่น:

- การลงทะเบียนช่องทางเอง
- HTTP routes ใดๆ ที่ต้องพร้อมใช้งานก่อน Gateway เริ่ม listen
- gateway methods, tools หรือ services ใดๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก entry เต็มของคุณยังเป็นเจ้าของ capability ที่จำเป็นสำหรับ startup อยู่ อย่าเปิดใช้
flag นี้ ให้ Plugin ใช้พฤติกรรมเริ่มต้นต่อไปและปล่อยให้ OpenClaw โหลด
entry เต็มระหว่าง startup

ช่องทางที่ bundled ยังสามารถเผยแพร่ helpers สำหรับพื้นผิวสัญญาแบบ setup-only ที่ core
สามารถ consult ได้ก่อนที่ runtime ช่องทางเต็มจะถูกโหลด พื้นผิว promotion สำหรับ setup ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนั้นเมื่อต้อง promote config ช่องทางแบบ single-account legacy
ไปเป็น `channels.<id>.accounts.*` โดยไม่โหลด entry เต็มของ Plugin
Matrix เป็นตัวอย่าง bundled ปัจจุบัน: มันย้ายเฉพาะ auth/bootstrap keys ไปยัง
บัญชีที่ถูก promote แบบมีชื่อเมื่อมี named accounts อยู่แล้ว และสามารถรักษา
default-account key ที่ถูกกำหนดค่าไว้แต่ไม่ใช่ canonical แทนที่จะสร้าง
`accounts.default` เสมอ

setup patch adapters เหล่านั้นทำให้การค้นพบพื้นผิวสัญญาของ bundled เป็นแบบ lazy
เวลา import ยังเบาอยู่; พื้นผิว promotion จะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะ
กลับเข้าสู่ startup ของช่องทาง bundled ตอน module import

เมื่อพื้นผิว startup เหล่านั้นรวม gateway RPC methods ให้คงไว้บน
prefix เฉพาะของ Plugin namespaces สำหรับ core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ resolve
เป็น `operator.admin` เสมอ แม้ Plugin จะขอ scope ที่แคบกว่าก็ตาม

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

### metadata ของ catalog ช่องทาง

Plugin ช่องทางสามารถประกาศ metadata สำหรับ setup/discovery ผ่าน `openclaw.channel` และ
install hints ผ่าน `openclaw.install` ได้ วิธีนี้ทำให้ข้อมูล catalog ของ core ว่างจากข้อมูลเฉพาะ

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

- `detailLabel`: label รองสำหรับพื้นผิว catalog/status ที่มีรายละเอียดมากขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์ docs
- `preferOver`: ids ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่ง catalog entry นี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความของพื้นผิว selection
- `markdownCapable`: ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบ outbound
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการช่องทางที่กำหนดค่าแล้วเมื่อตั้งเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือก setup/configure แบบ interactive เมื่อตั้งเป็น `false`
- `exposure.docs`: ทำเครื่องหมายว่าช่องทางเป็น internal/private สำหรับพื้นผิว navigation ของ docs
- `showConfigured` / `showInSetup`: aliases legacy ที่ยังยอมรับเพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้ช่องทางเข้าสู่ flow `allowFrom` แบบ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ bind บัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ใช้ session lookup เป็นหลักเมื่อ resolve announce targets

OpenClaw ยังสามารถ merge **catalog ช่องทางภายนอก** ได้ด้วย (เช่น export จาก MPM
registry) วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่ง:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์ขึ้นไป (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น aliases legacy สำหรับ key `"entries"` ด้วย

entries ของ catalog ช่องทางที่ generated และ entries ของ catalog สำหรับติดตั้ง provider เปิดเผย
ข้อเท็จจริง install-source ที่ถูก normalize ไว้ข้างบล็อก `openclaw.install` ดิบ
ข้อเท็จจริงที่ถูก normalize ระบุว่า npm spec เป็นเวอร์ชัน exact หรือ selector แบบ floating,
มี metadata integrity ที่คาดไว้หรือไม่ และมี source path แบบ local พร้อมใช้งานด้วยหรือไม่
เมื่อทราบตัวตนของ catalog/package ข้อเท็จจริงที่ถูก normalize จะเตือนหากชื่อ npm package
ที่ parse ได้เบี่ยงจากตัวตนนั้น
นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยัง source ที่
ไม่พร้อมใช้งาน และเมื่อมี metadata integrity ของ npm โดยไม่มี source ของ npm
ที่ถูกต้อง Consumers ควรถือว่า `installSource` เป็นฟิลด์ optional แบบ additive เพื่อให้
entries ที่สร้างด้วยมือและ catalog shims ไม่จำเป็นต้องสังเคราะห์มันขึ้นมา
สิ่งนี้ช่วยให้ onboarding และ diagnostics อธิบายสถานะ source-plane ได้โดยไม่ต้อง
import runtime ของ Plugin

entries npm ภายนอกอย่างเป็นทางการควรใช้ `npmSpec` แบบ exact พร้อม
`expectedIntegrity` เป็นหลัก ชื่อแพ็กเกจเปล่าและ dist-tags ยังใช้งานได้เพื่อ
ความเข้ากันได้ แต่จะแสดง warnings ด้าน source-plane เพื่อให้ catalog ขยับไปสู่
การติดตั้งแบบ pinned และตรวจ integrity โดยไม่ทำให้ Plugin ที่มีอยู่เสีย
เมื่อ onboarding ติดตั้งจาก path ของ catalog แบบ local ระบบจะบันทึก entry ใน plugin index
ของ Plugin ที่จัดการอยู่ด้วย `source: "path"` และ `sourcePath` ที่สัมพันธ์กับ workspace
เมื่อทำได้ path โหลดเชิงปฏิบัติการแบบ absolute จะยังอยู่ใน
`plugins.load.paths`; install record หลีกเลี่ยงการทำซ้ำ paths ของ workstation local
ลงใน config ระยะยาว วิธีนี้ทำให้การติดตั้งสำหรับ development แบบ local มองเห็นได้สำหรับ
diagnostics ของ source-plane โดยไม่เพิ่มพื้นผิวเปิดเผย raw filesystem-path อีกชุดหนึ่ง
แถว SQLite `installed_plugin_index` ที่ persist ไว้คือแหล่งข้อมูลจริงของ install
source และสามารถ refresh ได้โดยไม่โหลดโมดูล runtime ของ Plugin
map `installRecords` ของมันคงทนแม้ manifest ของ Plugin จะหายไปหรือ
ไม่ถูกต้อง; payload `plugins` ของมันคือมุมมอง manifest ที่ rebuild ได้

## Context engine plugins

Context engine plugins เป็นเจ้าของการประสาน session context สำหรับ ingest, assembly,
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือก engine ที่ active ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องแทนที่หรือขยาย context
pipeline เริ่มต้น แทนที่จะเพียงเพิ่ม memory search หรือ hooks

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

factory `ctx` เปิดเผยค่า optional `config`, `agentDir` และ `workspaceDir`
สำหรับการ initialize ตอน construction

`assemble()` อาจคืน `contextProjection` เมื่อ harness ที่ active มี
backend thread แบบ persistent ละไว้สำหรับ projection แบบ per-turn legacy คืน
`{ mode: "thread_bootstrap", epoch }` เมื่อ context ที่ assemble แล้วควรถูก
inject หนึ่งครั้งเข้า backend thread และนำกลับมาใช้ซ้ำจนกว่า epoch จะเปลี่ยน เปลี่ยน
epoch หลัง context เชิงความหมายของ engine เปลี่ยน เช่นหลังจาก
compaction pass ที่ engine เป็นเจ้าของ Hosts อาจรักษา tool-call metadata, รูปทรง input
และผลลัพธ์ tool ที่ redact แล้วไว้ใน projection แบบ thread-bootstrap เพื่อให้
backend threads ใหม่ยังคงความต่อเนื่องของ tool โดยไม่คัดลอก payload ดิบที่อาจมี secret

หาก engine ของคุณ **ไม่ได้** เป็นเจ้าของ algorithm ของ Compaction ให้คง `compact()`
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

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่า bypass
ระบบ Plugin ด้วยการ reach-in แบบ private ให้เพิ่ม capability ที่ขาดอยู่แทน

ลำดับที่แนะนำ:

1. กำหนด core contract
   ตัดสินใจว่า core ควรเป็นเจ้าของพฤติกรรมที่ใช้ร่วมกันอะไรบ้าง: policy, fallback, config merge,
   lifecycle, semantics ที่หันหน้าเข้าหาช่องทาง และรูปทรง runtime helper
2. เพิ่มพื้นผิว plugin registration/runtime แบบ typed
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิว capability แบบ typed
   ที่เล็กที่สุดแต่ใช้งานได้
3. wire core + consumers ของช่องทาง/ฟีเจอร์
   ช่องทางและ feature plugins ควร consume capability ใหม่ผ่าน core
   ไม่ใช่โดย import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementations ของ vendor
   จากนั้น vendor plugins ลงทะเบียน backends ของตนกับ capability
5. เพิ่ม coverage ของ contract
   เพิ่ม tests เพื่อให้ ownership และรูปทรง registration ยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีแนวทางของตัวเองโดยไม่ hardcode เข้ากับ worldview
ของ provider รายเดียว ดู [Capability Cookbook](/th/plugins/adding-capabilities)
สำหรับ checklist ไฟล์ที่เป็นรูปธรรมและตัวอย่างแบบทำให้ดู

### checklist ของ capability

เมื่อคุณเพิ่ม capability ใหม่ implementation โดยปกติควรแตะพื้นผิวเหล่านี้
ร่วมกัน:

- core contract types ใน `src/<capability>/types.ts`
- core runner/runtime helper ใน `src/<capability>/runtime.ts`
- พื้นผิว plugin API registration ใน `src/plugins/types.ts`
- wiring ของ plugin registry ใน `src/plugins/registry.ts`
- การเปิดเผย plugin runtime ใน `src/plugins/runtime/*` เมื่อ feature/channel
  plugins ต้อง consume มัน
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- assertions ด้าน ownership/contract ใน `src/plugins/contracts/registry.ts`
- operator/plugin docs ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป มักเป็นสัญญาณว่า capability นั้น
ยังไม่ได้ integrate อย่างสมบูรณ์

### template ของ capability

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

รูปแบบการทดสอบ contract:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

ซึ่งทำให้กฎเรียบง่าย:

- core เป็นเจ้าของ contract ความสามารถ + orchestration
- Plugin ผู้ให้บริการเป็นเจ้าของการใช้งานจริงของผู้ให้บริการ
- Plugin ฟีเจอร์/ช่องทางใช้ runtime helpers
- การทดสอบ contract ทำให้ความเป็นเจ้าของชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรงความสามารถสาธารณะ
- [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
