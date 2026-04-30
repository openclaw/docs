---
read_when:
    - การติดตั้งใช้งานฮุกขณะทำงานของผู้ให้บริการ วงจรชีวิตของช่องทาง หรือชุดแพ็กเกจ
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถใหม่ของ Plugin หรือ Plugin เอนจินบริบท
summary: 'รายละเอียดภายในของสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกขณะรันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: กลไกภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบ Plugin และสัญญาความเป็นเจ้าของ/การดำเนินการ โปรดดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็นเอกสารอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด, registry, runtime hooks, เส้นทาง HTTP ของ Gateway, import paths และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มทำงาน OpenClaw จะทำโดยคร่าว ๆ ดังนี้:

1. ค้นหา root ของ Plugin ที่เป็นตัวเลือก
2. อ่าน manifest ของ bundle แบบ native หรือ compatible และข้อมูลเมตาของ package
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ทำให้ config ของ Plugin เป็นรูปแบบมาตรฐาน (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลดโมดูล native ที่เปิดใช้งาน: โมดูล bundled ที่ build แล้วใช้ native loader;
   Plugin native ที่ยังไม่ได้ build ใช้ jiti
7. เรียก native `register(api)` hooks และรวบรวม registrations เข้าไปใน Plugin registry
8. เปิดเผย registry ให้กับคำสั่ง/พื้นผิว runtime

<Note>
`activate` เป็น alias แบบเดิมของ `register` — loader จะเลือกตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกใช้ที่จุดเดียวกัน Plugin ที่รวมมาทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ให้เลือกใช้ `register`
</Note>

ด่านความปลอดภัยจะเกิดขึ้น **ก่อน** การดำเนินการ runtime ตัวเลือกจะถูกบล็อก
เมื่อ entry หลุดออกจาก root ของ Plugin, path เป็น world-writable หรือ ownership ของ path
ดูน่าสงสัยสำหรับ Plugin ที่ไม่ได้รวมมา

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งความจริงของ control-plane OpenClaw ใช้ manifest เพื่อ:

- ระบุ Plugin
- ค้นหา channels/skills/config schema ที่ประกาศไว้ หรือความสามารถของ bundle
- ตรวจสอบ `plugins.entries.<id>.config`
- เติม labels/placeholders ของ Control UI
- แสดงข้อมูลเมตาของการติดตั้ง/catalog
- รักษา activation และ setup descriptors แบบประหยัดโดยไม่ต้องโหลด runtime ของ Plugin

สำหรับ Plugin native โมดูล runtime คือส่วน data-plane โมดูลนี้ลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` ที่เป็นทางเลือกใน manifest จะอยู่บน control plane
บล็อกเหล่านี้เป็น descriptors แบบ metadata-only สำหรับการวางแผน activation และการค้นหา setup;
บล็อกเหล่านี้ไม่ได้แทนที่ runtime registration, `register(...)` หรือ `setupEntry`
ผู้บริโภค live activation ชุดแรกตอนนี้ใช้คำใบ้ command, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ก่อนการ materialize registry ที่กว้างขึ้น:

- การโหลด CLI จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การ setup channel/การ resolve Plugin จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ setup provider/การ resolve runtime แบบ explicit จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  provider id ที่ร้องขอ
- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับ
  imports ตอน startup แบบ explicit และ opt-outs ตอน startup; Plugin ทุกตัวควรประกาศค่านี้เมื่อ OpenClaw
  กำลังย้ายออกจาก implicit startup imports ขณะที่ Plugin ที่ไม่มีข้อมูลเมตา
  ความสามารถแบบ static และไม่มี `activation.onStartup` ยังใช้
  deprecated implicit startup sidecar fallback เพื่อ compatibility

activation planner เปิดเผยทั้ง API แบบ ids-only สำหรับ callers ที่มีอยู่ และ
plan API สำหรับ diagnostics ใหม่ รายการในแผนรายงานเหตุผลที่เลือก Plugin
โดยแยกคำใบ้ planner แบบ explicit `activation.*` ออกจาก fallback ความเป็นเจ้าของของ manifest
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks การแยกเหตุผลดังกล่าวคือขอบเขต compatibility:
ข้อมูลเมตา Plugin ที่มีอยู่ยังทำงานต่อไป ขณะที่ code ใหม่สามารถตรวจจับคำใบ้แบบกว้าง
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยนความหมายของการโหลด runtime

ตอนนี้การค้นหา setup ให้ความสำคัญกับ ids ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด Plugin ตัวเลือกก่อนจะ fallback ไปยัง
`setup-api` สำหรับ Plugin ที่ยังต้องใช้ runtime hooks ระหว่าง setup รายการ
setup ของ provider ใช้ manifest `providerAuthChoices`, choices ของ setup ที่ derive จาก descriptor
และข้อมูลเมตาของ install-catalog โดยไม่โหลด runtime ของ provider
`setup.requiresRuntime: false` แบบ explicit เป็นจุดตัดแบบ descriptor-only; หากละ
`requiresRuntime` ไว้ จะคง legacy setup-api fallback เพื่อ compatibility หากมี
Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ provider หรือ CLI
backend id สำหรับ setup ที่ normalize แล้วเหมือนกัน setup lookup จะปฏิเสธ owner ที่กำกวมแทนการพึ่งพา
ลำดับการค้นหา เมื่อ setup runtime ทำงานจริง registry diagnostics จะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ providers หรือ CLI
backends ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก Plugin แบบเดิม

### ขอบเขต cache ของ Plugin

OpenClaw ไม่ cache ผลการค้นหา Plugin หรือข้อมูล direct manifest registry
ไว้หลังช่วงเวลา wall-clock การติดตั้ง การแก้ไข manifest และการเปลี่ยน load-path
ต้องมองเห็นได้ในการอ่านข้อมูลเมตาแบบ explicit ครั้งถัดไป หรือการ rebuild snapshot ครั้งถัดไป
parser ของไฟล์ manifest อาจเก็บ cache ของ file signature แบบมีขอบเขตที่ keyed ด้วย
path ของ manifest ที่เปิดอยู่, inode, size และ timestamps; cache นั้นมีไว้เพียง
หลีกเลี่ยงการ parse bytes ที่ไม่เปลี่ยนแปลงซ้ำ และต้องไม่ cache คำตอบด้าน discovery,
registry, owner หรือ policy

fast path ของข้อมูลเมตาที่ปลอดภัยคือ ownership ของ object แบบ explicit ไม่ใช่ cache ที่ซ่อนอยู่
hot paths ของ startup Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ derive แล้ว หรือ manifest registry แบบ explicit ผ่าน call
chain การตรวจสอบ config, startup auto-enable, bootstrap ของ Plugin และการเลือก provider
สามารถนำ object เหล่านั้นมาใช้ซ้ำได้ตราบเท่าที่ object เหล่านั้นแทน config และ
inventory ของ Plugin ปัจจุบัน setup lookup ยัง reconstruct ข้อมูลเมตา manifest ตามต้องการ
ยกเว้น setup path เฉพาะจะได้รับ manifest registry แบบ explicit; ให้คงสิ่งนั้น
เป็น cold-path fallback แทนการเพิ่ม lookup caches ที่ซ่อนอยู่ เมื่อ input
เปลี่ยน ให้ rebuild และแทนที่ snapshot แทนการ mutate หรือเก็บ
สำเนาประวัติไว้
views เหนือ active Plugin registry และ bundled channel bootstrap helpers
ควร recompute จาก registry/root ปัจจุบัน maps อายุสั้นใช้ได้
ภายในการเรียกหนึ่งครั้งเพื่อ dedupe งานหรือป้องกัน reentry; ต้องไม่กลายเป็น process
metadata caches

สำหรับการโหลด Plugin ชั้น cache แบบ persistent คือการโหลด runtime ชั้นนี้อาจนำ
state ของ loader มาใช้ซ้ำเมื่อ code หรือ artifacts ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และ active runtime registries ที่ compatible
- jiti/module caches และ public-surface loader caches ที่ใช้เพื่อหลีกเลี่ยงการ import
  runtime surface เดิมซ้ำหลายครั้ง
- runtime dependency mirrors และ filesystem caches สำหรับ artifacts ของ Plugin
  ที่ติดตั้ง
- maps อายุสั้นต่อการเรียกสำหรับ path normalization หรือ duplicate resolution

cache เหล่านั้นเป็นรายละเอียดการ implement ของ data-plane cache เหล่านั้นต้องไม่ตอบ
คำถามของ control-plane เช่น "Plugin ใดเป็นเจ้าของ provider นี้" เว้นแต่
caller จะตั้งใจร้องขอการโหลด runtime

อย่าเพิ่ม cache แบบ persistent หรือ wall-clock สำหรับ:

- ผลการค้นหา
- direct manifest registries
- manifest registries ที่ reconstruct จาก installed Plugin index
- provider owner lookup, model suppression, provider policy หรือข้อมูลเมตาของ public-artifact
- คำตอบอื่นใดที่ derive จาก manifest ซึ่ง manifest ที่เปลี่ยนไป, installed index
  หรือ load path ควรมองเห็นได้ในการอ่านข้อมูลเมตาครั้งถัดไป

callers ที่ rebuild ข้อมูลเมตา manifest จาก installed Plugin index ที่ persist ไว้
จะ reconstruct registry นั้นตามต้องการ installed index คือ state ของ source-plane
ที่ durable; ไม่ใช่ in-process metadata cache ที่ซ่อนอยู่

## โมเดล registry

Plugin ที่โหลดแล้วไม่ได้ mutate core globals แบบสุ่มโดยตรง Plugin จะ register เข้าไปใน
Plugin registry ส่วนกลาง

registry ติดตาม:

- records ของ Plugin (identity, source, origin, status, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- Gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands ที่ Plugin เป็นเจ้าของ

จากนั้นฟีเจอร์ของ core จะอ่านจาก registry นั้นแทนการคุยกับโมดูล Plugin
โดยตรง สิ่งนี้ทำให้การโหลดเป็นแบบทางเดียว:

- โมดูล Plugin -> registry registration
- core runtime -> registry consumption

การแยกนี้สำคัญต่อการบำรุงรักษา หมายความว่าพื้นผิว core ส่วนใหญ่ต้องการเพียง
จุด integration เดียว: "อ่าน registry" ไม่ใช่ "ทำ special-case ให้ทุกโมดูล
Plugin"

## callbacks สำหรับ conversation binding

Plugin ที่ bind conversation สามารถตอบสนองเมื่อ approval ถูก resolve แล้ว

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

ฟิลด์ payload ของ callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่อนุมัติ
- `request`: สรุปคำขอเดิม, detach hint, sender id และ
  ข้อมูลเมตาของ conversation

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
conversation และทำงานหลังจากการจัดการ approval ของ core เสร็จสิ้นแล้ว

## runtime hooks ของ provider

Plugin ของ provider มีสามชั้น:

- **ข้อมูลเมตา manifest** สำหรับ lookup ก่อน runtime แบบประหยัด:
  `setup.providers[].envVars`, compatibility `providerAuthEnvVars` ที่ deprecated,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **hooks ระหว่าง config**: `catalog` (legacy `discovery`) และ
  `applyConfigDefaults`
- **runtime hooks**: hooks ทางเลือกมากกว่า 40 รายการ ครอบคลุม auth, model resolution,
  stream wrapping, thinking levels, replay policy และ usage endpoints ดู
  รายการทั้งหมดใต้ [ลำดับ hook และการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ agent loop, failover, การจัดการ transcript และ
tool policy แบบ generic hooks เหล่านี้เป็น extension surface สำหรับพฤติกรรม
เฉพาะ provider โดยไม่ต้องมี custom inference transport ทั้งชุด

ใช้ manifest `setup.providers[].envVars` เมื่อ provider มี credentials ที่อิง env
ซึ่ง paths ของ generic auth/status/model-picker ควรเห็นโดยไม่โหลด runtime ของ Plugin
`providerAuthEnvVars` ที่ deprecated ยังถูกอ่านโดย compatibility adapter
ระหว่างช่วง deprecation และ Plugin ที่ไม่ได้รวมมาซึ่งใช้ค่านี้จะได้รับ
manifest diagnostic ใช้ manifest `providerAuthAliases` เมื่อ provider id หนึ่งควรนำ env vars,
auth profiles, auth ที่ backed by config และตัวเลือก API-key onboarding ของ provider id อื่นมาใช้ซ้ำ
ใช้ manifest `providerAuthChoices` เมื่อ onboarding/auth-choice CLI surfaces ควรรู้
choice id, group labels และการต่อ auth แบบ one-flag อย่างง่ายของ provider โดยไม่โหลด
runtime ของ provider ให้เก็บ runtime ของ provider
`envVars` ไว้สำหรับคำใบ้ที่หันหน้าไปหา operator เช่น onboarding labels หรือ vars สำหรับตั้งค่า OAuth
client-id/client-secret

ใช้ manifest `channelEnvVars` เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง
generic shell-env fallback, config/status checks หรือ setup prompts ควรเห็น
โดยไม่โหลด runtime ของ channel

### ลำดับ hook และการใช้งาน

สำหรับ Plugin ของ model/provider OpenClaw จะเรียก hooks ตามลำดับโดยคร่าว ๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือการตัดสินใจแบบเร็ว
ฟิลด์ provider แบบ compatibility-only ที่ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` จงใจไม่
ระบุไว้ที่นี่

| #   | ฮุก                              | สิ่งที่ทำ                                                                                                   | ควรใช้เมื่อ                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการลงใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นของการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปธรรม                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมดการยืนยันตัวตน, env, หรือความหมายของตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองใช้เส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ฮุกของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ปรับชื่อแฝง model-id แบบเก่าหรือพรีวิวให้เป็นมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างชื่อแฝงก่อนการแก้ไขโมเดลมาตรฐาน                                                                                 |
| 4   | `normalizeTransport`              | ปรับ `api` / `baseUrl` ของตระกูลผู้ให้บริการให้เป็นมาตรฐานก่อนการประกอบโมเดลทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้าง transport สำหรับรหัสผู้ให้บริการแบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ปรับ `models.providers.<id>` ให้เป็นมาตรฐานก่อนการแก้ไข runtime/ผู้ให้บริการ                                           | ผู้ให้บริการต้องการการล้างการกำหนดค่าที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมาด้วยยังช่วยรองรับรายการการกำหนดค่า Google ที่รองรับ   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียนใหม่เพื่อความเข้ากันได้ของการใช้งานสตรีมมิงแบบเนทีฟกับผู้ให้บริการการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ไขข้อมูลเมตาการใช้งานสตรีมมิงแบบเนทีฟที่ขับเคลื่อนด้วย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | แก้ไขการยืนยันตัวตนแบบ env-marker สำหรับผู้ให้บริการการกำหนดค่าก่อนโหลดการยืนยันตัวตน runtime                                       | ผู้ให้บริการมีการแก้ไขคีย์ API แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมีตัวแก้ไข env-marker ของ AWS ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดงการยืนยันตัวตนแบบ local/self-hosted หรือที่อิงการกำหนดค่าโดยไม่บันทึก plaintext                                   | ผู้ให้บริการสามารถทำงานด้วยตัวทำเครื่องหมายข้อมูลประจำตัวแบบ synthetic/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับโปรไฟล์การยืนยันตัวตนภายนอกที่ผู้ให้บริการเป็นเจ้าของ; `persistence` เริ่มต้นคือ `runtime-only` สำหรับข้อมูลประจำตัวที่ CLI/app เป็นเจ้าของ | ผู้ให้บริการนำข้อมูลประจำตัวการยืนยันตัวตนภายนอกกลับมาใช้โดยไม่บันทึก refresh token ที่คัดลอกมา; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของตัวยึดโปรไฟล์ synthetic ที่จัดเก็บไว้ให้อยู่หลังการยืนยันตัวตนที่อิง env/config                                      | ผู้ให้บริการจัดเก็บโปรไฟล์ตัวยึด synthetic ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบซิงค์สำหรับรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่มีใน registry ภายใน                                       | ผู้ให้บริการยอมรับรหัสโมเดล upstream แบบใดก็ได้                                                                                                 |
| 12  | `prepareDynamicModel`             | warm-up แบบอะซิงก์ แล้ว `resolveDynamicModel` จะทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องการข้อมูลเมตาจากเครือข่ายก่อนแก้ไขรหัสที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | การเขียนใหม่ขั้นสุดท้ายก่อนที่ runner แบบฝังจะใช้โมเดลที่แก้ไขแล้ว                                               | ผู้ให้บริการต้องการการเขียน transport ใหม่แต่ยังใช้ transport หลัก                                                                             |
| 14  | `contributeResolvedModelCompat`   | สนับสนุนแฟล็กความเข้ากันได้สำหรับโมเดลผู้ขายที่อยู่หลัง transport อื่นที่เข้ากันได้                                  | ผู้ให้บริการจดจำโมเดลของตนเองบน transport แบบ proxy โดยไม่เข้ายึดผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ปรับสคีมาของเครื่องมือให้เป็นมาตรฐานก่อนที่ runner แบบฝังจะเห็น                                                    | ผู้ให้บริการต้องการการล้างสคีมาของตระกูล transport                                                                                                |
| 16  | `inspectToolSchemas`              | แสดงการวินิจฉัยสคีมาที่ผู้ให้บริการเป็นเจ้าของหลังการปรับให้เป็นมาตรฐาน                                                  | ผู้ให้บริการต้องการคำเตือน keyword โดยไม่ต้องสอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือกสัญญาเอาต์พุตการใช้เหตุผลแบบเนทีฟกับแบบติดแท็ก                                                              | ผู้ให้บริการต้องการการใช้เหตุผล/เอาต์พุตสุดท้ายแบบติดแท็กแทนฟิลด์เนทีฟ                                                                         |
| 18  | `prepareExtraParams`              | การปรับ request-param ให้เป็นมาตรฐานก่อน wrapper ตัวเลือกสตรีมทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์คำขอเริ่มต้นหรือการล้างพารามิเตอร์ต่อผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการโปรโตคอล wire แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper ของสตรีมหลังจากใช้ wrapper ทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการ wrapper ความเข้ากันได้ของส่วนหัวคำขอ/บอดี/โมเดลโดยไม่มี transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบส่วนหัวหรือข้อมูลเมตา transport แบบเนทีฟต่อเทิร์น                                                           | ผู้ให้บริการต้องการให้ transport ทั่วไปส่งข้อมูลระบุเทิร์นแบบเนทีฟของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบส่วนหัว WebSocket แบบเนทีฟหรือนโยบาย cool-down ของเซสชัน                                                    | ผู้ให้บริการต้องการให้ transport WS ทั่วไปปรับส่วนหัวเซสชันหรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบโปรไฟล์การยืนยันตัวตน: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการจัดเก็บข้อมูลเมตาการยืนยันตัวตนเพิ่มเติมและต้องการรูปทรง token ของ runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | การ override การรีเฟรช OAuth สำหรับ endpoint รีเฟรชแบบกำหนดเองหรือนโยบายความล้มเหลวในการรีเฟรช                                  | ผู้ให้บริการไม่เข้ากับ refresher `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมแซมที่ต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อมแซมการยืนยันตัวตนที่ผู้ให้บริการเป็นเจ้าของหลังรีเฟรชล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic ทั่วไปจะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจำแนกเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาด API/transport ดิบเป็น rate-limit/overload/ฯลฯ                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้องการ gating TTL ของแคชเฉพาะ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | ข้อความแทนข้อความกู้คืนการยืนยันตัวตนที่ขาดหายแบบทั่วไป                                                      | ผู้ให้บริการต้องการคำแนะนำการกู้คืนการยืนยันตัวตนที่ขาดหายเฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อก synthetic/สุดท้ายที่ต่อท้ายหลังการค้นพบ                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบ synthetic ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, ป้ายกำกับการแสดงผล, และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับขั้น thinking แบบกำหนดเองหรือป้ายกำกับ binary สำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | ฮุกความเข้ากันได้ของ toggle การใช้เหตุผลแบบเปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเฉพาะ thinking แบบ binary เปิด/ปิด                                                                                                  |
| 33  | `supportsXHighThinking`           | ฮุกความเข้ากันได้ของการรองรับการใช้เหตุผล `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะกับโมเดลบางส่วน                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | ฮุกความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 35  | `isModernModelRef`                | ตัวจับคู่โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลประจำตัวที่กำหนดค่าไว้เป็น token/key ของ runtime จริงทันทีก่อน inference                       | ผู้ให้บริการต้องการการแลกเปลี่ยน token หรือข้อมูลประจำตัวคำขออายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แก้ไขข้อมูลรับรองการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลรับรองการใช้งานแบบอื่น                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและปรับสแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการให้เป็นมาตรฐาน หลังจากแก้ไขการตรวจสอบสิทธิ์แล้ว                             | ผู้ให้บริการต้องการเอนด์พอยต์การใช้งานเฉพาะผู้ให้บริการ หรือตัวแยกวิเคราะห์เพย์โหลด                                                                           |
| 39  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์การฝังที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรมการฝังหน่วยความจำเป็นของ Plugin ผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบายการเล่นซ้ำที่ควบคุมการจัดการทรานสคริปต์สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบายทรานสคริปต์แบบกำหนดเอง (ตัวอย่างเช่น การตัดบล็อกการคิดออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติการเล่นซ้ำใหม่หลังจากล้างทรานสคริปต์ทั่วไป                                                        | ผู้ให้บริการต้องการการเขียนการเล่นซ้ำใหม่เฉพาะผู้ให้บริการ นอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องหรือปรับรูปแบบเทิร์นการเล่นซ้ำขั้นสุดท้ายก่อนรันเนอร์แบบฝัง                                           | การขนส่งของผู้ให้บริการต้องการการตรวจสอบความถูกต้องของเทิร์นที่เข้มงวดยิ่งขึ้นหลังจากการทำความสะอาดทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการเทเลเมทรีหรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลเริ่มใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงไล่ต่อไปยัง Plugin ผู้ให้บริการอื่นที่รองรับฮุก
จนกว่าจะมีตัวใดเปลี่ยนรหัสโมเดลหรือทรานสปอร์ต/คอนฟิกจริง วิธีนี้ทำให้
ชิมผู้ให้บริการสำหรับ alias/compat ยังทำงานได้โดยไม่ต้องให้ผู้เรียกรู้ว่า
Plugin ที่รวมมาด้วยตัวใดเป็นเจ้าของการเขียนใหม่นั้น หากไม่มีฮุกของผู้ให้บริการใดเขียนใหม่ให้กับ
รายการคอนฟิกตระกูล Google ที่รองรับ ตัวปรับคอนฟิก Google ที่รวมมาด้วยจะยังคงใช้
การล้างความเข้ากันได้นั้นอยู่

หากผู้ให้บริการต้องการโปรโตคอลสายข้อมูลที่กำหนดเองทั้งหมดหรือ executor คำขอที่กำหนดเอง
นั่นเป็นส่วนขยายอีกประเภทหนึ่ง ฮุกเหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังคงทำงานบนลูป inference ปกติของ OpenClaw

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

Plugin ผู้ให้บริการที่รวมมาด้วยจะรวมฮุกด้านบนเพื่อให้เข้ากับแคตตาล็อก,
การยืนยันตัวตน, การคิด, การเล่นซ้ำ และความต้องการด้านการใช้งานของผู้ขายแต่ละราย
ชุดฮุกที่ถือเป็นแหล่งข้อมูลหลักจะอยู่กับแต่ละ Plugin ภายใต้ `extensions/`; หน้านี้แสดงรูปแบบ
แทนที่จะสะท้อนรายการทั้งหมด

<AccordionGroup>
  <Accordion title="ผู้ให้บริการแคตตาล็อกแบบส่งผ่าน">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดงรหัสโมเดลต้นทาง
    ก่อนแคตตาล็อกแบบคงที่ของ OpenClaw
  </Accordion>
  <Accordion title="ผู้ให้บริการปลายทาง OAuth และการใช้งาน">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลกเปลี่ยนโทเคนและการผสานรวม `/usage`
  </Accordion>
  <Accordion title="ตระกูลการเล่นซ้ำและการล้างทรานสคริปต์">
    ตระกูลที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการเลือกใช้
    นโยบายทรานสคริปต์ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะนำการล้างข้อมูลไปใช้งานซ้ำเอง
  </Accordion>
  <Accordion title="ผู้ให้บริการเฉพาะแคตตาล็อก">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเพียง `catalog` และใช้ลูป inference ร่วมกัน
  </Accordion>
  <Accordion title="ตัวช่วยสตรีมเฉพาะ Anthropic">
    ส่วนหัวเบต้า, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam สาธารณะ `api.ts` / `contract-api.ts` ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วยรันไทม์

Plugin สามารถเข้าถึงตัวช่วยหลักที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS หลักปกติสำหรับพื้นผิวไฟล์/บันทึกเสียง
- ใช้คอนฟิก `messages.tts` หลักและการเลือกผู้ให้บริการ
- ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง Plugin ต้อง resample/encode สำหรับผู้ให้บริการ
- `listVoices` เป็นทางเลือกตามแต่ละผู้ให้บริการ ใช้สำหรับตัวเลือกเสียงหรือโฟลว์ตั้งค่าที่ผู้ขายเป็นเจ้าของ
- รายการเสียงสามารถมีเมทาดาตาที่สมบูรณ์ขึ้น เช่น locale, เพศ และแท็กบุคลิกภาพ สำหรับตัวเลือกที่รับรู้ผู้ให้บริการ
- OpenAI และ ElevenLabs รองรับโทรศัพท์ในปัจจุบัน Microsoft ไม่รองรับ

Plugin ยังสามารถลงทะเบียนผู้ให้บริการเสียงพูดผ่าน `api.registerSpeechProvider(...)`

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

- เก็บนโยบาย TTS, fallback และการส่งมอบคำตอบไว้ในแกนหลัก
- ใช้ผู้ให้บริการเสียงพูดสำหรับพฤติกรรมการสังเคราะห์ที่ผู้ขายเป็นเจ้าของ
- อินพุต Microsoft `edge` แบบเก่าจะถูกปรับให้อยู่ในรหัสผู้ให้บริการ `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำเป็นแบบมุ่งตามบริษัท: Plugin ผู้ขายหนึ่งตัวสามารถเป็นเจ้าของ
  ผู้ให้บริการข้อความ, เสียงพูด, รูปภาพ และสื่อในอนาคต เมื่อ OpenClaw เพิ่ม
  สัญญาความสามารถเหล่านั้น

สำหรับการทำความเข้าใจรูปภาพ/เสียง/วิดีโอ Plugin จะลงทะเบียน
ผู้ให้บริการ media-understanding ที่มีชนิดแทนถุง key/value ทั่วไป:

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

- เก็บ orchestration, fallback, คอนฟิก และการเชื่อมสายช่องทางไว้ในแกนหลัก
- เก็บพฤติกรรมของผู้ขายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบเพิ่มได้ควรคงไว้ให้มีชนิด: เมธอดทางเลือกใหม่, ฟิลด์ผลลัพธ์ทางเลือกใหม่,
  ความสามารถทางเลือกใหม่
- การสร้างวิดีโอใช้รูปแบบเดียวกันอยู่แล้ว:
  - แกนหลักเป็นเจ้าของสัญญาความสามารถและตัวช่วยรันไทม์
  - Plugin ผู้ขายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin ฟีเจอร์/ช่องทางใช้ `api.runtime.videoGeneration.*`

สำหรับตัวช่วยรันไทม์ media-understanding, Plugin สามารถเรียก:

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

สำหรับการถอดเสียงเสียง Plugin สามารถใช้ได้ทั้งรันไทม์ media-understanding
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

- `api.runtime.mediaUnderstanding.*` เป็นพื้นผิวร่วมที่แนะนำสำหรับ
  การทำความเข้าใจรูปภาพ/เสียง/วิดีโอ
- ใช้คอนฟิกเสียง media-understanding หลัก (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียงถูกสร้างขึ้น เช่น อินพุตที่ถูกข้าม/ไม่รองรับ
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็น alias เพื่อความเข้ากันได้

Plugin ยังสามารถเริ่มการรัน subagent เบื้องหลังผ่าน `api.runtime.subagent`:

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

- `provider` และ `model` เป็นการ override แบบรายรัน ไม่ใช่การเปลี่ยนแปลงเซสชันแบบถาวร
- OpenClaw เคารพฟิลด์ override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ ผู้ปฏิบัติงานต้องเลือกใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เป้าหมาย `provider/model` แบบ canonical เฉพาะ หรือ `"*"` เพื่ออนุญาตเป้าหมายใด ๆ อย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่เชื่อถือยังคงทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ
- เซสชัน subagent ที่ Plugin สร้างจะถูกติดแท็กด้วยรหัส Plugin ที่สร้าง Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะเซสชันที่เป็นเจ้าของเหล่านั้น การลบเซสชันตามอำเภอใจยังต้องใช้คำขอ Gateway ขอบเขตแอดมิน

สำหรับการค้นหาเว็บ Plugin สามารถใช้ตัวช่วยรันไทม์ร่วมแทนที่จะ
เข้าไปยังการเชื่อมสายเครื่องมือของเอเจนต์โดยตรง:

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

Plugin ยังสามารถลงทะเบียนผู้ให้บริการค้นหาเว็บผ่าน
`api.registerWebSearchProvider(...)`

หมายเหตุ:

- เก็บการเลือกผู้ให้บริการ, การแก้ไขข้อมูลรับรอง และซีแมนติกคำขอร่วมไว้ในแกนหลัก
- ใช้ผู้ให้บริการค้นหาเว็บสำหรับทรานสปอร์ตค้นหาเฉพาะผู้ขาย
- `api.runtime.webSearch.*` เป็นพื้นผิวร่วมที่แนะนำสำหรับ Plugin ฟีเจอร์/ช่องทางที่ต้องการพฤติกรรมการค้นหาโดยไม่ขึ้นกับ wrapper เครื่องมือเอเจนต์

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

- `generate(...)`: สร้างรูปภาพโดยใช้ chain ผู้ให้บริการสร้างรูปภาพที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการสร้างรูปภาพที่พร้อมใช้งานและความสามารถของผู้ให้บริการเหล่านั้น

## เส้นทาง HTTP ของ Gateway

Plugin สามารถเปิดเผยปลายทาง HTTP ด้วย `api.registerHttpRoute(...)`

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

ฟิลด์เส้นทาง:

- `path`: เส้นทางภายใต้เซิร์ฟเวอร์ HTTP ของ Gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อบังคับใช้การยืนยันตัวตน Gateway ปกติ หรือ `"plugin"` สำหรับการยืนยันตัวตน/การตรวจสอบ Webhook ที่ Plugin จัดการ
- `match`: ทางเลือก `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ทางเลือก อนุญาตให้ Plugin เดิมแทนที่การลงทะเบียนเส้นทางเดิมของตนเอง
- `handler`: ส่งคืน `true` เมื่อเส้นทางจัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกลบออกแล้วและจะทำให้เกิดข้อผิดพลาดขณะโหลด Plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` ที่ตรงกันทุกประการจะถูกปฏิเสธ เว้นแต่มี `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่เส้นทางของอีก Plugin หนึ่งได้
- เส้นทางที่ทับซ้อนกันและมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้ใช้ลำดับ fallthrough แบบ `exact`/`prefix` ที่อยู่ในระดับ auth เดียวกันเท่านั้น
- เส้นทาง `auth: "plugin"` จะ **ไม่ได้** รับ operator runtime scopes โดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ Webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการเอง ไม่ใช่การเรียกใช้ตัวช่วย Gateway ที่มีสิทธิ์พิเศษ
- เส้นทาง `auth: "gateway"` ทำงานภายใน runtime scope ของคำขอ Gateway แต่ scope นั้นตั้งใจให้เป็นแบบระมัดระวัง:
  - การยืนยันตัวตนแบบ bearer ด้วย shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึง runtime scopes ของเส้นทาง Plugin ไว้ที่ `operator.write` แม้ผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นั้นอย่างชัดเจนเท่านั้น
  - หากไม่มี `x-openclaw-scopes` ในคำขอเส้นทาง Plugin ที่มีตัวตนเหล่านั้น runtime scope จะย้อนกลับไปเป็น `operator.write`
- กฎเชิงปฏิบัติ: อย่าถือว่าเส้นทาง Plugin แบบ gateway-auth เป็นพื้นผิวแอดมินโดยนัย หากเส้นทางของคุณต้องใช้พฤติกรรมที่จำกัดเฉพาะแอดมิน ให้กำหนดให้ใช้โหมด auth ที่มีตัวตน และบันทึกสัญญา header `x-openclaw-scopes` ที่ชัดเจนไว้ในเอกสาร

## พาธ import ของ Plugin SDK

ใช้ subpath ของ SDK ที่แคบแทน barrel root แบบรวมศูนย์ `openclaw/plugin-sdk`
เมื่อเขียน Plugin ใหม่ subpath หลัก:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วยสำหรับรายการ/การสร้าง Channel                        |
| `openclaw/plugin-sdk/core`          | ตัวช่วยร่วมทั่วไปและสัญญาครอบคลุม       |
| `openclaw/plugin-sdk/config-schema` | schema Zod ของ root `openclaw.json` (`OpenClawSchema`) |

Channel Plugin เลือกใช้จากกลุ่ม seam แบบแคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
อยู่บนสัญญา `approvalCapability` เดียว แทนการผสมข้ามฟิลด์ Plugin ที่ไม่เกี่ยวข้องกัน
ดู [Channel plugins](/th/plugins/sdk-channel-plugins)

ตัวช่วย runtime และ config อยู่ภายใต้ subpath `*-runtime` ที่เจาะจงตรงกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ให้ใช้ `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation`
แทน barrel ความเข้ากันได้แบบกว้าง `config-runtime`

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น compatibility shim ที่เลิกแนะนำแล้วสำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควร import primitive ทั่วไปที่แคบกว่าแทน
</Info>

entry point ภายใน repo (ต่อ root ของแพ็กเกจ Plugin ที่ bundled):

- `index.js` — entry ของ bundled Plugin
- `api.js` — barrel สำหรับตัวช่วย/ชนิดข้อมูล
- `runtime-api.js` — barrel เฉพาะ runtime
- `setup-entry.js` — entry ของ setup Plugin

Plugin ภายนอกควร import เฉพาะ subpath `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของแพ็กเกจ Plugin อื่นจาก core หรือจาก Plugin อื่น
entry point ที่โหลดผ่าน facade จะใช้ snapshot config runtime ที่ active ก่อนเมื่อมีอยู่
แล้วจึง fallback ไปยังไฟล์ config ที่ resolve แล้วบนดิสก์

subpath เฉพาะ capability เช่น `image-generation`, `media-understanding`,
และ `speech` มีอยู่เพราะ bundled Plugin ใช้งานอยู่ในปัจจุบัน สิ่งเหล่านี้ไม่ได้เป็น
สัญญาภายนอกระยะยาวที่ถูก freeze โดยอัตโนมัติ โปรดตรวจสอบหน้าอ้างอิง SDK
ที่เกี่ยวข้องเมื่อพึ่งพาใช้งาน

## schema ของเครื่องมือข้อความ

Plugin ควรเป็นเจ้าของ contribution schema `describeMessageTool(...)`
เฉพาะ channel สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reaction, read, และ poll
การนำเสนอการส่งแบบร่วมควรใช้สัญญา `MessagePresentation` ทั่วไป
แทนฟิลด์ button, component, block, หรือ card แบบ provider-native
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การแมป provider, และ checklist สำหรับผู้เขียน Plugin

Plugin ที่ส่งได้ประกาศสิ่งที่สามารถ render ได้ผ่าน message capabilities:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอ pinned-delivery

Core ตัดสินใจว่าจะ render presentation แบบ native หรือลดระดับเป็นข้อความ
อย่าเปิดช่อง escape hatch ของ UI แบบ provider-native จากเครื่องมือข้อความทั่วไป
ตัวช่วย SDK ที่เลิกแนะนำแล้วสำหรับ schema native รุ่นเก่ายังคงถูก export ไว้สำหรับ
Plugin ภายนอกเดิม แต่ Plugin ใหม่ไม่ควรใช้

## การ resolve เป้าหมายของ Channel

Channel Plugin ควรเป็นเจ้าของความหมายของเป้าหมายเฉพาะ channel ให้ host outbound
ร่วมเป็นแบบทั่วไป และใช้พื้นผิว messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินใจว่าเป้าหมายที่ normalize แล้ว
  ควรถูกจัดเป็น `direct`, `group`, หรือ `channel` ก่อน lookup directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า input
  ควรข้ามไป resolve แบบคล้าย id โดยตรงแทนการค้นหา directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ Plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ provider เป็นเจ้าของหลังการ normalize หรือหลัง
  directory miss
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route
  เฉพาะ provider เมื่อ resolve เป้าหมายแล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจหมวดหมู่ที่ควรเกิดก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจสอบ “ถือว่านี่เป็น target id แบบ explicit/native”
- ใช้ `resolveTarget` สำหรับ fallback การ normalize เฉพาะ provider ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- เก็บ id แบบ provider-native เช่น chat ids, thread ids, JIDs, handles, และ room
  ids ไว้ภายในค่า `target` หรือ params เฉพาะ provider ไม่ใช่ในฟิลด์ SDK ทั่วไป

## directory ที่อิง config

Plugin ที่ derive รายการ directory จาก config ควรเก็บ logic นั้นไว้ใน
Plugin และ reuse ตัวช่วยร่วมจาก
`openclaw/plugin-sdk/directory-runtime`

ใช้สิ่งนี้เมื่อ channel ต้องการ peers/groups ที่อิง config เช่น:

- DM peers ที่ขับเคลื่อนด้วย allowlist
- แผนที่ channel/group ที่กำหนดค่าไว้
- fallback directory แบบ static ที่ผูกกับ account

ตัวช่วยร่วมใน `directory-runtime` จัดการเฉพาะ operation ทั่วไป:

- การกรอง query
- การใช้ limit
- ตัวช่วย dedupe/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบ account เฉพาะ channel และการ normalize id ควรอยู่ใน
implementation ของ Plugin

## catalog ของ Provider

Provider Plugin สามารถกำหนด model catalog สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืน shape เดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับรายการ provider เดียว
- `{ providers }` สำหรับรายการ provider หลายรายการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ model ids เฉพาะ provider, ค่า default
ของ base URL, หรือ metadata model ที่ถูกควบคุมด้วย auth

`catalog.order` ควบคุมเวลาที่ catalog ของ Plugin merge เทียบกับ provider นัย
ในตัวของ OpenClaw:

- `simple`: provider แบบ API-key ธรรมดาหรือขับเคลื่อนด้วย env
- `profile`: provider ที่ปรากฏเมื่อมี auth profiles
- `paired`: provider ที่ synthesize รายการ provider ที่เกี่ยวข้องหลายรายการ
- `late`: pass สุดท้าย หลัง provider นัยอื่น

provider ที่มาทีหลังชนะเมื่อ key ชนกัน ดังนั้น Plugin สามารถตั้งใจ override
รายการ provider ในตัวด้วย provider id เดียวกันได้

ความเข้ากันได้:

- `discovery` ยังคงทำงานเป็น alias รุ่นเก่า
- หากลงทะเบียนทั้ง `catalog` และ `discovery` แล้ว OpenClaw จะใช้ `catalog`

## การตรวจสอบ Channel แบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียน channel ให้เลือก implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือ path runtime อนุญาตให้ถือว่า credentials
  ถูก materialize ครบแล้ว และสามารถ fail fast เมื่อ secret ที่จำเป็นขาดหายได้
- path คำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, และ flow doctor/config
  repair ไม่ควรต้อง materialize runtime credentials เพียงเพื่อ
  อธิบาย configuration

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะ account เชิงอธิบายเท่านั้น
- คง `enabled` และ `configured` ไว้
- รวมฟิลด์ source/status ของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่า token ดิบเพียงเพื่อรายงาน availability แบบอ่านอย่างเดียว
  การคืน `tokenStatus: "available"` (และฟิลด์ source ที่ตรงกัน)
  เพียงพอสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานใน path คำสั่งปัจจุบัน

สิ่งนี้ทำให้คำสั่งอ่านอย่างเดียวรายงานว่า “กำหนดค่าแล้วแต่ไม่พร้อมใช้งานใน
path คำสั่งนี้” แทนการ crash หรือรายงานผิดว่า account ไม่ได้ถูกกำหนดค่า

## package packs

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

แต่ละ entry จะกลายเป็น Plugin หาก pack ระบุ extensions หลายรายการ Plugin id
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import npm deps ให้ติดตั้งไว้ใน directory นั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

guardrail ด้านความปลอดภัย: ทุก entry ของ `openclaw.extensions` ต้องคงอยู่ภายใน directory ของ Plugin
หลังการ resolve symlink entry ที่หลุดออกจาก directory ของแพ็กเกจจะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependencies ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบ local ต่อโปรเจกต์ (ไม่มี lifecycle scripts,
ไม่มี dev dependencies ตอน runtime) โดยไม่สนใจการตั้งค่า npm install global ที่สืบทอดมา
ให้ dependency tree ของ Plugin เป็น “pure JS/TS” และหลีกเลี่ยงแพ็กเกจที่ต้อง
build ด้วย `postinstall`

ทางเลือก: `openclaw.setupEntry` สามารถชี้ไปยัง module setup-only แบบเบาได้
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ Channel Plugin ที่ disabled หรือ
เมื่อ Channel Plugin เปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า จะโหลด `setupEntry`
แทน entry เต็มของ Plugin สิ่งนี้ทำให้ startup และ setup เบาขึ้น
เมื่อ entry หลักของ Plugin ของคุณยัง wire tools, hooks, หรือโค้ดอื่นที่ใช้เฉพาะ runtime
ด้วย

ทางเลือก: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถเลือกให้ Channel Plugin ใช้ path `setupEntry` เดียวกันระหว่าง phase startup
ก่อน listen ของ gateway ได้ แม้ channel จะถูกกำหนดค่าแล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ที่ต้องมีอยู่
ก่อน gateway เริ่ม listen อย่างครบถ้วน ในทางปฏิบัติ นั่นหมายถึง setup entry
ต้องลงทะเบียนทุก capability ที่ channel เป็นเจ้าของและ startup พึ่งพา เช่น:

- การลงทะเบียน channel เอง
- HTTP routes ใด ๆ ที่ต้องพร้อมใช้งานก่อน gateway เริ่ม listen
- gateway methods, tools, หรือ services ใด ๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก entry เต็มของคุณยังเป็นเจ้าของ startup capability ที่จำเป็นใด ๆ อยู่ อย่าเปิดใช้
flag นี้ ให้ Plugin ใช้พฤติกรรม default ต่อไป และปล่อยให้ OpenClaw โหลด
entry เต็มระหว่าง startup

bundled channels ยังสามารถ publish ตัวช่วยพื้นผิวสัญญาแบบ setup-only ที่ core
สามารถ consult ก่อนโหลด runtime เต็มของ channel ได้ พื้นผิว setup
promotion ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

คอร์ใช้พื้นผิวนี้เมื่อต้องเลื่อนระดับการตั้งค่าแชนเนลบัญชีเดียวแบบเดิม
ไปเป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลดรายการ Plugin เต็มรูปแบบ
Matrix คือตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: โดยจะย้ายเฉพาะคีย์ auth/bootstrap ไปยัง
บัญชีที่ถูกเลื่อนระดับแบบมีชื่อเมื่อมีบัญชีแบบมีชื่ออยู่แล้ว และสามารถคงคีย์บัญชีเริ่มต้น
ที่ตั้งค่าไว้แบบไม่เป็นค่ามาตรฐานไว้ได้ แทนที่จะสร้าง `accounts.default` เสมอ

อะแดปเตอร์แพตช์การตั้งค่าเหล่านั้นทำให้การค้นพบพื้นผิวสัญญาที่บันเดิลไว้ยังคงเป็นแบบขี้เกียจ เวลา import จึงยังเบา และพื้นผิวการเลื่อนระดับจะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรกแทนที่จะกลับเข้าไปเริ่มต้นแชนเนลที่บันเดิลไว้ตอน import โมดูล

เมื่อพื้นผิวการเริ่มต้นเหล่านั้นมีเมธอด RPC ของ Gateway ให้เก็บไว้ใต้ prefix เฉพาะ Plugin เนมสเปซผู้ดูแลของคอร์ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ resolve เป็น
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

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

### เมทาดาทาแค็ตตาล็อกแชนเนล

Plugin แชนเนลสามารถประกาศเมทาดาทาการตั้งค่า/การค้นพบผ่าน `openclaw.channel` และ
คำใบ้การติดตั้งผ่าน `openclaw.install` วิธีนี้ทำให้ข้อมูลแค็ตตาล็อกของคอร์ยังคงว่างอยู่

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

- `detailLabel`: ป้ายกำกับรองสำหรับพื้นผิวแค็ตตาล็อก/สถานะที่สมบูรณ์ขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: id ของ Plugin/แชนเนลที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการแค็ตตาล็อกนี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: การควบคุมข้อความของพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าแชนเนลรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนแชนเนลจากพื้นผิวรายการแชนเนลที่ตั้งค่าแล้วเมื่อตั้งเป็น `false`
- `exposure.setup`: ซ่อนแชนเนลจากตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบเมื่อตั้งเป็น `false`
- `exposure.docs`: ทำเครื่องหมายแชนเนลเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังรับอยู่เพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้แชนเนลเข้าร่วม flow มาตรฐาน quickstart `allowFrom`
- `forceAccountBinding`: บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับการค้นหา session เมื่อ resolve เป้าหมายประกาศ

OpenClaw ยังสามารถรวม **แค็ตตาล็อกแชนเนลภายนอก** ได้ด้วย (เช่น export จาก registry ของ MPM) วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควรมี
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมสำหรับคีย์ `"entries"` ด้วย

รายการแค็ตตาล็อกแชนเนลที่สร้างขึ้นและรายการแค็ตตาล็อกการติดตั้ง provider เปิดเผยข้อเท็จจริง install-source ที่ถูก normalize ถัดจากบล็อก `openclaw.install` ดิบ ข้อเท็จจริงที่ถูก normalize ระบุว่า npm spec เป็นเวอร์ชันแบบ exact หรือ selector แบบ floating, มีเมทาดาทา integrity ที่คาดไว้หรือไม่, และมี path แหล่งที่มาในเครื่องพร้อมใช้งานด้วยหรือไม่ เมื่อทราบตัวตนของแค็ตตาล็อก/แพ็กเกจ ข้อเท็จจริงที่ถูก normalize จะเตือนหากชื่อแพ็กเกจ npm ที่ parse ได้คลาดเคลื่อนจากตัวตนนั้น และยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่ไม่มีอยู่ และเมื่อมีเมทาดาทา npm integrity โดยไม่มีแหล่ง npm ที่ถูกต้อง ผู้บริโภคควรมอง `installSource` เป็นฟิลด์เสริมแบบ additive เพื่อให้รายการที่สร้างด้วยมือและ shim ของแค็ตตาล็อกไม่จำเป็นต้องสังเคราะห์มันขึ้นมา
สิ่งนี้ช่วยให้ onboarding และ diagnostics อธิบายสถานะ source-plane ได้โดยไม่ต้อง import runtime ของ Plugin

รายการ npm ภายนอกอย่างเป็นทางการควรใช้ `npmSpec` แบบ exact ร่วมกับ
`expectedIntegrity` เป็นหลัก ชื่อแพ็กเกจเปล่าและ dist-tags ยังทำงานได้เพื่อความเข้ากันได้ แต่จะแสดงคำเตือน source-plane เพื่อให้แค็ตตาล็อกค่อยๆ เคลื่อนไปสู่การติดตั้งที่ pin ไว้และตรวจสอบ integrity โดยไม่ทำให้ Plugin ที่มีอยู่พัง
เมื่อ onboarding ติดตั้งจาก path แค็ตตาล็อกในเครื่อง จะบันทึกรายการดัชนี Plugin ที่จัดการอยู่พร้อม `source: "path"` และ
`sourcePath` ที่เป็น relative กับ workspace เมื่อทำได้ path โหลดเชิงปฏิบัติการแบบ absolute จะยังอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งหลีกเลี่ยงการทำซ้ำ path เวิร์กสเตชันในเครื่องลงในการตั้งค่าระยะยาว วิธีนี้ทำให้การติดตั้งสำหรับพัฒนาในเครื่องยังมองเห็นได้ต่อ diagnostics ของ source-plane โดยไม่เพิ่มพื้นผิวเปิดเผย path ระบบไฟล์ดิบที่สอง ดัชนี Plugin ที่คงอยู่ใน `plugins/installs.json` คือแหล่งความจริงของการติดตั้ง และสามารถ refresh ได้โดยไม่ต้องโหลดโมดูล runtime ของ Plugin
map `installRecords` ของมันคงทนแม้ manifest ของ Plugin จะหายไปหรือไม่ถูกต้อง; array `plugins` ของมันเป็นมุมมอง manifest ที่สร้างใหม่ได้

## Plugin เครื่องมือบริบท

Plugin เครื่องมือบริบทเป็นเจ้าของการจัด orchestration บริบท session สำหรับ ingest, assembly,
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` จากนั้นเลือก engine ที่ใช้งานด้วย
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

factory `ctx` เปิดเผยค่า `config`, `agentDir` และ `workspaceDir`
แบบไม่บังคับสำหรับการเริ่มต้นตอนสร้าง

ถ้า engine ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()`
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

## การเพิ่มความสามารถใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้าม
ระบบ Plugin ด้วยการเอื้อมเข้า private ให้เพิ่มความสามารถที่ขาดอยู่แทน

ลำดับที่แนะนำ:

1. กำหนดสัญญาของคอร์
   ตัดสินใจว่าพฤติกรรมร่วมใดที่คอร์ควรเป็นเจ้าของ: policy, fallback, การ merge config,
   lifecycle, semantics ที่หันหน้าไปหาแชนเนล และรูปทรง runtime helper
2. เพิ่มพื้นผิวการลงทะเบียน/runtime ของ Plugin แบบมี type
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิวความสามารถแบบ typed ที่เล็กที่สุดแต่มีประโยชน์
3. เชื่อมคอร์ + ผู้บริโภคแชนเนล/ฟีเจอร์
   แชนเนลและ Plugin ฟีเจอร์ควรบริโภคความสามารถใหม่ผ่านคอร์
   ไม่ใช่โดย import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementation ของ vendor
   จากนั้น Plugin ของ vendor ลงทะเบียน backend ของตนกับความสามารถนั้น
5. เพิ่มการครอบคลุมสัญญา
   เพิ่ม tests เพื่อให้ ownership และรูปทรงการลงทะเบียนยังชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีจุดยืนไว้โดยไม่ hardcode ตามโลกทัศน์ของ provider รายเดียว ดู [ตำรา Capability](/th/plugins/architecture)
สำหรับ checklist ไฟล์ที่เป็นรูปธรรมและตัวอย่างที่ทำไว้แล้ว

### Checklist ความสามารถ

เมื่อคุณเพิ่มความสามารถใหม่ implementation มักควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- ประเภทสัญญาคอร์ใน `src/<capability>/types.ts`
- runner/runtime helper ของคอร์ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน API ของ Plugin ใน `src/plugins/types.ts`
- การเดินสาย registry ของ Plugin ใน `src/plugins/registry.ts`
- การเปิดเผย runtime ของ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/แชนเนล
  ต้องบริโภคมัน
- helper สำหรับ capture/test ใน `src/test-utils/plugin-registration.ts`
- assertion ownership/contract ใน `src/plugins/contracts/registry.ts`
- เอกสาร operator/Plugin ใน `docs/`

ถ้าหนึ่งในพื้นผิวเหล่านั้นหายไป โดยปกตินั่นเป็นสัญญาณว่าความสามารถยังไม่ได้ผสานรวมอย่างสมบูรณ์

### เทมเพลตความสามารถ

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

รูปแบบ test สัญญา:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

นั่นทำให้กฎเรียบง่าย:

- คอร์เป็นเจ้าของสัญญาความสามารถ + orchestration
- Plugin ของ vendor เป็นเจ้าของ implementation ของ vendor
- Plugin ฟีเจอร์/แชนเนลบริโภค runtime helpers
- tests สัญญาทำให้ ownership ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรงความสามารถสาธารณะ
- [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
