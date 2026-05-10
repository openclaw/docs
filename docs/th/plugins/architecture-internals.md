---
read_when:
    - การนำฮุกของรันไทม์ผู้ให้บริการ วงจรชีวิตของช่องทาง หรือชุดแพ็กเกจไปใช้งาน
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถของ Plugin ใหม่หรือ Plugin เอนจินบริบทใหม่
summary: 'รายละเอียดภายในสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, รีจิสทรี, ฮุกขณะรันไทม์, เส้นทาง HTTP และตารางอ้างอิง'
title: รายละเอียดภายในสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบของ plugin และสัญญาความเป็นเจ้าของ/การดำเนินการ โปรดดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้คือเอกสารอ้างอิงสำหรับกลไกภายใน: ไปป์ไลน์การโหลด, registry, runtime hooks, เส้นทาง HTTP ของ Gateway, import paths และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มทำงาน OpenClaw จะทำโดยคร่าว ๆ ดังนี้:

1. ค้นหา root ของ plugin ที่เป็นตัวเลือก
2. อ่าน manifest ของ bundle แบบ native หรือแบบ compatible และ metadata ของ package
3. ปฏิเสธตัวเลือกที่ไม่ปลอดภัย
4. normalize config ของ plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจการเปิดใช้งานสำหรับแต่ละตัวเลือก
6. โหลด native modules ที่เปิดใช้งาน: bundled modules ที่ build แล้วใช้ native loader;
   third-party local source TypeScript ใช้ Jiti fallback ฉุกเฉิน
7. เรียก native `register(api)` hooks และรวบรวม registrations เข้าไปใน plugin registry
8. เปิดเผย registry ให้กับคำสั่ง/พื้นผิว runtime

<Note>
`activate` เป็น alias แบบ legacy ของ `register` — loader จะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกใช้ที่จุดเดียวกัน bundled plugins ทั้งหมดใช้ `register`; ควรใช้ `register` สำหรับ plugin ใหม่
</Note>

safety gates เกิดขึ้น **ก่อน** การดำเนินการ runtime ตัวเลือกจะถูกบล็อก
เมื่อ entry หลุดออกจาก plugin root, path เป็น world-writable หรือ ownership
ของ path ดูน่าสงสัยสำหรับ plugins ที่ไม่ใช่ bundled

ตัวเลือกที่ถูกบล็อกยังคงผูกกับ plugin id ของตัวเองเพื่อ diagnostics หาก config
ยังอ้างอิง id นั้น validation จะรายงานว่า plugin มีอยู่แต่ถูกบล็อก
และชี้กลับไปยังคำเตือน path-safety แทนที่จะถือว่า config entry
ล้าสมัย

### พฤติกรรมที่ยึด Manifest เป็นหลัก

manifest คือแหล่งความจริงของ control-plane OpenClaw ใช้ manifest เพื่อ:

- ระบุ plugin
- ค้นหา channels/skills/config schema ที่ประกาศไว้ หรือ bundle capabilities
- validate `plugins.entries.<id>.config`
- เพิ่ม labels/placeholders ให้ Control UI
- แสดง metadata สำหรับ install/catalog
- เก็บ activation และ setup descriptors แบบต้นทุนต่ำโดยไม่ต้องโหลด plugin runtime

สำหรับ native plugins, runtime module คือส่วน data-plane โดยจะ register
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` ที่เป็น optional ใน manifest จะอยู่บน control plane
บล็อกเหล่านี้เป็น descriptors แบบ metadata-only สำหรับ activation planning และ setup discovery;
ไม่ได้แทนที่ runtime registration, `register(...)` หรือ `setupEntry`
ผู้ใช้งาน live activation กลุ่มแรกตอนนี้ใช้ hints ของ manifest command, channel และ provider
เพื่อจำกัดการโหลด plugin ก่อนการ materialize registry ที่กว้างกว่า:

- การโหลด CLI จำกัดเฉพาะ plugins ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การ resolve channel setup/plugin จำกัดเฉพาะ plugins ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve explicit provider setup/runtime จำกัดเฉพาะ plugins ที่เป็นเจ้าของ
  provider id ที่ร้องขอ
- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับ startup
  imports และ startup opt-outs แบบ explicit; plugins ที่ไม่มี startup metadata จะโหลดเฉพาะ
  ผ่าน activation triggers ที่แคบกว่า

runtime preloads ระหว่าง request ที่ขอ broad `all` scope ยังคง derive
ชุด effective plugin id แบบ explicit จาก config, startup planning, channels
ที่ configure ไว้, slots และ auto-enable rules หากชุดที่ derive มานั้นว่าง OpenClaw
จะโหลด runtime registry ว่างแทนที่จะขยายไปยัง plugin ที่ค้นพบได้ทุกตัว

activation planner เปิดเผยทั้ง API แบบ ids-only สำหรับ callers เดิม และ
plan API สำหรับ diagnostics ใหม่ plan entries รายงานว่าทำไม plugin จึงถูกเลือก
โดยแยก hints ของ planner แบบ explicit `activation.*` ออกจาก manifest ownership
fallback เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks การแยกเหตุผลนี้คือ compatibility boundary:
metadata ของ plugin เดิมยังทำงานต่อไป ขณะที่โค้ดใหม่สามารถตรวจจับ broad hints
หรือ fallback behavior ได้โดยไม่เปลี่ยน runtime loading semantics

ตอนนี้ setup discovery จะเลือก ids ที่ descriptor เป็นเจ้าของก่อน เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด candidate plugins ก่อน fallback ไปยัง
`setup-api` สำหรับ plugins ที่ยังต้องใช้ runtime hooks ระหว่าง setup รายการ
provider setup ใช้ manifest `providerAuthChoices`, setup choices ที่ derive จาก descriptor
และ install-catalog metadata โดยไม่โหลด provider runtime ค่า explicit
`setup.requiresRuntime: false` เป็น cutoff แบบ descriptor-only; หากละเว้น
`requiresRuntime` จะคง legacy setup-api fallback เพื่อ compatibility หาก plugin
ที่ค้นพบมากกว่าหนึ่งตัว claim setup provider หรือ CLI backend id เดียวกันหลัง normalize
setup lookup จะปฏิเสธ owner ที่คลุมเครือแทนการพึ่งพาลำดับ discovery
เมื่อ setup runtime ทำงานจริง registry diagnostics จะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ providers หรือ CLI
backends ที่ register โดย setup-api โดยไม่บล็อก legacy plugins

### ขอบเขต cache ของ Plugin

OpenClaw ไม่ cache ผลลัพธ์ plugin discovery หรือ direct manifest registry
data ไว้หลังหน้าต่างเวลา wall-clock การติดตั้ง การแก้ไข manifest และการเปลี่ยน load-path
ต้องมองเห็นได้ในการอ่าน metadata แบบ explicit ครั้งถัดไป หรือการ rebuild snapshot ครั้งถัดไป
parser ของไฟล์ manifest อาจเก็บ cache แบบจำกัดตาม file-signature ที่ keyed ด้วย
path ของ manifest ที่เปิด, inode, size และ timestamps; cache นั้นมีไว้เพียงเพื่อหลีกเลี่ยง
การ parse bytes ที่ไม่เปลี่ยนซ้ำ และต้องไม่ cache คำตอบด้าน discovery, registry, owner หรือ
policy

fast path ของ metadata ที่ปลอดภัยคือ object ownership แบบ explicit ไม่ใช่ cache ที่ซ่อนอยู่
hot paths สำหรับ startup ของ Gateway ควรส่ง `PluginMetadataSnapshot` ปัจจุบัน,
`PluginLookUpTable` ที่ derive มา หรือ manifest registry แบบ explicit ผ่าน call chain
Config validation, startup auto-enable, plugin bootstrap และ provider
selection สามารถ reuse objects เหล่านั้นได้ตราบเท่าที่มันแทน config และ
plugin inventory ปัจจุบัน setup lookup ยังคง reconstruct manifest metadata ตามต้องการ
เว้นแต่ setup path เฉพาะจะได้รับ manifest registry แบบ explicit; ให้คงไว้
เป็น cold-path fallback แทนการเพิ่ม hidden lookup caches เมื่อ input
เปลี่ยน ให้ rebuild และ replace snapshot แทนการ mutate หรือเก็บ
historical copies
views เหนือ active plugin registry และ bundled channel bootstrap helpers
ควร recompute จาก registry/root ปัจจุบัน short-lived maps ใช้ได้
ภายในหนึ่ง call เพื่อ dedupe งานหรือ guard reentry; แต่ต้องไม่กลายเป็น process
metadata caches

สำหรับการโหลด plugin ชั้น cache ถาวรคือ runtime loading มันอาจ reuse
loader state เมื่อ code หรือ installed artifacts ถูกโหลดจริง เช่น:

- `PluginLoaderCacheState` และ compatible active runtime registries
- jiti/module caches และ public-surface loader caches ที่ใช้เพื่อหลีกเลี่ยงการ import
  runtime surface เดิมซ้ำ ๆ
- filesystem caches สำหรับ installed plugin artifacts
- short-lived per-call maps สำหรับ path normalization หรือ duplicate resolution

cache เหล่านั้นเป็นรายละเอียด implementation ของ data-plane และต้องไม่ตอบ
คำถามของ control-plane เช่น "plugin ไหนเป็นเจ้าของ provider นี้?" เว้นแต่
caller จะขอ runtime loading โดยเจตนา

อย่าเพิ่ม persistent หรือ wall-clock caches สำหรับ:

- ผลลัพธ์ discovery
- direct manifest registries
- manifest registries ที่ reconstruct จาก installed plugin index
- provider owner lookup, model suppression, provider policy หรือ public-artifact
  metadata
- คำตอบอื่นใดที่ derive จาก manifest ซึ่ง manifest, installed index
  หรือ load path ที่เปลี่ยนไปควรมองเห็นได้ในการอ่าน metadata ครั้งถัดไป

callers ที่ rebuild manifest metadata จาก persisted installed plugin
index จะ reconstruct registry นั้นตามต้องการ installed index เป็น durable
source-plane state; ไม่ใช่ hidden in-process metadata cache

## โมเดล Registry

plugins ที่โหลดแล้วไม่ได้ mutate core globals แบบสุ่มโดยตรง แต่จะ register เข้าไปใน
central plugin registry

registry ติดตาม:

- plugin records (identity, source, origin, status, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands ที่ plugin เป็นเจ้าของ

จากนั้น core features จะอ่านจาก registry นั้นแทนการคุยกับ plugin modules
โดยตรง สิ่งนี้ทำให้การโหลดเป็นทิศทางเดียว:

- plugin module -> registry registration
- core runtime -> registry consumption

การแยกนี้สำคัญต่อ maintainability หมายความว่า core surfaces ส่วนใหญ่ต้องการ
integration point เพียงจุดเดียว: "อ่าน registry" ไม่ใช่ "special-case plugin
module ทุกตัว"

## callbacks สำหรับการผูก conversation

plugins ที่ bind conversation สามารถตอบสนองเมื่อ approval ได้รับการ resolve แล้ว

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจาก bind
request ได้รับการอนุมัติหรือปฏิเสธ:

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

fields ของ callback payload:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับ requests ที่ได้รับอนุมัติ
- `request`: สรุป request เดิม, detach hint, sender id และ
  conversation metadata

callback นี้เป็นการแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind
conversation และจะทำงานหลังจาก core approval handling เสร็จสิ้น

## runtime hooks ของ Provider

provider plugins มีสามชั้น:

- **Manifest metadata** สำหรับ lookup ก่อน runtime แบบต้นทุนต่ำ:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **Config-time hooks**: `catalog` (legacy `discovery`) รวมถึง
  `applyConfigDefaults`
- **Runtime hooks**: optional hooks มากกว่า 40 รายการ ครอบคลุม auth, model resolution,
  stream wrapping, thinking levels, replay policy และ usage endpoints ดู
  รายการทั้งหมดใต้ [ลำดับ Hook และการใช้งาน](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ agent loop, failover, transcript handling และ
tool policy แบบ generic hooks เหล่านี้คือ extension surface สำหรับพฤติกรรมเฉพาะ
provider โดยไม่ต้องมี inference transport แบบกำหนดเองทั้งหมด

ใช้ manifest `setup.providers[].envVars` เมื่อ provider มี credentials ที่อิง env
ซึ่ง generic auth/status/model-picker paths ควรมองเห็นโดยไม่ต้องโหลด plugin runtime
`providerAuthEnvVars` ที่ deprecated แล้วยังคงถูกอ่านโดย compatibility adapter
ระหว่างช่วง deprecation window และ non-bundled plugins
ที่ใช้มันจะได้รับ manifest diagnostic ใช้ manifest `providerAuthAliases`
เมื่อ provider id หนึ่งควร reuse env vars, auth profiles,
config-backed auth และ API-key onboarding choice ของ provider id อื่น ใช้ manifest
`providerAuthChoices` เมื่อ onboarding/auth-choice CLI surfaces ควรรู้
choice id ของ provider, group labels และ simple one-flag auth wiring โดยไม่ต้อง
โหลด provider runtime คง provider runtime
`envVars` ไว้สำหรับ hints ที่ operator เห็น เช่น onboarding labels หรือ OAuth
client-id/client-secret setup vars

ใช้ manifest `channelEnvVars` เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่ง
generic shell-env fallback, config/status checks หรือ setup prompts ควรมองเห็น
โดยไม่ต้องโหลด channel runtime

### ลำดับ Hook และการใช้งาน

สำหรับ model/provider plugins, OpenClaw จะเรียก hooks ตามลำดับคร่าว ๆ นี้
คอลัมน์ "เมื่อใดควรใช้" คือคู่มือตัดสินใจแบบรวดเร็ว
fields ของ provider แบบ compatibility-only ที่ OpenClaw ไม่เรียกใช้อีกแล้ว เช่น
`ProviderPlugin.capabilities` และ `suppressBuiltInModel` จะไม่ถูกระบุไว้
ที่นี่โดยเจตนา

| #   | Hook                              | สิ่งที่ทำ                                                                                                   | ควรใช้เมื่อ                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่การกำหนดค่าผู้ให้บริการเข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                                | ผู้ให้บริการเป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ URL ฐาน                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นการกำหนดค่าส่วนกลางที่ผู้ให้บริการเป็นเจ้าของระหว่างการทำให้การกำหนดค่าเป็นรูปธรรม                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมดการยืนยันตัวตน, env หรือความหมายเชิงโมเดลแฟมิลีของผู้ให้บริการ                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw ลองเส้นทางรีจิสทรี/แค็ตตาล็อกปกติก่อน                                                          | _(ไม่ใช่ Hook ของ Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | ทำให้นามแฝง model-id แบบเก่าหรือพรีวิวเป็นมาตรฐานก่อนค้นหา                                                     | ผู้ให้บริการเป็นเจ้าของการล้างนามแฝงก่อนการแก้ไขโมเดลเชิงมาตรฐาน                                                                                 |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของแฟมิลีผู้ให้บริการเป็นมาตรฐานก่อนการประกอบโมเดลทั่วไป                                      | ผู้ให้บริการเป็นเจ้าของการล้างทรานสปอร์ตสำหรับรหัสผู้ให้บริการแบบกำหนดเองในแฟมิลีทรานสปอร์ตเดียวกัน                                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อนการแก้ไขรันไทม์/ผู้ให้บริการ                                           | ผู้ให้บริการต้องการการล้างการกำหนดค่าที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google ที่บันเดิลมายังช่วยรองรับรายการการกำหนดค่า Google ที่สนับสนุน   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียนซ้ำความเข้ากันได้ของการใช้งานสตรีมมิงแบบเนทีฟกับผู้ให้บริการการกำหนดค่า                                               | ผู้ให้บริการต้องการการแก้ไขเมทาดาทาการใช้งานสตรีมมิงแบบเนทีฟที่ขับเคลื่อนด้วยเอนด์พอยต์                                                                          |
| 7   | `resolveConfigApiKey`             | แก้ไขการยืนยันตัวตนแบบเครื่องหมาย env สำหรับผู้ให้บริการการกำหนดค่าก่อนโหลดการยืนยันตัวตนของรันไทม์                                       | ผู้ให้บริการมีการแก้ไขคีย์ API แบบเครื่องหมาย env ที่ผู้ให้บริการเป็นเจ้าของ; `amazon-bedrock` ยังมีตัวแก้ไขเครื่องหมาย env ของ AWS ในตัวที่นี่                  |
| 8   | `resolveSyntheticAuth`            | แสดงการยืนยันตัวตนแบบโลคัล/โฮสต์เองหรือที่มีการกำหนดค่ารองรับ โดยไม่คงข้อความธรรมดาไว้                                   | ผู้ให้บริการสามารถทำงานด้วยเครื่องหมายข้อมูลประจำตัวแบบสังเคราะห์/โลคัล                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับโปรไฟล์การยืนยันตัวตนภายนอกที่ผู้ให้บริการเป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับข้อมูลประจำตัวที่ CLI/แอปเป็นเจ้าของ | ผู้ให้บริการใช้ข้อมูลประจำตัวการยืนยันตัวตนภายนอกซ้ำโดยไม่คงโทเค็นรีเฟรชที่คัดลอกไว้; ประกาศ `contracts.externalAuthProviders` ในแมนิเฟสต์ |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับตัวแทนโปรไฟล์สังเคราะห์ที่จัดเก็บไว้ให้อยู่หลังการยืนยันตัวตนที่มี env/การกำหนดค่ารองรับ                                      | ผู้ให้บริการจัดเก็บโปรไฟล์ตัวแทนสังเคราะห์ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | กลไกสำรองแบบซิงก์สำหรับรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของและยังไม่มีในรีจิสทรีโลคัล                                       | ผู้ให้บริการยอมรับรหัสโมเดลอัปสตรีมใดก็ได้                                                                                                 |
| 12  | `prepareDynamicModel`             | วอร์มอัปแบบอะซิงก์ จากนั้น `resolveDynamicModel` จะทำงานอีกครั้ง                                                           | ผู้ให้บริการต้องการเมทาดาทาเครือข่ายก่อนแก้ไขรหัสที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | เขียนซ้ำครั้งสุดท้ายก่อนที่รันเนอร์แบบฝังจะใช้โมเดลที่แก้ไขแล้ว                                               | ผู้ให้บริการต้องการการเขียนซ้ำทรานสปอร์ต แต่ยังใช้ทรานสปอร์ตหลัก                                                                             |
| 14  | `contributeResolvedModelCompat`   | สนับสนุนแฟล็กความเข้ากันได้สำหรับโมเดลผู้ขายที่อยู่หลังทรานสปอร์ตอื่นที่เข้ากันได้                                  | ผู้ให้บริการจดจำโมเดลของตนเองบนทรานสปอร์ตพร็อกซีโดยไม่เข้าควบคุมผู้ให้บริการ                                                       |
| 15  | `normalizeToolSchemas`            | ทำให้สคีมาเครื่องมือเป็นมาตรฐานก่อนที่รันเนอร์แบบฝังจะเห็น                                                    | ผู้ให้บริการต้องการการล้างสคีมาของแฟมิลีทรานสปอร์ต                                                                                                |
| 16  | `inspectToolSchemas`              | แสดงการวินิจฉัยสคีมาที่ผู้ให้บริการเป็นเจ้าของหลังการทำให้เป็นมาตรฐาน                                                  | ผู้ให้บริการต้องการคำเตือนคีย์เวิร์ดโดยไม่สอนกฎเฉพาะผู้ให้บริการให้คอร์                                                                 |
| 17  | `resolveReasoningOutputMode`      | เลือกสัญญาเอาต์พุตการให้เหตุผลแบบเนทีฟเทียบกับแบบติดแท็ก                                                              | ผู้ให้บริการต้องการการให้เหตุผล/เอาต์พุตสุดท้ายแบบติดแท็กแทนฟิลด์เนทีฟ                                                                         |
| 18  | `prepareExtraParams`              | ทำให้พารามิเตอร์คำขอเป็นมาตรฐานก่อนตัวห่อหุ้มตัวเลือกสตรีมทั่วไป                                              | ผู้ให้บริการต้องการพารามิเตอร์คำขอเริ่มต้นหรือการล้างพารามิเตอร์รายผู้ให้บริการ                                                                           |
| 19  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วยทรานสปอร์ตแบบกำหนดเอง                                                   | ผู้ให้บริการต้องการโปรโตคอลสายสื่อสารแบบกำหนดเอง ไม่ใช่แค่ตัวห่อหุ้ม                                                                                     |
| 20  | `wrapStreamFn`                    | ตัวห่อหุ้มสตรีมหลังจากใช้ตัวห่อหุ้มทั่วไปแล้ว                                                              | ผู้ให้บริการต้องการตัวห่อหุ้มความเข้ากันได้ของเฮดเดอร์/บอดี/โมเดลของคำขอโดยไม่มีทรานสปอร์ตแบบกำหนดเอง                                                          |
| 21  | `resolveTransportTurnState`       | แนบเฮดเดอร์หรือเมทาดาทาทรานสปอร์ตต่อเทิร์นแบบเนทีฟ                                                           | ผู้ให้บริการต้องการให้ทรานสปอร์ตทั่วไปส่งอัตลักษณ์เทิร์นแบบเนทีฟของผู้ให้บริการ                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | แนบเฮดเดอร์ WebSocket แบบเนทีฟหรือนโยบายช่วงพักเซสชัน                                                    | ผู้ให้บริการต้องการให้ทรานสปอร์ต WS ทั่วไปปรับเฮดเดอร์เซสชันหรือนโยบายสำรอง                                                               |
| 23  | `formatApiKey`                    | ตัวจัดรูปแบบโปรไฟล์การยืนยันตัวตน: โปรไฟล์ที่จัดเก็บไว้กลายเป็นสตริง `apiKey` ของรันไทม์                                     | ผู้ให้บริการจัดเก็บเมทาดาทาการยืนยันตัวตนเพิ่มเติมและต้องการรูปทรงโทเค็นรันไทม์แบบกำหนดเอง                                                                    |
| 24  | `refreshOAuth`                    | การแทนที่การรีเฟรช OAuth สำหรับเอนด์พอยต์รีเฟรชแบบกำหนดเองหรือนโยบายเมื่อรีเฟรชล้มเหลว                                  | ผู้ให้บริการไม่เข้ากับตัวรีเฟรช `pi-ai` ที่ใช้ร่วมกัน                                                                                           |
| 25  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมที่ต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                                  | ผู้ให้บริการต้องการคำแนะนำการซ่อมการยืนยันตัวตนที่ผู้ให้บริการเป็นเจ้าของหลังรีเฟรชล้มเหลว                                                                      |
| 26  | `matchesContextOverflowError`     | ตัวจับคู่หน้าต่างบริบทล้นที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการมีข้อผิดพลาดล้นดิบที่ฮิวริสติกทั่วไปจะพลาด                                                                                |
| 27  | `classifyFailoverReason`          | การจัดประเภทเหตุผลเฟลโอเวอร์ที่ผู้ให้บริการเป็นเจ้าของ                                                                  | ผู้ให้บริการสามารถแมปข้อผิดพลาด API/ทรานสปอร์ตดิบไปเป็น rate-limit/overload/ฯลฯ                                                                          |
| 28  | `isCacheTtlEligible`              | นโยบายแคชพรอมป์สำหรับผู้ให้บริการพร็อกซี/แบ็กฮอล                                                               | ผู้ให้บริการต้องการการควบคุม TTL ของแคชเฉพาะพร็อกซี                                                                                                |
| 29  | `buildMissingAuthMessage`         | ข้อความแทนที่สำหรับข้อความกู้คืนเมื่อขาดการยืนยันตัวตนแบบทั่วไป                                                      | ผู้ให้บริการต้องการคำแนะนำการกู้คืนเมื่อขาดการยืนยันตัวตนเฉพาะผู้ให้บริการ                                                                                 |
| 30  | `augmentModelCatalog`             | แถวแค็ตตาล็อกสังเคราะห์/สุดท้ายที่ต่อท้ายหลังการค้นพบ                                                          | ผู้ให้บริการต้องการแถวความเข้ากันได้ล่วงหน้าแบบสังเคราะห์ใน `models list` และตัวเลือก                                                                     |
| 31  | `resolveThinkingProfile`          | ชุดระดับ `/think` เฉพาะโมเดล, ป้ายกำกับที่แสดง และค่าเริ่มต้น                                                 | ผู้ให้บริการเปิดเผยลำดับขั้นการคิดแบบกำหนดเองหรือป้ายกำกับไบนารีสำหรับโมเดลที่เลือก                                                                 |
| 32  | `isBinaryThinking`                | Hook ความเข้ากันได้ของสวิตช์เปิด/ปิดการให้เหตุผล                                                                     | ผู้ให้บริการเปิดเผยเฉพาะการคิดแบบเปิด/ปิดไบนารี                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook ความเข้ากันได้สำหรับการรองรับการให้เหตุผล `xhigh`                                                                   | ผู้ให้บริการต้องการ `xhigh` เฉพาะในบางโมเดล                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook ความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                      | ผู้ให้บริการเป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับแฟมิลีโมเดล                                                                                      |
| 35  | `isModernModelRef`                | ตัวจับคู่โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์สดและการเลือกสโมก                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับสด/สโมก                                                                                             |
| 36  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลประจำตัวที่กำหนดค่าไว้เป็นโทเค็น/คีย์รันไทม์จริงก่อนการอนุมาน                       | ผู้ให้บริการต้องการการแลกเปลี่ยนโทเค็นหรือข้อมูลประจำตัวคำขอแบบอายุสั้น                                                                             |
| 37  | `resolveUsageAuth`                | ระบุข้อมูลประจำตัวสำหรับการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และส่วนแสดงสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องการการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือข้อมูลประจำตัวการใช้งานแบบอื่น                                                               |
| 38  | `fetchUsageSnapshot`              | ดึงข้อมูลและปรับสแนปช็อตการใช้งาน/โควตาเฉพาะผู้ให้บริการให้เป็นรูปแบบมาตรฐานหลังจากระบุการตรวจสอบสิทธิ์แล้ว                             | ผู้ให้บริการต้องการปลายทางการใช้งานหรือโปรแกรมแยกวิเคราะห์เพย์โหลดเฉพาะผู้ให้บริการ                                                                           |
| 39  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำเป็นของ Plugin ผู้ให้บริการ                                                                                    |
| 40  | `buildReplayPolicy`               | ส่งคืนนโยบายการเล่นซ้ำที่ควบคุมการจัดการทรานสคริปต์สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องการนโยบายทรานสคริปต์แบบกำหนดเอง (เช่น การลบบล็อกความคิดออก)                                                               |
| 41  | `sanitizeReplayHistory`           | เขียนประวัติการเล่นซ้ำใหม่หลังจากล้างทรานสคริปต์ทั่วไป                                                        | ผู้ให้บริการต้องการการเขียนการเล่นซ้ำใหม่เฉพาะผู้ให้บริการ นอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 42  | `validateReplayTurns`             | ตรวจสอบความถูกต้องหรือปรับรูปแบบเทิร์นการเล่นซ้ำขั้นสุดท้ายก่อน runner แบบฝัง                                           | การส่งผ่านของผู้ให้บริการต้องการการตรวจสอบความถูกต้องของเทิร์นที่เข้มงวดขึ้นหลังจากการทำความสะอาดทั่วไป                                                                    |
| 43  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องการเทเลเมทรีหรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลเริ่มใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
Provider Plugin ที่จับคู่ได้ก่อน จากนั้นจึงไล่ไปยัง Provider Plugin อื่นที่รองรับ hook
จนกว่าจะมีตัวใดเปลี่ยน model id หรือ transport/config จริง วิธีนี้ทำให้
shim ของ provider สำหรับ alias/compat ยังคงทำงานได้ โดยไม่บังคับให้ caller ต้องรู้ว่า
Plugin ที่รวมมาใดเป็นเจ้าของการ rewrite หากไม่มี provider hook ใด rewrite รายการ config
ตระกูล Google ที่รองรับ ตัว normalize config ของ Google ที่รวมมาก็ยังใช้การล้างข้อมูล
ความเข้ากันได้นั้นอยู่

หาก provider ต้องการ wire protocol ที่กำหนดเองทั้งหมดหรือ request executor ที่กำหนดเอง
นั่นเป็น extension อีกประเภทหนึ่ง hook เหล่านี้มีไว้สำหรับพฤติกรรมของ provider
ที่ยังคงทำงานบน inference loop ปกติของ OpenClaw

### ตัวอย่าง provider

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

### ตัวอย่างที่มีมาในตัว

Provider Plugin ที่รวมมาจะผสม hook ข้างต้นเพื่อให้เข้ากับ catalog,
auth, thinking, replay และความต้องการด้าน usage ของ vendor แต่ละราย ชุด hook ที่เป็นแหล่งอ้างอิง
จะอยู่กับแต่ละ Plugin ภายใต้ `extensions/`; หน้านี้แสดงรูปแบบมากกว่าจะ
สะท้อนรายการทั้งหมด

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` ร่วมกับ
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้แสดง model id จาก upstream
    ก่อน catalog แบบ static ของ OpenClaw ได้
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลก token และการผสานรวม `/usage`
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    family ที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ provider เลือกใช้
    นโยบาย transcript ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะต้อง implement การ cleanup เอง
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเฉพาะ `catalog` และใช้ inference loop ร่วมกัน
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam สาธารณะ `api.ts` / `contract-api.ts` ของ Anthropic Plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS ของ core ปกติสำหรับ surface แบบไฟล์/voice-note
- ใช้ configuration `messages.tts` ของ core และการเลือก provider
- ส่งคืน PCM audio buffer + sample rate Plugin ต้อง resample/encode สำหรับ provider
- `listVoices` เป็นตัวเลือกต่อ provider ใช้สำหรับ voice picker หรือ setup flow ที่ vendor เป็นเจ้าของ
- รายการ voice อาจรวม metadata ที่ละเอียดขึ้น เช่น locale, gender และ personality tags สำหรับ picker ที่รับรู้ provider
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

- เก็บนโยบาย TTS, fallback และการส่ง reply ไว้ใน core
- ใช้ speech provider สำหรับพฤติกรรม synthesis ที่ vendor เป็นเจ้าของ
- อินพุต Microsoft แบบ legacy `edge` จะถูก normalize เป็น provider id `microsoft`
- โมเดล ownership ที่แนะนำคือแบบมุ่งตามบริษัท: Plugin ของ vendor หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และ media provider ในอนาคตได้เมื่อ OpenClaw เพิ่ม
  capability contract เหล่านั้น

สำหรับการทำความเข้าใจ image/audio/video Plugin จะลงทะเบียน
media-understanding provider แบบมีชนิดหนึ่งตัวแทน generic key/value bag:

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

- เก็บ orchestration, fallback, config และการ wiring ของ channel ไว้ใน core
- เก็บพฤติกรรมของ vendor ไว้ใน Provider Plugin
- การขยายแบบ additive ควรคงเป็นแบบ typed: method เสริมใหม่, result field เสริมใหม่, capability เสริมใหม่
- การสร้างวิดีโอทำตามรูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - vendor plugin ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - feature/channel plugin ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helper ของ media-understanding Plugin สามารถเรียก:

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

สำหรับการถอดเสียง audio Plugin สามารถใช้ runtime ของ media-understanding
หรือ alias STT รุ่นเก่าก็ได้:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` เป็น surface ร่วมที่แนะนำสำหรับ
  การทำความเข้าใจ image/audio/video
- ใช้ configuration audio ของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของ provider
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุต transcription ถูกสร้างขึ้น (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็น compatibility alias

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

- `provider` และ `model` เป็น override ต่อการรันแบบ optional ไม่ใช่การเปลี่ยนแปลง session แบบถาวร
- OpenClaw จะใช้ override field เหล่านั้นสำหรับ caller ที่ trusted เท่านั้น
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ operator ต้อง opt in ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่ trusted ให้ใช้ target `provider/model` แบบ canonical ที่เฉพาะเจาะจง หรือ `"*"` เพื่ออนุญาต target ใด ๆ อย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่ trusted ยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ
- session subagent ที่ Plugin สร้างจะถูก tagged ด้วย plugin id ที่สร้าง Fallback `api.runtime.subagent.deleteSession(...)` อาจลบได้เฉพาะ session ที่เป็นเจ้าของเหล่านั้นเท่านั้น; การลบ session ใด ๆ ยังคงต้องใช้คำขอ Gateway ที่มี scope เป็น admin

สำหรับ web search Plugin สามารถใช้ runtime helper ร่วมแทนการ
เข้าไปยุ่งกับ wiring ของ agent tool:

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

Plugin ยังสามารถลงทะเบียน web-search provider ผ่าน
`api.registerWebSearchProvider(...)` ได้ด้วย

หมายเหตุ:

- เก็บการเลือก provider, การ resolve credential และ semantics ของ request ร่วมไว้ใน core
- ใช้ web-search provider สำหรับ search transport เฉพาะ vendor
- `api.runtime.webSearch.*` เป็น surface ร่วมที่แนะนำสำหรับ feature/channel plugin ที่ต้องการพฤติกรรม search โดยไม่ต้องขึ้นกับ agent tool wrapper

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

- `generate(...)`: สร้างภาพโดยใช้ chain ของ image-generation provider ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการ image-generation provider ที่พร้อมใช้งานและ capability ของแต่ละตัว

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

ฟิลด์ของ route:

- `path`: path ของ route ภายใต้ HTTP server ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อกำหนดให้ใช้ auth ของ gateway ปกติ หรือ `"plugin"` สำหรับ auth/webhook verification ที่ Plugin จัดการ
- `match`: optional `"exact"` (default) หรือ `"prefix"`
- `replaceExisting`: optional อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตนเอง
- `handler`: ส่งคืน `true` เมื่อ route จัดการ request แล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้ว และจะทำให้เกิดข้อผิดพลาดขณะโหลด plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- เส้นทางของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งแบบตรงกันทุกประการของ `path + match` จะถูกปฏิเสธ เว้นแต่มี `replaceExisting: true` และ plugin หนึ่งไม่สามารถแทนที่เส้นทางของ plugin อื่นได้
- เส้นทางที่ทับซ้อนกันโดยมีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้เก็บเชน fallthrough ของ `exact`/`prefix` ไว้ในระดับ auth เดียวกันเท่านั้น
- เส้นทาง `auth: "plugin"` จะ **ไม่ได้** รับ operator runtime scopes โดยอัตโนมัติ เส้นทางเหล่านี้มีไว้สำหรับ webhooks/signature verification ที่ plugin จัดการเอง ไม่ใช่การเรียก Gateway helper ที่มีสิทธิ์พิเศษ
- เส้นทาง `auth: "gateway"` ทำงานภายใน Gateway request runtime scope แต่ scope นั้นถูกตั้งใจให้อยู่ในขอบเขตที่ระมัดระวัง:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) จะตรึง plugin-route runtime scopes ไว้ที่ `operator.write` แม้ผู้เรียกจะส่ง `x-openclaw-scopes`
  - โหมด HTTP ที่มี trusted identity-bearing (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นั้นระบุมาอย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอ plugin-route แบบ identity-bearing เหล่านั้น runtime scope จะ fallback เป็น `operator.write`
- กฎใช้งานจริง: อย่าถือว่า gateway-auth plugin route เป็นพื้นผิว admin โดยปริยาย หาก route ของคุณต้องมีพฤติกรรมเฉพาะ admin ให้บังคับใช้ auth mode แบบ identity-bearing และจัดทำเอกสารสัญญา header `x-openclaw-scopes` อย่างชัดเจน

## เส้นทางนำเข้า Plugin SDK

ใช้ SDK subpaths ที่แคบแทน root barrel แบบรวมศูนย์ `openclaw/plugin-sdk`
เมื่อเขียน plugin ใหม่ Core subpaths:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helper สำหรับ channel entry/build                        |
| `openclaw/plugin-sdk/core`          | helper ที่ใช้ร่วมกันทั่วไปและ umbrella contract       |
| `openclaw/plugin-sdk/config-schema` | สคีมา Zod ของ root `openclaw.json` (`OpenClawSchema`) |

Channel plugins เลือกจากกลุ่ม seam ที่แคบ ได้แก่ `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรม approval ควรรวมศูนย์
อยู่บนสัญญา `approvalCapability` เดียว แทนการผสมข้าม field ของ
plugin ที่ไม่เกี่ยวข้องกัน ดู [Channel plugins](/th/plugins/sdk-channel-plugins)

Runtime และ config helpers อยู่ภายใต้ subpaths แบบเน้นเฉพาะที่ตรงกันในรูปแบบ `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` ฯลฯ) ควรใช้ `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` และ `config-mutation`
แทน barrel compatibility แบบกว้าง `config-runtime`

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
และ `openclaw/plugin-sdk/infra-runtime` เป็น compatibility shims ที่เลิกแนะนำแล้วสำหรับ
plugin รุ่นเก่า โค้ดใหม่ควร import generic primitives ที่แคบกว่าแทน
</Info>

Entry points ภายใน repo (ต่อ root ของ bundled plugin package):

- `index.js` — bundled plugin entry
- `api.js` — barrel ของ helper/types
- `runtime-api.js` — barrel สำหรับ runtime เท่านั้น
- `setup-entry.js` — setup plugin entry

External plugins ควร import เฉพาะ subpaths `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของ package plugin อื่นจาก core หรือจาก plugin อื่น
Facade-loaded entry points จะเลือก active runtime config snapshot เมื่อมีอยู่
จากนั้นจึง fallback ไปยัง config file ที่ resolve แล้วบนดิสก์

Subpaths เฉพาะ capability เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ bundled plugins ใช้งานอยู่ในปัจจุบัน เส้นทางเหล่านี้ไม่ได้เป็น
external contracts ที่ถูก freeze ระยะยาวโดยอัตโนมัติ ให้ตรวจสอบหน้าอ้างอิง SDK
ที่เกี่ยวข้องเมื่อจะพึ่งพาเส้นทางเหล่านี้

## สคีมาของ message tool

Plugins ควรเป็นเจ้าของการมีส่วนร่วมในสคีมา `describeMessageTool(...)` เฉพาะ channel
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
การนำเสนอการส่งแบบ shared ควรใช้สัญญา `MessagePresentation` ทั่วไป
แทน field button, component, block หรือ card แบบ provider-native
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การ map provider และ checklist สำหรับผู้เขียน plugin

Plugins ที่ส่งได้ประกาศสิ่งที่ render ได้ผ่าน message capabilities:

- `presentation` สำหรับ semantic presentation blocks (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับ pinned-delivery requests

Core ตัดสินใจว่าจะ render presentation แบบ native หรือลดระดับเป็นข้อความ
อย่าเปิดช่อง provider-native UI escape hatches จาก message tool ทั่วไป
SDK helpers ที่เลิกแนะนำแล้วสำหรับ legacy native schemas ยังคง export ไว้สำหรับ
third-party plugins ที่มีอยู่ แต่ plugin ใหม่ไม่ควรใช้

## การ resolve channel target

Channel plugins ควรเป็นเจ้าของ semantics ของ target เฉพาะ channel เก็บ shared
outbound host ให้เป็นแบบทั่วไป และใช้พื้นผิว messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินว่า normalized target
  ควรถูกถือเป็น `direct`, `group` หรือ `channel` ก่อน directory lookup
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า
  input ควรข้ามไปยังการ resolve แบบคล้าย id โดยตรง แทน directory search หรือไม่
- `messaging.targetResolver.resolveTarget(...)` เป็น fallback ของ plugin เมื่อ
  core ต้องการ final provider-owned resolution หลัง normalization หรือหลังจาก
  directory miss
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง route ของ session
  ที่เฉพาะ provider เมื่อ resolve target แล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจด้าน category ที่ควรเกิดขึ้นก่อน
  ค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจสอบ "ถือว่าสิ่งนี้เป็น explicit/native target id"
- ใช้ `resolveTarget` สำหรับ provider-specific normalization fallback ไม่ใช่สำหรับ
  directory search แบบกว้าง
- เก็บ provider-native ids เช่น chat ids, thread ids, JIDs, handles และ room
  ids ไว้ภายในค่า `target` หรือ params เฉพาะ provider ไม่ใช่ใน generic SDK
  fields

## ไดเรกทอรีที่อิง config

Plugins ที่ derive directory entries จาก config ควรเก็บ logic นั้นไว้ใน
plugin และใช้ shared helpers จาก
`openclaw/plugin-sdk/directory-runtime` ซ้ำ

ใช้สิ่งนี้เมื่อ channel ต้องการ peers/groups ที่อิง config เช่น:

- DM peers ที่ขับเคลื่อนด้วย allowlist
- maps ของ channel/group ที่กำหนดค่าไว้
- fallback ของ static directory ตามขอบเขต account

Shared helpers ใน `directory-runtime` จัดการเฉพาะ operation ทั่วไป:

- query filtering
- limit application
- helper สำหรับ deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบ account เฉพาะ channel และ id normalization ควรอยู่ใน
implementation ของ plugin

## Provider catalogs

Provider plugins สามารถกำหนด model catalogs สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืน shape เดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับ provider entry หนึ่งรายการ
- `{ providers }` สำหรับ provider entries หลายรายการ

ใช้ `catalog` เมื่อ plugin เป็นเจ้าของ provider-specific model ids, ค่า default ของ base URL
หรือ auth-gated model metadata

`catalog.order` ควบคุมว่า catalog ของ plugin จะ merge เมื่อใดเมื่อเทียบกับ
built-in implicit providers ของ OpenClaw:

- `simple`: providers แบบ plain API-key หรือ env-driven
- `profile`: providers ที่ปรากฏเมื่อมี auth profiles
- `paired`: providers ที่ synthesize provider entries ที่เกี่ยวข้องกันหลายรายการ
- `late`: pass สุดท้าย หลังจาก implicit providers อื่น

Providers ที่มาทีหลังชนะเมื่อ key collision ดังนั้น plugins สามารถตั้งใจ override
built-in provider entry ด้วย provider id เดียวกันได้

Plugins ยังสามารถ publish read-only model rows ผ่าน
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` ได้ด้วย นี่คือ forward path สำหรับพื้นผิว list/help/picker และรองรับแถว
`text`, `image_generation`, `video_generation` และ `music_generation`
Provider plugins ยังคงเป็นเจ้าของ live endpoint calls, token exchange และ vendor
response mapping; core เป็นเจ้าของ common row shape, source labels และ media tool
help formatting การลงทะเบียน media-generation provider จะ synthesize static
catalog rows โดยอัตโนมัติจาก `defaultModel`, `models` และ `capabilities`

Compatibility:

- `discovery` ยังใช้งานได้ในฐานะ legacy alias แต่จะส่ง deprecation warning
- หากลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`
- `augmentModelCatalog` เลิกแนะนำแล้ว; bundled providers ควร publish
  supplemental rows ผ่าน `registerModelCatalogProvider`

## การตรวจสอบ channel แบบ read-only

หาก plugin ของคุณลงทะเบียน channel ให้เลือก implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือ runtime path ซึ่งได้รับอนุญาตให้สมมติว่า credentials
  ถูก materialize ครบแล้ว และสามารถ fail fast เมื่อ secrets ที่จำเป็นขาดหาย
- Command paths แบบ read-only เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และ flow ของ doctor/config
  repair ไม่ควรต้อง materialize runtime credentials เพียงเพื่อ
  อธิบาย configuration

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนเฉพาะสถานะ account แบบอธิบายได้
- รักษา `enabled` และ `configured`
- รวม fields ของ credential source/status เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืน raw token values เพียงเพื่อรายงาน
  availability แบบ read-only การคืน `tokenStatus: "available"` (และ source
  field ที่ตรงกัน) ก็เพียงพอสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  unavailable ใน command path ปัจจุบัน

สิ่งนี้ทำให้คำสั่ง read-only รายงาน "configured but unavailable in this command
path" ได้ แทนที่จะ crash หรือรายงาน account ผิดว่าไม่ได้ configured

## Package packs

ไดเรกทอรี plugin อาจมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น plugin หาก pack ระบุ extensions หลายรายการ plugin id
จะกลายเป็น `name/<fileBase>`

หาก plugin ของคุณ import npm deps ให้ install ในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

Guardrail ด้านความปลอดภัย: entry ทุกตัวใน `openclaw.extensions` ต้องอยู่ภายในไดเรกทอรี plugin
หลังจาก symlink resolution แล้ว Entries ที่ escape ออกจากไดเรกทอรี package จะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependencies ของ plugin ด้วย
project-local `npm install --omit=dev --ignore-scripts` (ไม่มี lifecycle scripts,
ไม่มี dev dependencies ณ runtime) โดยไม่สนใจการตั้งค่า npm install แบบ global ที่สืบทอดมา
ให้ dependency trees ของ plugin เป็น "pure JS/TS" และหลีกเลี่ยง packages ที่ต้องใช้
`postinstall` builds

ทางเลือก: `openclaw.setupEntry` สามารถชี้ไปยัง module แบบ setup-only ที่เบาได้
เมื่อ OpenClaw ต้องการ setup surfaces สำหรับ disabled channel plugin หรือ
เมื่อ channel plugin ถูก enable แล้วแต่ยังไม่ได้ configured จะโหลด `setupEntry`
แทน full plugin entry สิ่งนี้ทำให้ startup และ setup เบาลง
เมื่อ main plugin entry ของคุณยัง wire tools, hooks หรือโค้ดอื่นที่เป็น runtime-only
ด้วย

ทางเลือก: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถ opt channel plugin ให้ใช้ path `setupEntry` เดียวกันในช่วง pre-listen startup phase
ของ gateway ได้ แม้ channel นั้นจะ configured แล้วก็ตาม

ใช้ตัวเลือกนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิวการเริ่มต้นทั้งหมดที่ต้องมีอยู่
ก่อนที่ Gateway จะเริ่มฟัง ในทางปฏิบัติ หมายความว่าเอนทรีการตั้งค่า
ต้องลงทะเบียนความสามารถทั้งหมดที่แชนเนลเป็นเจ้าของและการเริ่มต้นพึ่งพา เช่น:

- การลงทะเบียนแชนเนลเอง
- เส้นทาง HTTP ใดๆ ที่ต้องพร้อมใช้งานก่อนที่ Gateway จะเริ่มฟัง
- เมธอด เครื่องมือ หรือบริการใดๆ ของ Gateway ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หากเอนทรีเต็มของคุณยังเป็นเจ้าของความสามารถที่จำเป็นต่อการเริ่มต้นใดๆ อยู่ อย่าเปิดใช้
แฟล็กนี้ ให้คง Plugin ไว้กับพฤติกรรมเริ่มต้น และให้ OpenClaw โหลด
เอนทรีเต็มระหว่างการเริ่มต้น

แชนเนลที่มาพร้อมชุดติดตั้งยังสามารถเผยแพร่ตัวช่วยพื้นผิวสัญญาแบบเฉพาะการตั้งค่าที่แกนหลัก
สามารถตรวจสอบก่อนโหลดรันไทม์เต็มของแชนเนลได้ พื้นผิวการเลื่อนระดับการตั้งค่าปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

แกนหลักใช้พื้นผิวนั้นเมื่อต้องเลื่อนระดับการกำหนดค่าแชนเนลแบบบัญชีเดียวรุ่นเก่า
ให้เป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลดเอนทรีเต็มของ Plugin
Matrix คือตัวอย่างปัจจุบันที่มาพร้อมชุดติดตั้ง: จะย้ายเฉพาะคีย์ auth/bootstrap ไปยัง
บัญชีที่ถูกเลื่อนระดับแบบมีชื่อเมื่อมีบัญชีแบบมีชื่ออยู่แล้ว และสามารถคง
คีย์บัญชีเริ่มต้นแบบไม่เป็น canonical ที่กำหนดค่าไว้ แทนที่จะสร้าง
`accounts.default` เสมอ

อะแดปเตอร์แพตช์การตั้งค่าเหล่านั้นทำให้การค้นหาพื้นผิวสัญญาที่มาพร้อมชุดติดตั้งยังคงโหลดแบบขี้เกียจ
เวลานำเข้ายังคงเบา; พื้นผิวการเลื่อนระดับจะถูกโหลดเฉพาะเมื่อใช้งานครั้งแรก แทนที่จะ
กลับเข้าไปเริ่มต้นแชนเนลที่มาพร้อมชุดติดตั้งอีกครั้งตอนนำเข้าโมดูล

เมื่อพื้นผิวการเริ่มต้นเหล่านั้นรวมเมธอด RPC ของ Gateway ให้คงไว้บน
คำนำหน้าที่เฉพาะกับ Plugin เนมสเปซผู้ดูแลแกนหลัก (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และแก้ไขเป็น
`operator.admin` เสมอ แม้ Plugin จะขอขอบเขตที่แคบกว่าก็ตาม

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

### เมตาดาตาแคตตาล็อกแชนเนล

Plugin แชนเนลสามารถประกาศเมตาดาตาการตั้งค่า/การค้นพบผ่าน `openclaw.channel` และ
คำแนะนำการติดตั้งผ่าน `openclaw.install` วิธีนี้ทำให้ข้อมูลแคตตาล็อกของแกนหลักว่างเปล่า

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

- `detailLabel`: ป้ายรองสำหรับพื้นผิวแคตตาล็อก/สถานะที่ละเอียดขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: รหัส Plugin/แชนเนลที่มีลำดับความสำคัญต่ำกว่า ซึ่งรายการแคตตาล็อกนี้ควรมีอันดับเหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความบนพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าแชนเนลรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนแชนเนลจากพื้นผิวรายการแชนเนลที่กำหนดค่าแล้วเมื่อตั้งเป็น `false`
- `exposure.setup`: ซ่อนแชนเนลจากตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบเมื่อตั้งเป็น `false`
- `exposure.docs`: ทำเครื่องหมายว่าแชนเนลเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: ชื่อแทนรุ่นเก่าที่ยังยอมรับเพื่อความเข้ากันได้; แนะนำให้ใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้แชนเนลเข้าร่วมโฟลว์ `allowFrom` แบบ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีบัญชีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ใช้การค้นหาเซสชันก่อนเมื่อแก้ไขเป้าหมายประกาศ

OpenClaw ยังสามารถผสาน **แคตตาล็อกแชนเนลภายนอก** (เช่น การส่งออกรีจิสทรี MPM)
วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วยจุลภาค/อัฒภาค/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` พาร์เซอร์ยังยอมรับ `"packages"` หรือ `"plugins"` เป็นชื่อแทนรุ่นเก่าสำหรับคีย์ `"entries"` ด้วย

รายการแคตตาล็อกแชนเนลและรายการแคตตาล็อกการติดตั้งผู้ให้บริการที่สร้างขึ้นจะเปิดเผย
ข้อเท็จจริงแหล่งติดตั้งที่ทำให้เป็นมาตรฐานแล้วถัดจากบล็อก `openclaw.install` ดิบ
ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะระบุว่า npm spec เป็นเวอร์ชันแน่นอนหรือตัวเลือกแบบลอยตัว
มีเมตาดาตา integrity ที่คาดไว้หรือไม่ และมีพาธแหล่งภายในเครื่องพร้อมใช้งานด้วยหรือไม่
เมื่อทราบตัวตนของแคตตาล็อก/แพ็กเกจ ข้อเท็จจริงที่ทำให้เป็นมาตรฐานจะเตือนหากชื่อแพ็กเกจ npm ที่พาร์เซได้เบี่ยงเบนจากตัวตนนั้น
นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่
ไม่พร้อมใช้งาน และเมื่อมีเมตาดาตา npm integrity โดยไม่มีแหล่ง npm ที่ถูกต้อง
ผู้บริโภคควรมอง `installSource` เป็นฟิลด์เสริมแบบเพิ่มได้ เพื่อให้
รายการที่สร้างด้วยมือและชิมแคตตาล็อกไม่จำเป็นต้องสังเคราะห์ฟิลด์นี้
สิ่งนี้ช่วยให้การเริ่มใช้งานและการวินิจฉัยอธิบายสถานะระนาบแหล่งได้โดยไม่ต้อง
นำเข้ารันไทม์ Plugin

รายการ npm ภายนอกอย่างเป็นทางการควรเลือกใช้ `npmSpec` แบบแน่นอนพร้อม
`expectedIntegrity` ชื่อแพ็กเกจเปล่าและ dist-tags ยังใช้งานได้เพื่อ
ความเข้ากันได้ แต่จะแสดงคำเตือนระนาบแหล่ง เพื่อให้แคตตาล็อกสามารถขยับไปสู่
การติดตั้งที่ปักหมุดและตรวจสอบ integrity ได้โดยไม่ทำให้ Plugin เดิมเสียหาย
เมื่อการเริ่มใช้งานติดตั้งจากพาธแคตตาล็อกภายในเครื่อง จะบันทึกรายการดัชนี Plugin
ที่จัดการแล้วพร้อม `source: "path"` และ `sourcePath` ที่สัมพันธ์กับเวิร์กสเปซ
เมื่อทำได้ พาธโหลดเชิงปฏิบัติการแบบสมบูรณ์จะยังอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งหลีกเลี่ยงการทำซ้ำพาธเวิร์กสเตชันภายในเครื่อง
ลงในการกำหนดค่าระยะยาว วิธีนี้ทำให้การติดตั้งเพื่อพัฒนาภายในเครื่องยังมองเห็นได้ต่อ
การวินิจฉัยระนาบแหล่ง โดยไม่เพิ่มพื้นผิวเปิดเผยพาธระบบไฟล์ดิบอีกจุดหนึ่ง
ดัชนี Plugin `plugins/installs.json` ที่คงไว้คือแหล่งความจริงของการติดตั้ง
และสามารถรีเฟรชได้โดยไม่ต้องโหลดโมดูลรันไทม์ Plugin
แมป `installRecords` ของดัชนีนั้นคงทนแม้แมนิเฟสต์ของ Plugin จะหายไปหรือ
ไม่ถูกต้อง; อาร์เรย์ `plugins` เป็นมุมมองแมนิเฟสต์ที่สร้างใหม่ได้

## Plugin เอนจินบริบท

Plugin เอนจินบริบทเป็นเจ้าของการประสานบริบทเซสชันสำหรับการนำเข้า การประกอบ
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือกเอนจินที่ใช้งานอยู่ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องแทนที่หรือขยายไปป์ไลน์บริบทเริ่มต้น
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

แฟกทอรี `ctx` เปิดเผยค่า `config`, `agentDir` และ `workspaceDir`
ที่เป็นทางเลือกสำหรับการเริ่มต้นขณะก่อสร้าง

หากเอนจินของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()`
ไว้และมอบหมายอย่างชัดเจน:

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
ระบบ Plugin ด้วยการเข้าถึงภายในแบบส่วนตัว ให้เพิ่มความสามารถที่ขาดอยู่

ลำดับที่แนะนำ:

1. กำหนดสัญญาแกนหลัก
   ตัดสินใจว่าแกนหลักควรเป็นเจ้าของพฤติกรรมที่ใช้ร่วมกันอะไร: นโยบาย fallback การผสาน config
   วงจรชีวิต semantics ที่หันหน้าเข้าหาแชนเนล และรูปทรงตัวช่วยรันไทม์
2. เพิ่มพื้นผิวการลงทะเบียน/รันไทม์ Plugin ที่มีชนิด
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิวความสามารถ
   ที่มีชนิดและเล็กที่สุดเท่าที่มีประโยชน์
3. เชื่อมแกนหลัก + ผู้บริโภคแชนเนล/ฟีเจอร์
   แชนเนลและ Plugin ฟีเจอร์ควรใช้ความสามารถใหม่ผ่านแกนหลัก
   ไม่ใช่โดยนำเข้า implementation ของผู้ขายโดยตรง
4. ลงทะเบียน implementation ของผู้ขาย
   จากนั้น Plugin ผู้ขายจึงลงทะเบียนแบ็กเอนด์ของตนกับความสามารถนั้น
5. เพิ่มความครอบคลุมสัญญา
   เพิ่มการทดสอบเพื่อให้ความเป็นเจ้าของและรูปทรงการลงทะเบียนยังชัดเจนต่อไปเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw ยังคงมีจุดยืนโดยไม่ถูก hardcode กับมุมมองโลกของ
ผู้ให้บริการรายเดียว ดู [คู่มือความสามารถ](/th/plugins/adding-capabilities)
สำหรับรายการตรวจสอบไฟล์ที่เป็นรูปธรรมและตัวอย่างที่ทำให้ดูแล้ว

### รายการตรวจสอบความสามารถ

เมื่อคุณเพิ่มความสามารถใหม่ โดยปกติ implementation ควรแตะพื้นผิวเหล่านี้
ร่วมกัน:

- ชนิดสัญญาแกนหลักใน `src/<capability>/types.ts`
- ตัวช่วยรันเนอร์/รันไทม์แกนหลักใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน API ของ Plugin ใน `src/plugins/types.ts`
- การเชื่อมรีจิสทรี Plugin ใน `src/plugins/registry.ts`
- การเปิดเผยรันไทม์ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/แชนเนล
  จำเป็นต้องใช้
- ตัวช่วย capture/test ใน `src/test-utils/plugin-registration.ts`
- การยืนยันความเป็นเจ้าของ/สัญญาใน `src/plugins/contracts/registry.ts`
- เอกสารผู้ปฏิบัติการ/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป โดยปกติจะเป็นสัญญาณว่าความสามารถนั้น
ยังไม่ได้ถูกรวมเข้าด้วยกันอย่างครบถ้วน

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

รูปแบบการทดสอบสัญญา:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

สิ่งนั้นทำให้กฎเรียบง่าย:

- แกนหลักเป็นเจ้าของสัญญาความสามารถ + การประสานงาน
- Plugin ผู้ขายเป็นเจ้าของ implementation ของผู้ขาย
- Plugin ฟีเจอร์/แชนเนลใช้ตัวช่วยรันไทม์
- การทดสอบสัญญาช่วยให้ความเป็นเจ้าของชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปทรงความสามารถสาธารณะ
- [พาธย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
