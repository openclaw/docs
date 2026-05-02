---
read_when:
    - การใช้งานฮุกของรันไทม์ผู้ให้บริการ วงจรชีวิตของช่องทาง หรือชุดแพ็กเกจ
    - การดีบักลำดับการโหลด Plugin หรือสถานะของรีจิสทรี
    - การเพิ่มความสามารถใหม่ของ Plugin หรือ Plugin เอนจินบริบท
summary: 'รายละเอียดภายในสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกของรันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: รายละเอียดภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-05-02T10:22:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบของ Plugin และสัญญาด้านความเป็นเจ้าของ/การดำเนินการ
ดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็น
ข้อมูลอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุก runtime,
เส้นทาง HTTP ของ Gateway, พาธ import และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มต้น OpenClaw จะทำโดยประมาณดังนี้:

1. ค้นพบราก Plugin ที่เป็นตัวเลือก
2. อ่าน manifest ของ bundle แบบ native หรือแบบเข้ากันได้ และเมทาดาทาของ package
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. ทำให้ config ของ Plugin เป็นรูปแบบมาตรฐาน (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลดโมดูล native ที่เปิดใช้งาน: โมดูล bundled ที่ build แล้วใช้ loader แบบ native;
   source TypeScript ภายในเครื่องจากบุคคลที่สามใช้ Jiti fallback ฉุกเฉิน
7. เรียกฮุก native `register(api)` และรวบรวมการลงทะเบียนเข้าสู่รีจิสทรี Plugin
8. เปิดเผยรีจิสทรีให้กับคำสั่ง/พื้นผิว runtime

<Note>
`activate` เป็น alias รุ่นเก่าของ `register` — loader จะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกที่จุดเดียวกัน Plugin ที่ bundle มาทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ให้ใช้ `register`
</Note>

เกตความปลอดภัยเกิดขึ้น **ก่อน** การดำเนินการ runtime ตัวเลือกจะถูกบล็อก
เมื่อ entry ออกจากราก Plugin, พาธเป็น world-writable หรือความเป็นเจ้าของ
พาธดูน่าสงสัยสำหรับ Plugin ที่ไม่ใช่ bundled

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งความจริงของ control-plane OpenClaw ใช้สิ่งนี้เพื่อ:

- ระบุ Plugin
- ค้นพบ channels/skills/config schema ที่ประกาศไว้ หรือความสามารถของ bundle
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่ม label/placeholder ของ Control UI
- แสดงเมทาดาทาการติดตั้ง/catalog
- เก็บ descriptor สำหรับ activation และ setup ที่มีต้นทุนต่ำโดยไม่โหลด runtime ของ Plugin

สำหรับ Plugin แบบ native โมดูล runtime คือส่วน data-plane โมดูลนี้จะลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` ที่เป็นตัวเลือกใน manifest จะอยู่บน control plane
ต่อไป บล็อกเหล่านี้เป็น descriptor แบบเมทาดาทาเท่านั้นสำหรับการวางแผน activation และการค้นพบ setup;
บล็อกเหล่านี้ไม่แทนที่การลงทะเบียน runtime, `register(...)` หรือ `setupEntry`
consumer การ activation แบบ live ชุดแรกตอนนี้ใช้ hint ของคำสั่ง, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ก่อนการ materialize รีจิสทรีที่กว้างกว่า:

- การโหลด CLI จำกัดเฉพาะ Plugin ที่เป็นเจ้าของคำสั่งหลักที่ร้องขอ
- การ resolve channel setup/Plugin จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve provider setup/runtime แบบ explicit จำกัดเฉพาะ Plugin ที่เป็นเจ้าของ
  provider id ที่ร้องขอ
- การวางแผนการเริ่มต้น Gateway ใช้ `activation.onStartup` สำหรับ startup
  imports และ startup opt-outs แบบ explicit; Plugin ที่ไม่มีเมทาดาทา startup จะโหลดเฉพาะ
  ผ่าน trigger การ activation ที่แคบกว่า

ตัววางแผน activation เปิดเผยทั้ง API แบบ ids-only สำหรับ caller เดิม และ
API แบบ plan สำหรับ diagnostics ใหม่ รายการ plan จะรายงานสาเหตุที่ Plugin ถูกเลือก
โดยแยก hint ของตัววางแผน `activation.*` แบบ explicit ออกจาก fallback ด้านความเป็นเจ้าของของ manifest
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks การแยกเหตุผลนั้นคือขอบเขตความเข้ากันได้:
เมทาดาทา Plugin เดิมยังทำงานต่อไป ขณะที่โค้ดใหม่สามารถตรวจจับ hint ที่กว้าง
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยน semantics การโหลด runtime

ตอนนี้การค้นพบ setup จะเลือก id ที่ descriptor เป็นเจ้าของก่อน เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด Plugin ตัวเลือก ก่อน fallback ไปที่
`setup-api` สำหรับ Plugin ที่ยังต้องใช้ฮุก runtime ช่วง setup รายการ setup ของ provider
ใช้ manifest `providerAuthChoices`, ตัวเลือก setup ที่ได้จาก descriptor
และเมทาดาทา install-catalog โดยไม่โหลด runtime ของ provider ค่า explicit
`setup.requiresRuntime: false` เป็น cutoff แบบ descriptor-only; การละไว้ซึ่ง
`requiresRuntime` จะคง fallback `setup-api` รุ่นเก่าไว้เพื่อความเข้ากันได้ หากมี
Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ setup provider หรือ CLI
backend id ที่ normalize แล้วเดียวกัน การ lookup setup จะปฏิเสธเจ้าของที่กำกวมแทนการพึ่งพา
ลำดับการค้นพบ เมื่อ setup runtime ทำงาน diagnostics ของรีจิสทรีจะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ providers หรือ CLI
backends ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก Plugin รุ่นเก่า

### ขอบเขต cache ของ Plugin

OpenClaw ไม่ cache ผลลัพธ์การค้นพบ Plugin หรือข้อมูลรีจิสทรี manifest โดยตรง
หลังหน้าต่างเวลา wall-clock การติดตั้ง การแก้ไข manifest และการเปลี่ยน load-path
ต้องมองเห็นได้ในการอ่านเมทาดาทาแบบ explicit ครั้งถัดไป หรือการ rebuild snapshot ครั้งถัดไป
parser ไฟล์ manifest อาจเก็บ cache file-signature แบบมีขอบเขตที่ key ด้วย
พาธ manifest ที่เปิด, inode, ขนาด และ timestamps; cache นั้นมีไว้เพียงหลีกเลี่ยง
การ parse bytes ที่ไม่เปลี่ยนแปลงซ้ำ และต้องไม่ cache คำตอบด้าน discovery, registry, owner หรือ
policy

fast path ของเมทาดาทาที่ปลอดภัยคือความเป็นเจ้าของ object แบบ explicit ไม่ใช่ cache ที่ซ่อนอยู่
hot path ช่วงเริ่มต้น Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ได้มา หรือรีจิสทรี manifest แบบ explicit ผ่าน call
chain การตรวจสอบ config, startup auto-enable, bootstrap ของ Plugin และการเลือก provider
สามารถใช้ object เหล่านั้นซ้ำได้ตราบเท่าที่ object เหล่านั้นแทน config และ
inventory ของ Plugin ปัจจุบัน การ lookup setup ยังคงสร้างเมทาดาทา manifest ใหม่ตามต้องการ
เว้นแต่พาธ setup นั้นจะได้รับรีจิสทรี manifest แบบ explicit; ให้คงไว้
เป็น fallback ของ cold-path แทนการเพิ่ม cache lookup ที่ซ่อนอยู่ เมื่อ input
เปลี่ยน ให้ rebuild และแทนที่ snapshot แทนการ mutate หรือเก็บ
สำเนาประวัติไว้
view เหนือรีจิสทรี Plugin ที่ active และตัวช่วย bootstrap channel ที่ bundled
ควรถูกคำนวณใหม่จากรีจิสทรี/รากปัจจุบัน map อายุสั้นใช้ได้
ภายในหนึ่ง call เพื่อ dedupe งานหรือป้องกัน reentry; แต่ต้องไม่กลายเป็น cache
เมทาดาทาของ process

สำหรับการโหลด Plugin ชั้น cache ถาวรคือการโหลด runtime ชั้นนี้อาจใช้
สถานะ loader ซ้ำเมื่อโค้ดหรือ artifact ที่ติดตั้งถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และรีจิสทรี runtime ที่ active และเข้ากันได้
- cache ของ jiti/module และ cache ของ loader พื้นผิวสาธารณะที่ใช้เพื่อหลีกเลี่ยงการ import
  พื้นผิว runtime เดิมซ้ำ
- cache ของระบบไฟล์สำหรับ artifact ของ Plugin ที่ติดตั้ง
- map อายุสั้นต่อ call สำหรับการ normalize พาธหรือการ resolve รายการซ้ำ

cache เหล่านั้นเป็นรายละเอียด implementation ของ data-plane ต้องไม่ตอบ
คำถามของ control-plane เช่น "Plugin ใดเป็นเจ้าของ provider นี้?" เว้นแต่
caller ตั้งใจขอการโหลด runtime

อย่าเพิ่ม cache แบบถาวรหรือแบบ wall-clock สำหรับ:

- ผลลัพธ์การค้นพบ
- รีจิสทรี manifest โดยตรง
- รีจิสทรี manifest ที่สร้างใหม่จากดัชนี Plugin ที่ติดตั้ง
- การ lookup เจ้าของ provider, การ suppress โมเดล, policy ของ provider หรือเมทาดาทา public-artifact
- คำตอบอื่นใดที่ได้จาก manifest ซึ่ง manifest ที่เปลี่ยน ดัชนีที่ติดตั้ง
  หรือ load path ควรมองเห็นได้ในการอ่านเมทาดาทาครั้งถัดไป

caller ที่ rebuild เมทาดาทา manifest จากดัชนี Plugin ที่ติดตั้งและ persist ไว้
จะสร้างรีจิสทรีนั้นใหม่ตามต้องการ ดัชนีที่ติดตั้งคือสถานะ source-plane ที่คงทน;
ไม่ใช่ cache เมทาดาทาใน process ที่ซ่อนอยู่

## โมเดลรีจิสทรี

Plugin ที่โหลดแล้วไม่ได้ mutate global ของ core แบบสุ่มโดยตรง แต่จะลงทะเบียนเข้าสู่
รีจิสทรี Plugin ส่วนกลาง

รีจิสทรีติดตาม:

- record ของ Plugin (identity, source, origin, status, diagnostics)
- tools
- hooks รุ่นเก่าและ typed hooks
- channels
- providers
- handler ของ gateway RPC
- เส้นทาง HTTP
- registrar ของ CLI
- background services
- คำสั่งที่ Plugin เป็นเจ้าของ

จากนั้นฟีเจอร์ของ core จะอ่านจากรีจิสทรีนั้น แทนที่จะคุยกับโมดูล Plugin
โดยตรง สิ่งนี้ทำให้การโหลดเป็นทางเดียว:

- โมดูล Plugin -> การลงทะเบียนรีจิสทรี
- runtime ของ core -> การใช้รีจิสทรี

การแยกส่วนนี้สำคัญต่อการดูแลรักษา หมายความว่าพื้นผิว core ส่วนใหญ่
ต้องการเพียงจุด integration จุดเดียว: "อ่านรีจิสทรี" ไม่ใช่ "จัดการทุกโมดูล
Plugin เป็นกรณีพิเศษ"

## callback การผูก conversation

Plugin ที่ bind conversation สามารถตอบสนองเมื่อ approval ถูก resolve

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังคำขอ bind
ได้รับอนุมัติหรือถูกปฏิเสธ:

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
- `request`: สรุปคำขอเดิม, hint สำหรับ detach, sender id และ
  เมทาดาทา conversation

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
conversation และทำงานหลัง core approval handling เสร็จสิ้น

## ฮุก runtime ของ provider

Plugin ของ provider มีสามชั้น:

- **เมทาดาทา manifest** สำหรับการ lookup ก่อน runtime ที่มีต้นทุนต่ำ:
  `setup.providers[].envVars`, ความเข้ากันได้ที่เลิกใช้แล้ว `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **ฮุกช่วง config**: `catalog` (รุ่นเก่า `discovery`) รวมถึง
  `applyConfigDefaults`
- **ฮุก runtime**: ฮุกที่เป็นตัวเลือกมากกว่า 40 รายการ ครอบคลุม auth, การ resolve โมเดล,
  การ wrap stream, thinking levels, replay policy และ usage endpoints ดู
  รายการเต็มภายใต้ [ลำดับฮุกและการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ agent loop ทั่วไป, failover, การจัดการ transcript และ
tool policy ฮุกเหล่านี้คือพื้นผิว extension สำหรับพฤติกรรมเฉพาะ provider
โดยไม่จำเป็นต้องมี inference transport แบบ custom ทั้งหมด

ใช้ manifest `setup.providers[].envVars` เมื่อ provider มี credentials ที่อิง env
ซึ่งพาธ auth/status/model-picker ทั่วไปควรเห็นโดยไม่ต้องโหลด runtime ของ Plugin
`providerAuthEnvVars` ที่เลิกใช้แล้วยังคงถูกอ่านโดย compatibility adapter
ระหว่างช่วง deprecation และ Plugin ที่ไม่ใช่ bundled ที่ใช้สิ่งนี้จะได้รับ
diagnostic ของ manifest ใช้ manifest `providerAuthAliases` เมื่อ provider id หนึ่ง
ควรใช้ env vars, auth profiles, auth ที่อิง config และตัวเลือก onboarding ของ API-key
ร่วมกับ provider id อีกตัวหนึ่ง ใช้ manifest
`providerAuthChoices` เมื่อพื้นผิว CLI ของ onboarding/auth-choice ควรรู้
choice id ของ provider, group labels และการต่อสาย auth แบบ one-flag อย่างง่ายโดยไม่ต้อง
โหลด runtime ของ provider เก็บ provider runtime
`envVars` ไว้สำหรับ hint ที่หันหา operator เช่น label ของ onboarding หรือ vars สำหรับ setup
client-id/client-secret ของ OAuth

ใช้ manifest `channelEnvVars` เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง
fallback shell-env ทั่วไป, การตรวจสอบ config/status หรือ prompt setup ควรเห็น
โดยไม่ต้องโหลด runtime ของ channel

### ลำดับฮุกและการใช้งาน

สำหรับ Plugin ของโมเดล/provider OpenClaw จะเรียกฮุกในลำดับคร่าว ๆ นี้
คอลัมน์ "ควรใช้เมื่อใด" คือคู่มือการตัดสินใจแบบเร็ว
ฟิลด์ provider เฉพาะด้านความเข้ากันได้ที่ OpenClaw ไม่เรียกใช้อีกต่อไป เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` จงใจไม่แสดงไว้ที่นี่

| #   | ฮุก                              | ทำอะไร                                                                                                   | ควรใช้เมื่อใด                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการเข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปธรรม                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมดการยืนยันตัวตน, env, หรือซีแมนติกของตระกูลโมเดลของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองใช้เส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ฮุกของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้นามแฝง model-id แบบ legacy หรือ preview เป็นมาตรฐานก่อนการค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างค่านามแฝงก่อนการแก้โมเดลเป็นชื่อบัญญัติ                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของตระกูลผู้ให้บริการเป็นมาตรฐานก่อนการประกอบโมเดลทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้างค่า transport สำหรับรหัสผู้ให้บริการแบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อนการแก้ runtime/ผู้ให้บริการ                                           | ผู้ให้บริการต้องการการล้างค่าการกำหนดค่าที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมาด้วยยังช่วยรองรับรายการการกำหนดค่า Google ที่รองรับ   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียน compat การใช้งานสตรีมมิงแบบเนทีฟใหม่กับผู้ให้บริการในการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ metadata การใช้งานสตรีมมิงแบบเนทีฟที่ขับเคลื่อนด้วย endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | แก้ auth แบบ env-marker สำหรับผู้ให้บริการในการกำหนดค่าก่อนโหลด auth ของ runtime                                       | ผู้ให้บริการมีการแก้ API-key แบบ env-marker ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมีตัวแก้ AWS env-marker ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดง auth ภายในเครื่อง/โฮสต์เอง หรือที่อิงการกำหนดค่า โดยไม่เก็บ plaintext                                   | ผู้ให้บริการทำงานได้ด้วยตัวทำเครื่องหมายข้อมูลรับรองแบบสังเคราะห์/ภายในเครื่อง                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับโปรไฟล์ auth ภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลรับรองที่ CLI/app เป็นเจ้าของ | ผู้ให้บริการใช้ข้อมูลรับรอง auth ภายนอกซ้ำโดยไม่เก็บ refresh token ที่คัดลอกมา; ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของโปรไฟล์สังเคราะห์ที่เก็บไว้ให้อยู่หลัง auth ที่อิง env/config                                      | ผู้ให้บริการเก็บโปรไฟล์ placeholder แบบสังเคราะห์ที่ไม่ควรมีลำดับความสำคัญเหนือกว่า                                                                 |
| 11  | `resolveDynamicModel`             | fallback แบบซิงก์สำหรับรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของซึ่งยังไม่มีใน registry ภายในเครื่อง                                       | ผู้ให้บริการยอมรับรหัสโมเดล upstream แบบอิสระ                                                                                                 |
| 12  | `prepareDynamicModel`             | อุ่นเครื่องแบบ async จากนั้น `resolveDynamicModel` จะรันอีกครั้ง                                                           | ผู้ให้บริการต้องการ metadata จากเครือข่ายก่อนแก้รหัสที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | เขียนใหม่ขั้นสุดท้ายก่อนที่ runner แบบฝังจะใช้โมเดลที่แก้แล้ว                                               | ผู้ให้บริการต้องการการเขียน transport ใหม่แต่ยังใช้ transport ของ core                                                                             |
| 14  | `contributeResolvedModelCompat`   | ส่งมอบแฟล็ก compat สำหรับโมเดลของ vendor ที่อยู่หลัง transport อื่นที่เข้ากันได้                                  | ผู้ให้บริการจดจำโมเดลของตนเองบน proxy transport ได้โดยไม่เข้าควบคุมผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ทำให้ tool schema เป็นมาตรฐานก่อนที่ runner แบบฝังจะเห็น                                                    | ผู้ให้บริการต้องการการล้าง schema ของตระกูล transport                                                                                                |
| 16  | `inspectToolSchemas`              | แสดง diagnostics ของ schema ที่ผู้ให้บริการเป็นเจ้าของหลังการทำให้เป็นมาตรฐาน                                                  | ผู้ให้บริการต้องการคำเตือนเกี่ยวกับ keyword โดยไม่ต้องสอนกฎเฉพาะผู้ให้บริการให้ core                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบเนทีฟเทียบกับแบบ tagged                                                              | ผู้ให้บริการต้องการ reasoning/final output แบบ tagged แทน field แบบเนทีฟ                                                                         |
| 18  | `prepareExtraParams`              | ทำให้พารามิเตอร์คำขอเป็นมาตรฐานก่อน wrapper ตัวเลือกสตรีมทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์คำขอเริ่มต้นหรือการล้างพารามิเตอร์รายผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | ผู้ให้บริการต้องการโปรโตคอล wire แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper สตรีมหลังจากใช้ wrapper ทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการ wrapper compat สำหรับ header/body/model ของคำขอโดยไม่มี transport แบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบ header หรือ metadata ของ transport แบบเนทีฟต่อ turn                                                           | ผู้ให้บริการต้องการให้ transport ทั่วไปส่งตัวตน turn แบบเนทีฟของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบ header WebSocket แบบเนทีฟหรือนโยบาย cool-down ของ session                                                    | ผู้ให้บริการต้องการให้ transport WS ทั่วไปปรับ header ของ session หรือนโยบาย fallback                                                               |
| 23  | `formatApiKey`                    | formatter ของโปรไฟล์ auth: โปรไฟล์ที่เก็บไว้กลายเป็นสตริง `apiKey` ของ runtime                                     | ผู้ให้บริการเก็บ metadata auth เพิ่มเติมและต้องการรูปแบบ token runtime แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | override การรีเฟรช OAuth สำหรับ endpoint รีเฟรชแบบกำหนดเองหรือนโยบายเมื่อรีเฟรชล้มเหลว                                  | ผู้ให้บริการไม่เข้ากับ refresher `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมแซมที่ต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อมแซม auth ที่ผู้ให้บริการเป็นเจ้าของหลังการรีเฟรชล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาด overflow ดิบที่ heuristic ทั่วไปจะตรวจไม่พบ                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผล failover ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาด API/transport ดิบเป็น rate-limit/overload/ฯลฯ                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับผู้ให้บริการ proxy/backhaul                                                               | ผู้ให้บริการต้องการ gating TTL ของ cache ที่เฉพาะกับ proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | ข้อความแทนที่สำหรับข้อความกู้คืน missing-auth ทั่วไป                                                      | ผู้ให้บริการต้องการคำแนะนำการกู้คืน missing-auth เฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อกแบบสังเคราะห์/ขั้นสุดท้ายที่ต่อท้ายหลังการค้นพบ                                                          | ผู้ให้บริการต้องการแถว forward-compat แบบสังเคราะห์ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, label สำหรับแสดงผล, และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับขั้น thinking แบบกำหนดเองหรือ label แบบ binary สำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | ฮุกความเข้ากันได้ของ toggle reasoning แบบเปิด/ปิด                                                                     | ผู้ให้บริการเปิดเผยเฉพาะ thinking แบบเปิด/ปิดเท่านั้น                                                                                                  |
| 33  | `supportsXHighThinking`           | ฮุกความเข้ากันได้ของการรองรับ reasoning `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะในบางโมเดล                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | ฮุกความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 35  | `isModernModelRef`                | ตัวจับคู่โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์ live และการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับ live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลรับรองที่กำหนดค่าไว้เป็น token/key ของ runtime จริงก่อน inference                       | ผู้ให้บริการต้องการการแลกเปลี่ยน token หรือข้อมูลรับรองคำขออายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | แก้ไขข้อมูลประจำตัวสำหรับการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และพื้นที่แสดงสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลประจำตัวการใช้งานแบบอื่น                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงและทำให้สแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการเป็นรูปแบบมาตรฐาน หลังจากแก้ไขการยืนยันตัวตนแล้ว                             | ผู้ให้บริการต้องการปลายทางการใช้งานเฉพาะผู้ให้บริการ หรือตัวแยกวิเคราะห์เพย์โหลด                                                                           |
| 39  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำเป็นของ Plugin ผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบาย replay ที่ควบคุมการจัดการบันทึกบทสนทนาสำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบายบันทึกบทสนทนาแบบกำหนดเอง (เช่น การลบบล็อกการคิดออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติ replay ใหม่หลังจากการล้างบันทึกบทสนทนาแบบทั่วไป                                                        | ผู้ให้บริการต้องการการเขียน replay ใหม่เฉพาะผู้ให้บริการที่เกินกว่าตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องขั้นสุดท้ายหรือปรับรูปแบบรอบ replay ก่อน runner แบบฝังตัว                                           | การขนส่งของผู้ให้บริการต้องการการตรวจสอบรอบที่เข้มงวดยิ่งขึ้นหลังจากการทำความสะอาดแบบทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการ telemetry หรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลเริ่มทำงาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Plugin ผู้ให้บริการที่จับคู่ได้ก่อน จากนั้นจึงไล่ผ่าน Plugin ผู้ให้บริการอื่นที่รองรับ hook
จนกว่าจะมีตัวใดเปลี่ยน model id หรือ transport/config จริง วิธีนี้ช่วยให้
shim ผู้ให้บริการแบบ alias/compat ยังทำงานได้โดยไม่บังคับให้ผู้เรียกต้องรู้ว่า
Plugin ที่บันเดิลตัวใดเป็นเจ้าของการ rewrite หากไม่มี hook ของผู้ให้บริการใด rewrite
รายการ config ของตระกูล Google ที่รองรับ normalizer ของ config Google ที่บันเดิลไว้จะยังคงใช้
การล้างข้อมูลเพื่อความเข้ากันได้นั้นอยู่

หากผู้ให้บริการต้องใช้ wire protocol แบบกำหนดเองทั้งหมดหรือ request executor แบบกำหนดเอง
นั่นเป็น extension อีกประเภทหนึ่ง hook เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการ
ที่ยังทำงานบน inference loop ปกติของ OpenClaw

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

### ตัวอย่างที่มีมาให้ในตัว

Plugin ผู้ให้บริการที่บันเดิลไว้รวม hook ข้างต้นเพื่อให้เข้ากับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของผู้ขายแต่ละราย ชุด hook ที่เป็นแหล่งอ้างอิงหลักอยู่กับ
Plugin แต่ละตัวใต้ `extensions/`; หน้านี้แสดงรูปแบบแทนที่จะทำสำเนารายการ

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดง model id ต้นทาง
    ก่อน catalog แบบ static ของ OpenClaw
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลกเปลี่ยน token และการผสาน `/usage`
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    ตระกูลที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการเลือกใช้
    นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่ Plugin แต่ละตัวจะต้อง
    implement การล้างข้อมูลซ้ำเอง
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเพียง `catalog` และใช้ inference loop ร่วม
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน seam สาธารณะ
    `api.ts` / `contract-api.ts` ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK แบบ generic
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugin สามารถเข้าถึง helper หลักที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS หลักตามปกติสำหรับพื้นผิวไฟล์/voice-note
- ใช้ configuration `messages.tts` หลักและการเลือกผู้ให้บริการ
- ส่งคืน audio buffer แบบ PCM + sample rate Plugin ต้อง resample/encode สำหรับผู้ให้บริการ
- `listVoices` เป็นตัวเลือกต่อผู้ให้บริการ ใช้สำหรับ voice picker หรือ flow การตั้งค่าที่ผู้ขายเป็นเจ้าของ
- รายการ voice สามารถมี metadata ที่ละเอียดขึ้น เช่น locale, gender และ tag บุคลิกภาพ สำหรับ picker ที่รับรู้ผู้ให้บริการ
- OpenAI และ ElevenLabs รองรับ telephony ในปัจจุบัน Microsoft ไม่รองรับ

Plugin ยังสามารถลงทะเบียน speech provider ผ่าน `api.registerSpeechProvider(...)` ได้ด้วย

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

- เก็บนโยบาย TTS, fallback และการส่งมอบ reply ไว้ใน core
- ใช้ speech provider สำหรับพฤติกรรม synthesis ที่ผู้ขายเป็นเจ้าของ
- อินพุต Microsoft แบบ legacy `edge` จะถูก normalize เป็น provider id `microsoft`
- โมเดล ownership ที่แนะนำคือแบบอิงบริษัท: Plugin ผู้ขายหนึ่งตัวสามารถเป็นเจ้าของ
  ผู้ให้บริการ text, speech, image และ media ในอนาคตได้เมื่อ OpenClaw เพิ่ม
  contract ความสามารถเหล่านั้น

สำหรับการทำความเข้าใจ image/audio/video, Plugin จะลงทะเบียน
ผู้ให้บริการ media-understanding แบบ typed หนึ่งตัวแทน key/value bag แบบ generic:

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

- เก็บ orchestration, fallback, config และการเชื่อมสายของ channel ไว้ใน core
- เก็บพฤติกรรมของผู้ขายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบ additive ควรยังเป็น typed: method ตัวเลือกใหม่, field ผลลัพธ์ตัวเลือกใหม่, capability ตัวเลือกใหม่
- การสร้าง video ทำตามรูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - Plugin ผู้ขายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin ฟีเจอร์/channel ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helper ของ media-understanding, Plugin สามารถเรียก:

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

สำหรับการถอดเสียง audio, Plugin สามารถใช้ได้ทั้ง runtime ของ media-understanding
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

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวร่วมที่แนะนำสำหรับ
  การทำความเข้าใจ image/audio/video
- ใช้ configuration audio ของ media-understanding หลัก (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียงที่ถูกสร้างขึ้น (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่เป็น alias เพื่อความเข้ากันได้

Plugin ยังสามารถเริ่มการรัน subagent เบื้องหลังผ่าน `api.runtime.subagent` ได้:

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

- `provider` และ `model` เป็น override ตัวเลือกต่อการรัน ไม่ใช่การเปลี่ยนแปลง session แบบถาวร
- OpenClaw จะเคารพ field override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้เท่านั้น
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ operator ต้อง opt in ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ไว้ที่เป้าหมาย canonical `provider/model` ที่เจาะจง หรือ `"*"` เพื่ออนุญาตเป้าหมายใดก็ได้อย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่น่าเชื่อถือยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback อย่างเงียบ ๆ
- session subagent ที่ Plugin สร้างขึ้นจะถูกติด tag ด้วย id ของ Plugin ผู้สร้าง Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะ session ที่เป็นเจ้าของเหล่านั้น; การลบ session ใด ๆ ยังคงต้องใช้คำขอ Gateway ที่มี scope เป็น admin

สำหรับ web search, Plugin สามารถใช้ runtime helper ร่วมแทนการ
เข้าไปยังการเชื่อมสาย agent tool:

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

- เก็บการเลือกผู้ให้บริการ, การ resolve credential และ semantics ของ request ร่วมไว้ใน core
- ใช้ผู้ให้บริการ web-search สำหรับ transport การค้นหาเฉพาะผู้ขาย
- `api.runtime.webSearch.*` คือพื้นผิวร่วมที่แนะนำสำหรับ Plugin ฟีเจอร์/channel ที่ต้องการพฤติกรรมการค้นหาโดยไม่ต้องพึ่ง wrapper ของ agent tool

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

- `generate(...)`: สร้างรูปภาพโดยใช้ chain ผู้ให้บริการ image-generation ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการ image-generation ที่พร้อมใช้งานและความสามารถของแต่ละราย

## route HTTP ของ Gateway

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

field ของ route:

- `path`: path ของ route ใต้เซิร์ฟเวอร์ HTTP ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อกำหนดให้ต้องใช้ auth ของ gateway ตามปกติ หรือ `"plugin"` สำหรับการยืนยัน auth/webhook ที่ Plugin จัดการ
- `match`: ตัวเลือก `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ตัวเลือก อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตนเอง
- `handler`: ส่งคืน `true` เมื่อ route จัดการ request แล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกลบออกแล้วและจะทำให้เกิดข้อผิดพลาดขณะโหลด Plugin ใช้ `api.registerHttpRoute(...)` แทน
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งแบบตรงกันทุกประการของ `path + match` จะถูกปฏิเสธ เว้นแต่จะมี `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่เส้นทางของ Plugin อื่นได้
- เส้นทางที่ทับซ้อนกันและมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้ใช้ลำดับ fallthrough แบบ `exact`/`prefix` ในระดับ auth เดียวกันเท่านั้น
- เส้นทาง `auth: "plugin"` **ไม่ได้** รับขอบเขต runtime ของ operator โดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ Webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการ ไม่ใช่การเรียกตัวช่วย Gateway ที่มีสิทธิ์พิเศษ
- เส้นทาง `auth: "gateway"` ทำงานภายในขอบเขต runtime ของคำขอ Gateway แต่ขอบเขตนั้นตั้งใจให้มีความระมัดระวัง:
  - การยืนยันตัวตนแบบ bearer ด้วย shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึงขอบเขต runtime ของเส้นทาง Plugin ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes`
  - โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นั้นอย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอเส้นทาง Plugin แบบมีตัวตนเหล่านั้น ขอบเขต runtime จะย้อนกลับไปใช้ `operator.write`
- กฎเชิงปฏิบัติ: อย่าสันนิษฐานว่าเส้นทาง Plugin ที่ใช้ auth ของ Gateway เป็นพื้นผิว admin โดยนัย หากเส้นทางของคุณต้องการพฤติกรรมสำหรับ admin เท่านั้น ให้บังคับใช้โหมด auth ที่มีตัวตนและบันทึกสัญญา header `x-openclaw-scopes` อย่างชัดเจน

## พาธนำเข้า SDK ของ Plugin

ใช้พาธย่อย SDK แบบแคบแทน barrel รากแบบรวมศูนย์ `openclaw/plugin-sdk`
เมื่อเขียน Plugin ใหม่ พาธย่อยหลัก:

| พาธย่อย                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วย entry/build ของช่องทาง                        |
| `openclaw/plugin-sdk/core`          | ตัวช่วยร่วมทั่วไปและสัญญาแบบ umbrella       |
| `openclaw/plugin-sdk/config-schema` | สคีมา Zod ของราก `openclaw.json` (`OpenClawSchema`) |

Plugin ช่องทางเลือกจากกลุ่ม seam แบบแคบ — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์
ที่สัญญา `approvalCapability` หนึ่งเดียว แทนการผสมข้าม field ของ Plugin
ที่ไม่เกี่ยวข้องกัน ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ตัวช่วย runtime และ config อยู่ใต้พาธย่อย `*-runtime` ที่มุ่งเน้นตรงกัน
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ควรใช้ `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation`
แทน barrel compatibility แบบกว้าง `config-runtime`

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
และ `openclaw/plugin-sdk/infra-runtime` เป็น shim compatibility ที่เลิกแนะนำแล้วสำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควรนำเข้า primitive ทั่วไปที่แคบกว่าแทน
</Info>

จุดเข้าภายใน repo (ต่อรากแพ็กเกจ Plugin ที่บันเดิลมา):

- `index.js` — entry ของ Plugin ที่บันเดิลมา
- `api.js` — barrel ของตัวช่วย/ชนิด
- `runtime-api.js` — barrel สำหรับ runtime เท่านั้น
- `setup-entry.js` — entry ของ Plugin สำหรับ setup

Plugin ภายนอกควรนำเข้าเฉพาะพาธย่อย `openclaw/plugin-sdk/*` เท่านั้น ห้าม
นำเข้า `src/*` ของแพ็กเกจ Plugin อื่นจาก core หรือจาก Plugin อื่น
จุดเข้าที่โหลดผ่าน facade จะเลือก snapshot config ของ runtime ที่ใช้งานอยู่เมื่อมีอยู่
ก่อน แล้วจึงย้อนกลับไปใช้ไฟล์ config ที่ resolve ได้บนดิสก์

พาธย่อยเฉพาะ capability เช่น `image-generation`, `media-understanding`,
และ `speech` มีอยู่เพราะ Plugin ที่บันเดิลมาใช้พาธเหล่านี้ในปัจจุบัน พาธเหล่านี้ไม่ใช่
สัญญาภายนอกระยะยาวที่ถูกแช่แข็งโดยอัตโนมัติ — ตรวจสอบหน้าอ้างอิง SDK
ที่เกี่ยวข้องเมื่อจะพึ่งพาพาธเหล่านี้

## สคีมาของเครื่องมือข้อความ

Plugin ควรเป็นเจ้าของ contribution ของสคีมา `describeMessageTool(...)`
เฉพาะช่องทางสำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reaction, การอ่าน และ poll
การนำเสนอการส่งแบบร่วมควรใช้สัญญา `MessagePresentation` ทั่วไป
แทน field button, component, block หรือ card แบบ native ของ provider
ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การแมป provider และรายการตรวจสอบสำหรับผู้เขียน Plugin

Plugin ที่สามารถส่งได้ประกาศสิ่งที่ตน render ได้ผ่าน capability ของข้อความ:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอการส่งแบบปักหมุด

Core ตัดสินใจว่าจะ render การนำเสนอแบบ native หรือ degrade เป็นข้อความ
อย่าเปิดช่อง escape hatch ของ UI แบบ native ของ provider จากเครื่องมือข้อความทั่วไป
ตัวช่วย SDK ที่เลิกแนะนำแล้วสำหรับสคีมา native แบบ legacy ยังคง export ไว้สำหรับ
Plugin ภายนอกที่มีอยู่ แต่ Plugin ใหม่ไม่ควรใช้

## การ resolve เป้าหมายของช่องทาง

Plugin ช่องทางควรเป็นเจ้าของความหมายของเป้าหมายเฉพาะช่องทาง ให้โฮสต์
outbound ที่ใช้ร่วมกันเป็นแบบทั่วไป และใช้พื้นผิว adapter การส่งข้อความสำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินใจว่าเป้าหมายที่ normalize แล้ว
  ควรถูกถือเป็น `direct`, `group` หรือ `channel` ก่อนการค้นหา directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า
  input ควรข้ามไปยังการ resolve แบบ id-like โดยตรงแทนการค้นหา directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` เป็น fallback ของ Plugin เมื่อ
  core ต้องการการ resolve ขั้นสุดท้ายที่ provider เป็นเจ้าของหลัง normalization หรือหลังจาก
  directory ไม่พบ
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้างเส้นทาง session
  เฉพาะ provider เมื่อ resolve เป้าหมายแล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจสอบแบบ "ถือว่านี่เป็น id เป้าหมายแบบ explicit/native"
- ใช้ `resolveTarget` สำหรับ fallback การ normalization เฉพาะ provider ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- เก็บ id แบบ native ของ provider เช่น chat id, thread id, JID, handle และ room
  id ไว้ภายในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ใน field SDK
  ทั่วไป

## Directory ที่อิง config

Plugin ที่สร้าง entry ของ directory จาก config ควรเก็บ logic นั้นไว้ใน
Plugin และนำตัวช่วยร่วมจาก
`openclaw/plugin-sdk/directory-runtime` กลับมาใช้

ใช้สิ่งนี้เมื่อช่องทางต้องการ peers/groups ที่อิง config เช่น:

- peer DM ที่ขับเคลื่อนด้วย allowlist
- map ของช่องทาง/กลุ่มที่กำหนดค่าไว้
- fallback directory แบบ static ที่จำกัดตามบัญชี

ตัวช่วยร่วมใน `directory-runtime` จัดการเฉพาะการดำเนินการทั่วไป:

- การกรอง query
- การใช้ limit
- ตัวช่วย deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id เฉพาะช่องทางควรอยู่ใน
implementation ของ Plugin

## Catalog ของ provider

Plugin provider สามารถกำหนด catalog ของโมเดลสำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` ส่งคืน shape เดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับ entry ของ provider หนึ่งรายการ
- `{ providers }` สำหรับ entry ของ provider หลายรายการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ id โมเดลเฉพาะ provider, ค่าเริ่มต้นของ base URL
หรือ metadata โมเดลที่ถูกกั้นด้วย auth

`catalog.order` ควบคุมว่า catalog ของ Plugin จะ merge เมื่อใดเมื่อเทียบกับ
provider โดยนัยในตัวของ OpenClaw:

- `simple`: provider แบบ API key ธรรมดาหรือขับเคลื่อนด้วย env
- `profile`: provider ที่ปรากฏเมื่อมี auth profile
- `paired`: provider ที่ synthesize entry ของ provider ที่เกี่ยวข้องกันหลายรายการ
- `late`: pass สุดท้าย หลังจาก provider โดยนัยอื่น

provider ที่มาทีหลังจะชนะเมื่อ key collision ดังนั้น Plugin จึงสามารถตั้งใจ override
entry ของ provider ในตัวที่มี provider id เดียวกันได้

Compatibility:

- `discovery` ยังทำงานเป็น alias แบบ legacy
- หากลงทะเบียนทั้ง `catalog` และ `discovery` ไว้ OpenClaw จะใช้ `catalog`

## การตรวจสอบช่องทางแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนช่องทาง ควร implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` เป็นพาธ runtime อนุญาตให้สันนิษฐานว่า credential
  ถูก materialize อย่างครบถ้วนแล้ว และสามารถ fail fast เมื่อไม่มี secret ที่จำเป็น
- พาธคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flow การ repair
  doctor/config ไม่ควรต้อง materialize credential ของ runtime เพียงเพื่อ
  อธิบาย configuration

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- ส่งคืนเฉพาะสถานะบัญชีเชิงอธิบาย
- รักษา `enabled` และ `configured`
- รวม field แหล่งที่มา/สถานะของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องส่งคืนค่า token ดิบเพียงเพื่อรายงานความพร้อมใช้งาน
  แบบอ่านอย่างเดียว การส่งคืน `tokenStatus: "available"` (และ field แหล่งที่มา
  ที่ตรงกัน) ก็เพียงพอสำหรับคำสั่งแบบ status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน

สิ่งนี้ทำให้คำสั่งแบบอ่านอย่างเดียวรายงานว่า "กำหนดค่าแล้วแต่ไม่พร้อมใช้งานในพาธคำสั่งนี้"
แทนการ crash หรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## แพ็กแพ็กเกจ

directory ของ Plugin อาจรวม `package.json` ที่มี `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หากแพ็กระบุ extensions หลายรายการ id ของ Plugin
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณนำเข้า npm deps ให้ติดตั้งไว้ใน directory นั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

แนวป้องกันด้านความปลอดภัย: entry ทุกตัวของ `openclaw.extensions` ต้องอยู่ภายใน directory ของ Plugin
หลังจาก resolve symlink แล้ว entry ที่หลุดออกจาก directory ของแพ็กเกจจะ
ถูกปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependency ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบ project-local (ไม่มี lifecycle script,
ไม่มี dev dependency ตอน runtime) โดยไม่สนใจการตั้งค่า npm install ส่วนกลางที่สืบทอดมา
ให้ dependency tree ของ Plugin เป็น "JS/TS ล้วน" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้
build แบบ `postinstall`

ไม่บังคับ: `openclaw.setupEntry` สามารถชี้ไปยังโมดูล setup-only น้ำหนักเบาได้
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ Plugin ช่องทางที่ปิดใช้งานอยู่ หรือ
เมื่อ Plugin ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า OpenClaw จะโหลด `setupEntry`
แทน entry เต็มของ Plugin สิ่งนี้ทำให้ startup และ setup เบาลง
เมื่อ entry หลักของ Plugin ของคุณยังเชื่อมเครื่องมือ, hook หรือโค้ดอื่น
ที่ใช้เฉพาะ runtime ด้วย

ไม่บังคับ: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถ opt-in ให้ Plugin ช่องทางใช้พาธ `setupEntry` เดียวกันในช่วง startup ก่อน listen
ของ gateway ได้ แม้ว่าช่องทางจะกำหนดค่าไว้แล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ที่ต้องมีอยู่
ก่อน gateway เริ่ม listen อย่างครบถ้วน ในทางปฏิบัติ หมายความว่า entry สำหรับ setup
ต้องลงทะเบียน capability ทุกอย่างที่ช่องทางเป็นเจ้าของและ startup พึ่งพา เช่น:

- การลงทะเบียนช่องทางเอง
- เส้นทาง HTTP ใด ๆ ที่ต้องพร้อมใช้งานก่อน gateway เริ่ม listen
- method, เครื่องมือ หรือ service ใด ๆ ของ gateway ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก entry เต็มของคุณยังเป็นเจ้าของ capability ที่จำเป็นต่อ startup ใด ๆ อย่าเปิดใช้
flag นี้ ให้ Plugin ใช้พฤติกรรมเริ่มต้น และให้ OpenClaw โหลด
entry เต็มระหว่าง startup

ช่องทางที่บันเดิลมายังสามารถเผยแพร่ตัวช่วยพื้นผิวสัญญาแบบ setup-only ที่ core
สามารถ consult ได้ก่อนโหลด runtime เต็มของช่องทาง พื้นผิวการ promote setup
ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core ใช้พื้นผิวนี้เมื่อต้องเลื่อนระดับการกำหนดค่าช่องทางแบบบัญชีเดียวเดิม
ไปเป็น `channels.<id>.accounts.*` โดยไม่โหลดรายการ Plugin แบบเต็ม
Matrix เป็นตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: มันย้ายเฉพาะคีย์ auth/bootstrap เข้าไปใน
บัญชีที่มีชื่อซึ่งถูกเลื่อนระดับเมื่อมีบัญชีที่มีชื่ออยู่แล้ว และสามารถคงคีย์
บัญชีเริ่มต้นที่กำหนดค่าไว้ซึ่งไม่ใช่ค่าตามแบบแผน แทนที่จะสร้าง
`accounts.default` เสมอได้

อะแดปเตอร์แพตช์การตั้งค่าเหล่านั้นทำให้การค้นพบพื้นผิวสัญญาที่บันเดิลไว้ยังคงเป็นแบบ lazy เวลา
import ยังเบาอยู่ พื้นผิวการเลื่อนระดับจะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะ
ย้อนกลับเข้าไปเริ่มต้นช่องทางที่บันเดิลไว้ในตอน import โมดูล

เมื่อพื้นผิวเริ่มต้นเหล่านั้นรวมเมธอด RPC ของ Gateway ไว้ ให้คงไว้บนพรีฟิกซ์
เฉพาะ Plugin เนมสเปซผู้ดูแลของ Core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้ และจะแก้ค่า
เป็น `operator.admin` เสมอ แม้ Plugin จะขอขอบเขตที่แคบกว่าก็ตาม

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

### เมตาดาตาแคตตาล็อกช่องทาง

Plugin ช่องทางสามารถประกาศเมตาดาตาสำหรับการตั้งค่า/การค้นพบผ่าน `openclaw.channel` และ
คำใบ้การติดตั้งผ่าน `openclaw.install` ได้ วิธีนี้ทำให้แคตตาล็อกของ Core ไม่ต้องบรรจุข้อมูล

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
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความสำหรับพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายช่องทางว่ารองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการช่องทางที่กำหนดค่าไว้เมื่อตั้งเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบเมื่อตั้งเป็น `false`
- `exposure.docs`: ทำเครื่องหมายช่องทางว่าเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: นามแฝงเดิมที่ยังยอมรับเพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้ช่องทางเข้าร่วมโฟลว์ `allowFrom` ของ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ผูกบัญชีอย่างชัดเจนแม้จะมีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับการค้นหาเซสชันเมื่อแก้ค่าเป้าหมายการประกาศ

OpenClaw ยังสามารถผสาน **แคตตาล็อกช่องทางภายนอก** ได้ด้วย (ตัวอย่างเช่น การส่งออกรีจิสทรี MPM)
วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วยจุลภาค/อัฒภาค/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` ตัวแยกวิเคราะห์ยังยอมรับ `"packages"` หรือ `"plugins"` เป็นนามแฝงเดิมสำหรับคีย์ `"entries"` ด้วย

รายการแคตตาล็อกช่องทางที่สร้างขึ้นและรายการแคตตาล็อกการติดตั้งผู้ให้บริการจะเปิดเผย
ข้อเท็จจริงแหล่งติดตั้งที่ทำให้เป็นมาตรฐานแล้วไว้ข้างบล็อก `openclaw.install` ดิบ
ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะระบุว่า npm spec เป็นเวอร์ชันที่แน่นอนหรือตัวเลือกแบบลอยตัว
มีเมตาดาตา integrity ที่คาดไว้หรือไม่ และมีเส้นทางแหล่งที่มาแบบ local
พร้อมใช้งานด้วยหรือไม่ เมื่อทราบตัวตนของแคตตาล็อก/แพ็กเกจ
ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะเตือนหากชื่อแพ็กเกจ npm ที่แยกวิเคราะห์ได้เบี่ยงจากตัวตนนั้น
นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่มา
ที่ไม่พร้อมใช้งาน และเมื่อมีเมตาดาตา integrity ของ npm โดยไม่มีแหล่งที่มา npm
ที่ถูกต้อง ผู้ใช้ควรถือว่า `installSource` เป็นฟิลด์เสริมแบบเพิ่มเข้ามา เพื่อให้
รายการที่สร้างด้วยมือและ shim แคตตาล็อกไม่จำเป็นต้องสังเคราะห์มันขึ้นมา
สิ่งนี้ช่วยให้การ onboarding และการวินิจฉัยอธิบายสถานะระนาบแหล่งที่มาได้โดยไม่ต้อง
import รันไทม์ของ Plugin

รายการ npm ภายนอกที่เป็นทางการควรใช้ `npmSpec` แบบแน่นอนพร้อม
`expectedIntegrity` เป็นหลัก ชื่อแพ็กเกจเปล่า ๆ และ dist-tags ยังทำงานได้เพื่อ
ความเข้ากันได้ แต่จะแสดงคำเตือนของระนาบแหล่งที่มา เพื่อให้แคตตาล็อกขยับไปสู่
การติดตั้งแบบตรึงเวอร์ชันและตรวจสอบ integrity ได้โดยไม่ทำให้ Plugin ที่มีอยู่เสียหาย
เมื่อ onboarding ติดตั้งจากเส้นทางแคตตาล็อก local ระบบจะบันทึกรายการดัชนี Plugin
Plugin ที่จัดการแล้วด้วย `source: "path"` และ `sourcePath` ที่สัมพัทธ์กับ workspace
เมื่อทำได้ เส้นทางโหลดเชิงปฏิบัติการแบบสัมบูรณ์ยังคงอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งหลีกเลี่ยงการทำซ้ำเส้นทางเวิร์กสเตชัน local
ลงในการกำหนดค่าระยะยาว วิธีนี้ทำให้การติดตั้งเพื่อพัฒนาแบบ local มองเห็นได้ต่อ
การวินิจฉัยระนาบแหล่งที่มา โดยไม่เพิ่มพื้นผิวเปิดเผยเส้นทางระบบไฟล์ดิบอีกชั้น
ดัชนี Plugin `plugins/installs.json` ที่คงอยู่เป็นแหล่งความจริงของการติดตั้ง
และสามารถรีเฟรชได้โดยไม่โหลดโมดูลรันไทม์ของ Plugin
แมป `installRecords` ของมันคงทนแม้เมื่อ manifest ของ Plugin หายไปหรือ
ไม่ถูกต้อง; อาร์เรย์ `plugins` ของมันเป็นมุมมอง manifest ที่สร้างใหม่ได้

## Plugin เครื่องยนต์บริบท

Plugin เครื่องยนต์บริบทเป็นเจ้าของการประสานบริบทเซสชันสำหรับการนำเข้า การประกอบ
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือกเครื่องยนต์ที่ใช้งานอยู่ด้วย
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

`ctx` ของ factory เปิดเผยค่า `config`, `agentDir`, และ `workspaceDir`
แบบเลือกได้สำหรับการเริ่มต้นในช่วงก่อสร้าง

หากเครื่องยนต์ของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คงการ
implement `compact()` ไว้และมอบหมายอย่างชัดเจน:

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

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าเลี่ยง
ระบบ Plugin ด้วยการเอื้อมเข้าไปใช้ส่วนส่วนตัว ให้เพิ่มความสามารถที่ขาดหายไป

ลำดับที่แนะนำ:

1. กำหนดสัญญาของ Core
   ตัดสินใจว่าพฤติกรรมร่วมใดที่ Core ควรเป็นเจ้าของ: นโยบาย fallback การผสาน config
   lifecycle ความหมายที่หันหน้าไปยังช่องทาง และรูปทรงของ helper รันไทม์
2. เพิ่มพื้นผิวการลงทะเบียน/รันไทม์ของ Plugin แบบ typed
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิวความสามารถ
   แบบ typed ที่เล็กที่สุดและมีประโยชน์
3. เชื่อม Core + ผู้บริโภคช่องทาง/ฟีเจอร์
   ช่องทางและ Plugin ฟีเจอร์ควรบริโภคความสามารถใหม่ผ่าน Core
   ไม่ใช่ด้วยการ import การ implement ของ vendor โดยตรง
4. ลงทะเบียนการ implement ของ vendor
   จากนั้น Plugin ของ vendor จะลงทะเบียน backend ของตนกับความสามารถ
5. เพิ่มความครอบคลุมของสัญญา
   เพิ่มการทดสอบเพื่อให้ความเป็นเจ้าของและรูปทรงการลงทะเบียนยังชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงจุดยืนของตัวเองโดยไม่ถูก hardcode เข้ากับโลกทัศน์ของ
ผู้ให้บริการรายเดียว ดู [คู่มือตำรา Capability](/th/plugins/architecture)
สำหรับเช็กลิสต์ไฟล์ที่เป็นรูปธรรมและตัวอย่างที่ทำไว้ครบ

### เช็กลิสต์ Capability

เมื่อคุณเพิ่มความสามารถใหม่ โดยปกติการ implement ควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- ประเภทสัญญาของ Core ใน `src/<capability>/types.ts`
- runner/helper รันไทม์ของ Core ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน Plugin API ใน `src/plugins/types.ts`
- การเชื่อม registry ของ Plugin ใน `src/plugins/registry.ts`
- การเปิดเผยรันไทม์ของ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/ช่องทาง
  จำเป็นต้องบริโภคมัน
- helper สำหรับ capture/test ใน `src/test-utils/plugin-registration.ts`
- assertion ด้านความเป็นเจ้าของ/สัญญาใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับผู้ปฏิบัติการ/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป มักเป็นสัญญาณว่าความสามารถนั้นยัง
ไม่ได้ผสานรวมครบถ้วน

### เทมเพลต Capability

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

รูปแบบการทดสอบสัญญา:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

สิ่งนี้ทำให้กฎเรียบง่าย:

- Core เป็นเจ้าของสัญญาความสามารถ + การประสานงาน
- Plugin ของ vendor เป็นเจ้าของการ implement ของ vendor
- Plugin ฟีเจอร์/ช่องทางบริโภค helper รันไทม์
- การทดสอบสัญญาคงความเป็นเจ้าของให้ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรงความสามารถสาธารณะ
- [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
