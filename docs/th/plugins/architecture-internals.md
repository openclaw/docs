---
read_when:
    - การติดตั้งใช้งาน provider runtime hooks, วงจรชีวิตของ channel หรือ package packs
    - การแก้ไขข้อบกพร่องของลำดับการโหลด Plugin หรือสถานะของ registry
    - การเพิ่ม capability ใหม่ของ Plugin หรือ context engine plugin
summary: 'โครงสร้างภายในของสถาปัตยกรรม Plugin: ไปป์ไลน์การโหลด, registry, runtime hooks, HTTP routes และตารางอ้างอิง'
title: โครงสร้างภายในของสถาปัตยกรรม Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

สำหรับโมเดล capability สาธารณะ, plugin shapes และสัญญาการเป็นเจ้าของ/การทำงาน
ดู [สถาปัตยกรรม Plugin](/th/plugins/architecture) หน้านี้เป็นเอกสารอ้างอิงสำหรับกลไกภายใน:
ไปป์ไลน์การโหลด, registry, runtime hooks, Gateway HTTP routes, import paths และตาราง schema

## ไปป์ไลน์การโหลด

เมื่อเริ่มต้น OpenClaw จะทำโดยคร่าว ๆ ดังนี้:

1. ค้นหา candidate plugin roots
2. อ่าน manifests แบบเนทีฟหรือ compatible bundles และ package metadata
3. ปฏิเสธ candidates ที่ไม่ปลอดภัย
4. normalize config ของ Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจการเปิดใช้งานสำหรับแต่ละ candidate
6. โหลด native modules ที่เปิดใช้งานแล้ว: bundled modules ที่ build แล้วจะใช้ native loader;
   native plugins ที่ยังไม่ build จะใช้ jiti
7. เรียก native hooks `register(api)` และเก็บการลงทะเบียนไว้ใน plugin registry
8. เปิดเผย registry ให้กับคำสั่ง/พื้นผิวของรันไทม์

<Note>
`activate` เป็นชื่ออื่นแบบ legacy ของ `register` — loader จะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกในจุดเดียวกัน bundled plugins ทั้งหมดใช้ `register`; สำหรับ Plugins ใหม่ควรใช้ `register`
</Note>

ด่านตรวจสอบความปลอดภัยจะเกิดขึ้น **ก่อน** การทำงานในรันไทม์ candidates จะถูกบล็อก
เมื่อ entry ออกนอก plugin root, พาธเขียนได้สำหรับทุกคน หรือ
ความเป็นเจ้าของพาธดูน่าสงสัยสำหรับ plugins ที่ไม่ใช่ bundled

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งข้อมูลจริงของ control plane OpenClaw ใช้มันเพื่อ:

- ระบุตัว Plugin
- ค้นหา channels/Skills/config schema หรือความสามารถของ bundle ที่ประกาศไว้
- ตรวจสอบ `plugins.entries.<id>.config`
- เพิ่ม labels/placeholders ให้กับ Control UI
- แสดง metadata ของการติดตั้ง/แค็ตตาล็อก
- คง descriptors สำหรับ activation และ setup แบบต้นทุนต่ำโดยไม่ต้องโหลด Plugin runtime

สำหรับ Plugins แบบเนทีฟ runtime module คือส่วน data-plane มันจะลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` แบบไม่บังคับใน manifest ยังคงอยู่บน control plane
สิ่งเหล่านี้เป็น descriptors แบบ metadata-only สำหรับการวางแผน activation และการค้นหา setup;
มันไม่ได้แทนที่ runtime registration, `register(...)` หรือ `setupEntry`
ตัวใช้งาน activation แบบ live ชุดแรกตอนนี้ใช้ hints ของคำสั่ง, channel และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ให้แคบลงก่อนสร้าง registry ในวงกว้าง:

- การโหลด CLI จะจำกัดไปยัง Plugins ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การตั้งค่า/การ resolve Plugin ของ channel จะจำกัดไปยัง Plugins ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve setup/runtime ของ provider แบบ explicit จะจำกัดไปยัง Plugins ที่เป็นเจ้าของ
  provider id ที่ร้องขอ

ตัววางแผน activation เปิดทั้ง API แบบ ids-only สำหรับผู้เรียกเดิม และ
plan API สำหรับ diagnostics ใหม่ entries ใน plan จะรายงานเหตุผลที่เลือก Plugin นั้น
โดยแยก planner hints แบบ explicit `activation.*` ออกจาก manifest ownership fallback
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks การแยกเหตุผลนี้เป็นขอบเขตความเข้ากันได้:
metadata ของ Plugin เดิมยังคงใช้งานได้ ขณะที่โค้ดใหม่สามารถตรวจจับ broad hints
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยน semantics ของการโหลดในรันไทม์

ตอนนี้การค้นหา setup จะให้ความสำคัญกับ ids ที่ descriptor เป็นเจ้าของ เช่น `setup.providers`
และ `setup.cliBackends` เพื่อจำกัด candidate plugins ก่อน fallback ไปใช้
`setup-api` สำหรับ Plugins ที่ยังต้องใช้ setup-time runtime hooks รายการ setup ของ provider
จะใช้ `providerAuthChoices` จาก manifest, setup choices ที่ได้มาจาก descriptor และ metadata ของ install-catalog โดยไม่ต้องโหลด provider runtime การตั้งค่า `setup.requiresRuntime: false` แบบ explicit เป็นจุดตัดเฉพาะ descriptor; หากไม่ระบุ `requiresRuntime` จะยังคง fallback ไปใช้ setup-api แบบ legacy เพื่อความเข้ากันได้ หากมี Plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ setup provider หรือ CLI backend id แบบ normalize เดียวกัน การ lookup ของ setup จะปฏิเสธเจ้าของที่กำกวม แทนการพึ่งพาลำดับการค้นพบ เมื่อ setup runtime ถูกเรียกใช้งานจริง registry diagnostics จะรายงาน drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ providers หรือ CLI backends ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก plugins แบบ legacy

### สิ่งที่ loader แคชไว้

OpenClaw จะเก็บ caches ภายในโปรเซสแบบระยะสั้นสำหรับ:

- ผลลัพธ์การค้นพบ
- ข้อมูล manifest registry
- loaded plugin registries

caches เหล่านี้ช่วยลดภาระจากการเริ่มต้นแบบถี่ ๆ และลด overhead ของคำสั่งที่เรียกซ้ำ
จึงควรมองว่าเป็น performance caches อายุสั้น ไม่ใช่ persistence

หมายเหตุด้านประสิทธิภาพ:

- ตั้ง `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` หรือ
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` เพื่อปิด caches เหล่านี้
- ปรับช่วงเวลา cache ได้ด้วย `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` และ
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`

## โมเดลของ Registry

Plugins ที่โหลดแล้วจะไม่เข้าไปแก้ไข core globals แบบสุ่มโดยตรง แต่จะลงทะเบียนเข้า
plugin registry กลาง

registry ติดตามสิ่งต่อไปนี้:

- records ของ Plugin (ตัวตน แหล่งที่มา ต้นทาง สถานะ diagnostics)
- tools
- hooks แบบ legacy และ typed hooks
- channels
- providers
- ตัวจัดการ Gateway RPC
- HTTP routes
- CLI registrars
- background services
- commands ที่เป็นเจ้าของโดย Plugin

จากนั้นฟีเจอร์ของ core จะอ่านจาก registry นั้น แทนที่จะคุยกับโมดูลของ Plugin โดยตรง ซึ่งทำให้การโหลดเป็นทางเดียว:

- plugin module -> registry registration
- core runtime -> registry consumption

การแยกนี้สำคัญต่อการดูแลรักษา เพราะหมายความว่าพื้นผิวของ core ส่วนใหญ่
ต้องการเพียงจุดเชื่อมต่อเดียว: “อ่าน registry” ไม่ใช่ “ทำกรณีพิเศษสำหรับทุก plugin module”

## callbacks สำหรับการผูกการสนทนา

Plugins ที่ผูกการสนทนาไว้สามารถตอบสนองเมื่อการอนุมัติถูกตัดสินแล้ว

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

      // คำขอถูกปฏิเสธ; ล้าง pending state ภายในเครื่องที่มีอยู่
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
  metadata ของการสนทนา

callback นี้ใช้เพื่อการแจ้งเตือนเท่านั้น มันไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind การสนทนา และจะทำงานหลังจากการจัดการการอนุมัติของ core เสร็จสิ้นแล้ว

## Provider runtime hooks

Provider plugins มีสามชั้น:

- **Manifest metadata** สำหรับการ lookup ก่อนรันไทม์แบบต้นทุนต่ำ:
  `setup.providers[].envVars`, `providerAuthEnvVars` แบบเข้ากันได้ย้อนหลังที่เลิกใช้แล้ว,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **Config-time hooks**: `catalog` (`discovery` แบบ legacy) และ
  `applyConfigDefaults`
- **Runtime hooks**: hooks แบบไม่บังคับมากกว่า 40 รายการ ครอบคลุม auth, model resolution,
  stream wrapping, ระดับการคิด, replay policy และ usage endpoints ดู
  รายการทั้งหมดใน [ลำดับและการใช้งานของ Hook](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ generic agent loop, failover, transcript handling และ
tool policy ส่วน hooks เหล่านี้คือพื้นผิวสำหรับการขยายพฤติกรรมเฉพาะ provider
โดยไม่ต้องมี inference transport แบบกำหนดเองทั้งชุด

ใช้ manifest `setup.providers[].envVars` เมื่อ provider มี credentials ที่อิง env
ซึ่งเส้นทาง generic auth/status/model-picker ควรมองเห็นได้โดยไม่ต้องโหลด plugin runtime
`providerAuthEnvVars` แบบเลิกใช้แล้วยังคงถูกอ่านโดย compatibility adapter ในช่วง deprecation window และ plugins ที่ไม่ใช่ bundled
ซึ่งยังใช้มันจะได้รับ manifest diagnostic ใช้ manifest `providerAuthAliases`
เมื่อ provider id หนึ่งควรนำ env vars, auth profiles,
config-backed auth และตัวเลือก onboarding ของ API-key ของ provider id อื่นกลับมาใช้ซ้ำ ใช้ manifest
`providerAuthChoices` เมื่อพื้นผิว CLI สำหรับ onboarding/auth-choice ควรทราบ
choice id ของ provider, group labels และการเชื่อม auth แบบธงเดียวอย่างง่าย โดยไม่ต้อง
โหลด provider runtime คง `envVars` ใน provider runtime ไว้สำหรับ hints ที่มองเห็นได้โดย operator
เช่น labels ใน onboarding หรือ vars สำหรับตั้งค่า OAuth
client-id/client-secret

ใช้ manifest `channelEnvVars` เมื่อ channel มี auth หรือ setup ที่ขับเคลื่อนด้วย env ซึ่งเส้นทาง generic shell-env fallback, config/status checks หรือ setup prompts ควรมองเห็นได้โดยไม่ต้องโหลด channel runtime

### ลำดับและการใช้งานของ Hook

สำหรับ plugins ประเภท model/provider OpenClaw จะเรียก hooks ตามลำดับโดยคร่าวดังนี้
คอลัมน์ “ใช้เมื่อใด” คือคู่มือการตัดสินใจแบบย่อ

| #   | Hook                              | หน้าที่                                                                                                       | ใช้เมื่อใด                                                                                                                                    |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่ config ของ provider ไปยัง `models.providers` ระหว่างการสร้าง `models.json`                            | provider เป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ base URL                                                                                     |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้นของ global config ที่ provider เป็นเจ้าของระหว่างการ materialize config                         | ค่าเริ่มต้นขึ้นอยู่กับโหมด auth, env หรือความหมายของตระกูลโมเดลของ provider                                                                    |
| --  | _(built-in model lookup)_         | OpenClaw ลองเส้นทาง registry/catalog ปกติก่อน                                                                | _(ไม่ใช่ plugin hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | normalize model-id aliases แบบ legacy หรือ preview ก่อน lookup                                                | provider เป็นเจ้าของการล้าง alias ก่อนการ resolve canonical model                                                                              |
| 4   | `normalizeTransport`              | normalize `api` / `baseUrl` ของตระกูล provider ก่อน generic model assembly                                     | provider เป็นเจ้าของการล้าง transport สำหรับ custom provider ids ใน transport family เดียวกัน                                                   |
| 5   | `normalizeConfig`                 | normalize `models.providers.<id>` ก่อน runtime/provider resolution                                             | provider ต้องการล้าง config ที่ควรอยู่กับ Plugin; bundled helpers ตระกูล Google ก็ช่วย backstop ให้กับ Google config entries ที่รองรับด้วย     |
| 6   | `applyNativeStreamingUsageCompat` | ใช้ compat rewrites ของ native streaming-usage กับ config providers                                            | provider ต้องการการแก้ metadata ของ native streaming usage ที่ขับเคลื่อนด้วย endpoint                                                          |
| 7   | `resolveConfigApiKey`             | resolve env-marker auth สำหรับ config providers ก่อนโหลด runtime auth                                          | provider มีการ resolve API-key ผ่าน env-marker ที่ provider เป็นเจ้าของ; `amazon-bedrock` ก็มี built-in AWS env-marker resolver ที่นี่เช่นกัน |
| 8   | `resolveSyntheticAuth`            | แสดง local/self-hosted หรือ config-backed auth โดยไม่บันทึก plaintext                                          | provider สามารถทำงานได้ด้วย marker ของ credential แบบ synthetic/local                                                                          |
| 9   | `resolveExternalAuthProfiles`     | ซ้อนทับ external auth profiles ที่ provider เป็นเจ้าของ; ค่าเริ่มต้น `persistence` คือ `runtime-only` สำหรับ creds ที่ CLI/app เป็นเจ้าของ | provider ใช้ external auth credentials ซ้ำโดยไม่บันทึก copied refresh tokens; ประกาศ `contracts.externalAuthProviders` ใน manifest             |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ placeholders ของ stored synthetic profile ไว้หลัง env/config-backed auth                  | provider เก็บ synthetic placeholder profiles ที่ไม่ควรมี precedence                                                                              |
| 11  | `resolveDynamicModel`             | fallback แบบ synchronous สำหรับ model ids ที่ provider เป็นเจ้าของแต่ยังไม่มีใน local registry                  | provider ยอมรับ upstream model ids แบบอิสระ                                                                                                     |
| 12  | `prepareDynamicModel`             | วอร์มอัปแบบ asynchronous แล้วจึงรัน `resolveDynamicModel` อีกครั้ง                                              | provider ต้องการ metadata จากเครือข่ายก่อน resolve ids ที่ไม่รู้จัก                                                                            |
| 13  | `normalizeResolvedModel`          | เขียนค่าครั้งสุดท้ายก่อน embedded runner ใช้ resolved model                                                    | provider ต้องการ rewrites ของ transport แต่ยังใช้ core transport                                                                                |
| 14  | `contributeResolvedModelCompat`   | เพิ่ม compat flags สำหรับ vendor models ที่อยู่หลัง compatible transport อื่น                                  | provider รู้จักโมเดลของตัวเองบน proxy transports โดยไม่ต้องเข้ามาเป็นเจ้าของ provider นั้น                                                    |
| 15  | `capabilities`                    | metadata ด้าน transcript/tooling ที่ provider เป็นเจ้าของ ซึ่งใช้โดย shared core logic                         | provider ต้องการรองรับความแตกต่างเฉพาะของ transcript/ตระกูล provider                                                                          |
| 16  | `normalizeToolSchemas`            | normalize tool schemas ก่อนที่ embedded runner จะมองเห็น                                                       | provider ต้องการล้าง schema ตาม transport-family                                                                                               |
| 17  | `inspectToolSchemas`              | แสดง diagnostics ของ schema ที่ provider เป็นเจ้าของหลังการ normalize                                           | provider ต้องการคำเตือนเกี่ยวกับ keywords โดยไม่ต้องสอนกฎเฉพาะ provider ให้กับ core                                                            |
| 18  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบ native หรือแบบติดแท็ก                                                          | provider ต้องการ reasoning/final output แบบติดแท็กแทนฟิลด์แบบ native                                                                           |
| 19  | `prepareExtraParams`              | normalize request params ก่อน generic stream option wrappers                                                    | provider ต้องการ request params เริ่มต้นหรือการล้างพารามิเตอร์ราย provider                                                                     |
| 20  | `createStreamFn`                  | แทนที่เส้นทาง stream ปกติทั้งหมดด้วย custom transport                                                           | provider ต้องการ wire protocol แบบกำหนดเอง ไม่ใช่เพียง wrapper                                                                                |
| 21  | `wrapStreamFn`                    | stream wrapper หลังจาก generic wrappers ถูกใช้แล้ว                                                              | provider ต้องการ wrappers สำหรับ request headers/body/model compat โดยไม่ต้องมี custom transport                                                 |
| 22  | `resolveTransportTurnState`       | แนบ headers หรือ metadata แบบ native ต่อ turn ให้กับ transport                                                  | provider ต้องการให้ generic transports ส่งตัวตนของ turn แบบ native ของ provider                                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | แนบ WebSocket headers แบบ native หรือนโยบาย cool-down ของเซสชัน                                                | provider ต้องการให้ generic WS transports ปรับ session headers หรือนโยบาย fallback                                                              |
| 24  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: stored profile จะกลายเป็นสตริง `apiKey` ของรันไทม์                                 | provider เก็บ auth metadata เพิ่มเติมและต้องการรูปร่าง token ของรันไทม์แบบกำหนดเอง                                                             |
| 25  | `refreshOAuth`                    | override การรีเฟรช OAuth สำหรับ endpoints ที่ใช้รีเฟรชแบบกำหนดเอง หรือนโยบายเมื่อรีเฟรชล้มเหลว                 | provider ไม่เข้ากับตัวรีเฟรช `pi-ai` ที่ใช้ร่วมกัน                                                                                              |
| 26  | `buildAuthDoctorHint`             | hint สำหรับการซ่อมแซมที่ถูกต่อท้ายเมื่อการรีเฟรช OAuth ล้มเหลว                                                  | provider ต้องการคำแนะนำซ่อมแซม auth ที่ provider เป็นเจ้าของหลังการรีเฟรชล้มเหลว                                                              |
| 27  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ provider เป็นเจ้าของ                                                       | provider มีข้อผิดพลาด overflow แบบดิบที่ heuristic ทั่วไปอาจพลาด                                                                               |
| 28  | `classifyFailoverReason`          | การจัดประเภทเหตุผลของ failover ที่ provider เป็นเจ้าของ                                                         | provider สามารถแมปข้อผิดพลาดของ API/transport แบบดิบไปเป็น rate-limit/overload ฯลฯ                                                           |
| 29  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับ proxy/backhaul providers                                                             | provider ต้องการการกำหนด cache TTL เฉพาะ proxy                                                                                                 |
| 30  | `buildMissingAuthMessage`         | ใช้แทนข้อความกู้คืนกรณี missing-auth แบบทั่วไป                                                                  | provider ต้องการ hint การกู้คืน missing-auth แบบเฉพาะ provider                                                                                 |
| 31  | `suppressBuiltInModel`            | การซ่อน upstream model ที่ล้าสมัย พร้อม user-facing error hint แบบเลือกได้                                      | provider ต้องการซ่อนแถว upstream ที่ล้าสมัย หรือแทนที่ด้วย hint ของผู้ขาย                                                                        |
| 32  | `augmentModelCatalog`             | เพิ่มแถวของ catalog แบบ synthetic/final ต่อท้ายหลัง discovery                                                   | provider ต้องการแถว forward-compat แบบ synthetic ใน `models list` และ pickers                                                                   |
| 33  | `resolveThinkingProfile`          | ชุดระดับ `/think`, ป้ายแสดงผล และค่าเริ่มต้นที่เฉพาะโมเดล                                                      | provider เปิดเผยลำดับการคิดแบบกำหนดเอง หรือป้าย binary สำหรับโมเดลที่เลือก                                                                      |
| 34  | `isBinaryThinking`                | hook ความเข้ากันได้ของการสลับ reasoning แบบ on/off                                                              | provider เปิดให้คิดแบบ binary on/off เท่านั้น                                                                                                   |
| 35  | `supportsXHighThinking`           | hook ความเข้ากันได้ของการรองรับ reasoning ระดับ `xhigh`                                                         | provider ต้องการให้ `xhigh` ใช้ได้กับเพียงบางโมเดล                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | hook ความเข้ากันได้ของระดับ `/think` เริ่มต้น                                                                   | provider เป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับตระกูลโมเดล                                                                                  |
| 37  | `isModernModelRef`                | ตัวจับคู่โมเดลสมัยใหม่สำหรับตัวกรองโปรไฟล์แบบสดและการเลือก smoke                                              | ผู้ให้บริการเป็นเจ้าของการจับคู่โมเดลที่ต้องการสำหรับ live/smoke                                                                                             |
| 38  | `prepareRuntimeAuth`              | แลกเปลี่ยนข้อมูลรับรองที่กำหนดค่าไว้ให้เป็นโทเค็น/คีย์รันไทม์จริงก่อนการอนุมานทันที                       | ผู้ให้บริการต้องมีการแลกเปลี่ยนโทเค็นหรือข้อมูลรับรองคำขอแบบอายุสั้น                                                                             |
| 39  | `resolveUsageAuth`                | จัดการข้อมูลรับรองการใช้งาน/การเรียกเก็บเงินสำหรับ `/usage` และหน้าสถานะที่เกี่ยวข้อง                                     | ผู้ให้บริการต้องมีการแยกวิเคราะห์โทเค็นการใช้งาน/โควตาแบบกำหนดเอง หรือใช้ข้อมูลรับรองการใช้งานที่แตกต่างออกไป                                                               |
| 40  | `fetchUsageSnapshot`              | ดึงและปรับให้เป็นมาตรฐานซึ่งสแนปช็อตการใช้งาน/โควตาเฉพาะของผู้ให้บริการหลังจากจัดการการยืนยันตัวตนแล้ว                             | ผู้ให้บริการต้องมีเอ็นด์พอยต์การใช้งานหรือ parser ของ payload ที่เฉพาะกับผู้ให้บริการ                                                                           |
| 41  | `createEmbeddingProvider`         | สร้างอะแดปเตอร์ embedding ที่ผู้ให้บริการเป็นเจ้าของสำหรับหน่วยความจำ/การค้นหา                                                     | พฤติกรรม embedding ของหน่วยความจำควรอยู่กับ Plugin ของผู้ให้บริการ                                                                                    |
| 42  | `buildReplayPolicy`               | ส่งคืนนโยบายการเล่นซ้ำที่ควบคุมการจัดการทรานสคริปต์สำหรับผู้ให้บริการ                                        | ผู้ให้บริการต้องมีนโยบายทรานสคริปต์แบบกำหนดเอง (เช่น การตัดบล็อกความคิดออก)                                                               |
| 43  | `sanitizeReplayHistory`           | เขียนประวัติการเล่นซ้ำใหม่หลังจากการล้างทรานสคริปต์ทั่วไป                                                        | ผู้ให้บริการต้องมีการเขียนการเล่นซ้ำใหม่แบบเฉพาะของผู้ให้บริการนอกเหนือจากตัวช่วย Compaction ที่ใช้ร่วมกัน                                                             |
| 44  | `validateReplayTurns`             | การตรวจสอบหรือปรับรูปแบบรอบการเล่นซ้ำขั้นสุดท้ายก่อน embedded runner                                           | ทรานสปอร์ตของผู้ให้บริการต้องมีการตรวจสอบรอบที่เข้มงวดขึ้นหลังจากการล้างข้อมูลทั่วไป                                                                    |
| 45  | `onModelSelected`                 | เรียกใช้ผลข้างเคียงหลังการเลือกที่ผู้ให้บริการเป็นเจ้าของ                                                                 | ผู้ให้บริการต้องมี telemetry หรือสถานะที่ผู้ให้บริการเป็นเจ้าของเมื่อโมเดลกลายเป็นโมเดลที่ใช้งานอยู่                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ Plugin ผู้ให้บริการที่ตรงกันก่อน จากนั้นจึงไล่ตรวจ Plugin ผู้ให้บริการอื่นที่รองรับ hook จนกว่าจะพบตัวที่เปลี่ยน model id หรือ transport/config จริง ๆ วิธีนี้ช่วยให้ shim ของผู้ให้บริการสำหรับ alias/compat ยังคงทำงานได้ โดยไม่บังคับให้ผู้เรียกต้องรู้ว่า Plugin ที่บันเดิลตัวใดเป็นเจ้าของการเขียนค่านั้นใหม่ หากไม่มี hook ของผู้ให้บริการตัวใดเขียนรายการ config ที่รองรับในตระกูล Google ใหม่ ตัว normalizer ของ config Google ที่บันเดิลไว้ก็ยังคงทำการเก็บกวาดด้านความเข้ากันได้นั้นต่อไป

หากผู้ให้บริการต้องใช้ wire protocol แบบกำหนดเองทั้งหมด หรือตัวดำเนินการคำขอแบบกำหนดเองทั้งหมด นั่นเป็นส่วนขยายอีกประเภทหนึ่ง hook เหล่านี้มีไว้สำหรับพฤติกรรมของผู้ให้บริการที่ยังคงทำงานอยู่บนลูปการอนุมานปกติของ OpenClaw

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

### ตัวอย่างที่มีมาในตัว

Plugin ผู้ให้บริการที่บันเดิลมาจะรวม hook ข้างต้นเข้าด้วยกันเพื่อรองรับความต้องการด้าน catalog, auth, thinking, replay และ usage ของผู้จำหน่ายแต่ละราย ชุด hook ที่เป็นทางการจะอยู่กับแต่ละ Plugin ภายใต้ `extensions/`; หน้านี้มีไว้เพื่อแสดงรูปแบบโดยไม่ทำรายการให้ตรงกับต้นฉบับทั้งหมด

<AccordionGroup>
  <Accordion title="ผู้ให้บริการ catalog แบบส่งผ่าน">
    OpenRouter, Kilocode, Z.AI, xAI ลงทะเบียน `catalog` พร้อมกับ
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถแสดง model id จากต้นทางได้ก่อน catalog แบบคงที่ของ OpenClaw
  </Accordion>
  <Accordion title="ผู้ให้บริการ OAuth และเอ็นด์พอยต์ usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของการแลกเปลี่ยนโทเค็นและการผสานรวม `/usage`
  </Accordion>
  <Accordion title="ตระกูล replay และการเก็บกวาดทรานสคริปต์">
    ตระกูลที่มีชื่อร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ผู้ให้บริการเลือกใช้
    นโยบายทรานสคริปต์ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin
    จะต้องนำการเก็บกวาดกลับไปทำใหม่เอง
  </Accordion>
  <Accordion title="ผู้ให้บริการเฉพาะ catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, และ
    `volcengine` ลงทะเบียนเพียง `catalog` และทำงานบนลูปการอนุมานที่ใช้ร่วมกัน
  </Accordion>
  <Accordion title="ตัวช่วยสตรีมเฉพาะของ Anthropic">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam สาธารณะ `api.ts` / `contract-api.ts` ของ Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK แบบทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วยรันไทม์

Plugins สามารถเข้าถึงตัวช่วยจากแกนระบบที่เลือกไว้ผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` ส่งคืน payload เอาต์พุต TTS ปกติของแกนระบบสำหรับพื้นผิวไฟล์/ข้อความเสียง
- ใช้การกำหนดค่า `messages.tts` และการเลือกผู้ให้บริการของแกนระบบ
- ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มสัญญาณ Plugins ต้อง resample/encode สำหรับผู้ให้บริการ
- `listVoices` เป็นตัวเลือกเพิ่มเติมต่อผู้ให้บริการ ใช้สำหรับตัวเลือกเสียงหรือโฟลว์การตั้งค่าที่ผู้จำหน่ายเป็นเจ้าของ
- รายการเสียงสามารถมีเมทาดาทาที่สมบูรณ์ขึ้นได้ เช่น locale, gender และแท็กบุคลิกภาพ สำหรับตัวเลือกที่รับรู้ผู้ให้บริการ
- ปัจจุบัน OpenAI และ ElevenLabs รองรับการใช้งานทางโทรศัพท์ Microsoft ยังไม่รองรับ

Plugins ยังสามารถลงทะเบียนผู้ให้บริการเสียงพูดผ่าน `api.registerSpeechProvider(...)` ได้

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

- เก็บนโยบาย TTS, fallback และการส่งคำตอบไว้ในแกนระบบ
- ใช้ผู้ให้บริการเสียงพูดสำหรับพฤติกรรมการสังเคราะห์ที่ผู้จำหน่ายเป็นเจ้าของ
- อินพุต `edge` แบบเดิมของ Microsoft จะถูกทำให้เป็นมาตรฐานเป็น provider id `microsoft`
- รูปแบบความเป็นเจ้าของที่แนะนำคือยึดตามบริษัท: Plugin ของผู้จำหน่ายหนึ่งตัวสามารถเป็นเจ้าของ
  ผู้ให้บริการข้อความ เสียงพูด รูปภาพ และสื่อประเภทอื่นในอนาคตเมื่อ OpenClaw เพิ่ม
  สัญญาความสามารถเหล่านั้น

สำหรับการทำความเข้าใจรูปภาพ/เสียง/วิดีโอ Plugins จะลงทะเบียน
ผู้ให้บริการ media-understanding แบบมีชนิดหนึ่งตัว แทนที่จะเป็น bag แบบคีย์/ค่าทั่วไป:

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

- เก็บ orchestration, fallback, config และการเชื่อมต่อช่องทางไว้ในแกนระบบ
- เก็บพฤติกรรมของผู้จำหน่ายไว้ใน Plugin ผู้ให้บริการ
- การขยายแบบเพิ่มเติมควรคงความเป็นชนิด: เมธอดทางเลือกใหม่, ฟิลด์ผลลัพธ์ทางเลือกใหม่, ความสามารถทางเลือกใหม่
- การสร้างวิดีโอก็ใช้รูปแบบเดียวกันอยู่แล้ว:
  - แกนระบบเป็นเจ้าของสัญญาความสามารถและตัวช่วยรันไทม์
  - Plugin ของผู้จำหน่ายลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - Plugin ฟีเจอร์/ช่องทางใช้ `api.runtime.videoGeneration.*`

สำหรับตัวช่วยรันไทม์ media-understanding Plugins สามารถเรียกใช้ได้ดังนี้:

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

สำหรับการถอดเสียงจากเสียง Plugins สามารถใช้ได้ทั้งรันไทม์ media-understanding
หรือ alias STT แบบเดิม:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ
  การทำความเข้าใจรูปภาพ/เสียง/วิดีโอ
- ใช้การกำหนดค่าเสียง media-understanding ของแกนระบบ (`tools.media.audio`) และลำดับ fallback ของผู้ให้บริการ
- ส่งคืน `{ text: undefined }` เมื่อไม่มีผลลัพธ์การถอดเสียงเกิดขึ้น (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงมีอยู่ในฐานะ alias เพื่อความเข้ากันได้

Plugins ยังสามารถเริ่มการรัน subagent เบื้องหลังผ่าน `api.runtime.subagent`:

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

- `provider` และ `model` เป็นการแทนที่ต่อการรันแบบไม่บันทึกถาวร ไม่ใช่การเปลี่ยนแปลงเซสชันถาวร
- OpenClaw จะยอมรับฟิลด์แทนที่เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับการรัน fallback ที่ Plugin เป็นเจ้าของ ผู้ปฏิบัติการต้องเลือกเปิดใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เฉพาะเป้าหมาย `provider/model` แบบ canonical ที่กำหนด หรือ `"*"` เพื่ออนุญาตทุกเป้าหมายอย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่เชื่อถือได้ยังคงทำงานได้ แต่คำขอแทนที่จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ

สำหรับการค้นหาเว็บ Plugins สามารถใช้ตัวช่วยรันไทม์ที่ใช้ร่วมกันแทนการ
เข้าถึงการเชื่อมต่อเครื่องมือของเอเจนต์โดยตรง:

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

Plugins ยังสามารถลงทะเบียนผู้ให้บริการค้นหาเว็บผ่าน
`api.registerWebSearchProvider(...)` ได้

หมายเหตุ:

- เก็บการเลือกผู้ให้บริการ การจัดการข้อมูลรับรอง และ semantics ของคำขอที่ใช้ร่วมกันไว้ในแกนระบบ
- ใช้ผู้ให้บริการค้นหาเว็บสำหรับทรานสปอร์ตการค้นหาเฉพาะของผู้จำหน่าย
- `api.runtime.webSearch.*` คือพื้นผิวที่ใช้ร่วมกันที่แนะนำสำหรับ Plugin ฟีเจอร์/ช่องทางที่ต้องการพฤติกรรมการค้นหาโดยไม่ต้องพึ่ง wrapper เครื่องมือของเอเจนต์

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

- `generate(...)`: สร้างรูปภาพโดยใช้สายโซ่ผู้ให้บริการสร้างรูปภาพที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการผู้ให้บริการสร้างรูปภาพที่มีอยู่และความสามารถของแต่ละราย

## เส้นทาง HTTP ของ Gateway

Plugins สามารถเปิดเผยเอ็นด์พอยต์ HTTP ได้ด้วย `api.registerHttpRoute(...)`

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

- `path`: เส้นทาง route ภายใต้เซิร์ฟเวอร์ HTTP ของ Gateway
- `auth`: ต้องระบุ ใช้ `"gateway"` เพื่อบังคับใช้ auth ของ Gateway ตามปกติ หรือ `"plugin"` สำหรับ auth/การตรวจสอบ Webhook ที่ Plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ Plugin เดียวกันแทนที่การลงทะเบียน route เดิมของตัวเองได้
- `handler`: ส่งคืน `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้วและจะทำให้เกิดข้อผิดพลาดในการโหลด Plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- route ของ Plugin ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบตรงกันจะถูกปฏิเสธ เว้นแต่จะกำหนด `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่ route ของอีก Plugin หนึ่งได้
- route ที่ทับซ้อนกันแต่มีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คงสาย fallthrough ของ `exact`/`prefix` ไว้ในระดับ auth เดียวกันเท่านั้น
- route ที่ใช้ `auth: "plugin"` จะ **ไม่ได้** รับขอบเขตรันไทม์ของผู้ปฏิบัติการโดยอัตโนมัติ เหมาะสำหรับ Webhook/การตรวจสอบลายเซ็นที่ Plugin จัดการเอง ไม่ใช่สำหรับการเรียกตัวช่วย Gateway แบบมีสิทธิพิเศษ
- route ที่ใช้ `auth: "gateway"` จะทำงานภายในขอบเขตรันไทม์ของคำขอ Gateway แต่ขอบเขตนั้นถูกจำกัดอย่างตั้งใจ:
  - การยืนยันตัวตนแบบ bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) จะตรึงขอบเขตรันไทม์ของ route ของ Plugin ไว้ที่ `operator.write` แม้ว่าผู้เรียกจะส่ง `x-openclaw-scopes`
  - โหมด HTTP ที่เชื่อถือได้และมีตัวตนผู้ร้องขอ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะยอมรับ `x-openclaw-scopes` ก็ต่อเมื่อมี header นี้ถูกส่งมาอย่างชัดเจนเท่านั้น
  - หากไม่มี `x-openclaw-scopes` ในคำขอ route ของ Plugin ที่มีตัวตนผู้ร้องขอเหล่านั้น ขอบเขตรันไทม์จะ fallback ไปที่ `operator.write`
- กฎเชิงปฏิบัติ: อย่าคิดว่า route ของ Plugin ที่ยืนยันตัวตนด้วย gateway เป็นพื้นผิวผู้ดูแลระบบโดยปริยาย หาก route ของคุณต้องการพฤติกรรมที่จำกัดเฉพาะผู้ดูแลระบบ ให้กำหนดให้ใช้โหมด auth ที่มีตัวตนผู้ร้องขอ และจัดทำเอกสารสัญญาของ header `x-openclaw-scopes` ที่ต้องส่งอย่างชัดเจน

## เส้นทาง import ของ Plugin SDK

ใช้ subpath ของ SDK แบบเจาะจงแทน root barrel แบบรวม `openclaw/plugin-sdk`
เมื่อเขียน Plugin ใหม่ subpath หลักของแกนระบบมีดังนี้:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วย entry/build ของช่องทาง                        |
| `openclaw/plugin-sdk/core`          | ตัวช่วยที่ใช้ร่วมกันทั่วไปและ umbrella contract       |
| `openclaw/plugin-sdk/config-schema` | Zod schema ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |

Plugin ช่องทางจะเลือกใช้จากชุด seam แบบเจาะจงหลายตัว — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมศูนย์อยู่บน
contract `approvalCapability` เดียว แทนการผสมข้ามฟิลด์ Plugin ที่ไม่เกี่ยวข้องกัน
ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)

ตัวช่วยรันไทม์และ config อยู่ภายใต้ subpath `*-runtime` ที่สอดคล้องกัน
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` เป็นต้น)

<Info>
`openclaw/plugin-sdk/channel-runtime` เลิกใช้แล้ว — เป็น shim เพื่อความเข้ากันได้สำหรับ
Plugin รุ่นเก่า โค้ดใหม่ควร import primitive ทั่วไปที่แคบลงแทน
</Info>

จุดเข้าใช้งานภายใน repo (ต่อ root package ของ Plugin ที่บันเดิลแต่ละตัว):

- `index.js` — จุดเข้า Plugin ที่บันเดิล
- `api.js` — barrel สำหรับ helper/types
- `runtime-api.js` — barrel สำหรับ runtime-only
- `setup-entry.js` — จุดเข้า setup Plugin

Plugin ภายนอกควร import เฉพาะ subpath `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของ package Plugin อื่นจากแกนระบบหรือจาก Plugin อื่น
จุดเข้าที่โหลดผ่าน facade จะเลือกใช้สแนปช็อต config รันไทม์ที่กำลังใช้งานอยู่หากมี
จากนั้นจึง fallback ไปยังไฟล์ config ที่ resolve ได้บนดิสก์

subpath เฉพาะด้านความสามารถ เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ Plugin ที่บันเดิลใช้มันอยู่ในปัจจุบัน
สิ่งเหล่านี้ไม่ได้เป็นสัญญาภายนอกระยะยาวที่ถูกตรึงไว้อัตโนมัติ —
ตรวจสอบหน้าอ้างอิง SDK ที่เกี่ยวข้องเมื่อจะพึ่งพามัน

## Schema ของเครื่องมือข้อความ

Plugins ควรเป็นเจ้าของส่วนเติมเต็ม schema ของ `describeMessageTool(...)` แบบเฉพาะช่องทาง
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reaction, read และ poll
การนำเสนอการส่งที่ใช้ร่วมกันควรใช้ contract `MessagePresentation` แบบทั่วไป
แทนฟิลด์ปุ่ม component block หรือ card แบบ native ของผู้ให้บริการ
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับ contract,
กฎ fallback, การแมปผู้ให้บริการ และรายการตรวจสอบสำหรับผู้เขียน Plugin

Plugin ที่ส่งข้อความได้จะประกาศสิ่งที่สามารถเรนเดอร์ได้ผ่าน message capabilities:

- `presentation` สำหรับบล็อกการนำเสนอเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอส่งแบบปักหมุด

แกนระบบจะตัดสินใจว่าจะเรนเดอร์ presentation แบบ native หรือ degrade เป็นข้อความ
อย่าเปิดช่องทางหนีไปใช้ UI แบบ native ของผู้ให้บริการจากเครื่องมือข้อความแบบทั่วไป
ตัวช่วย SDK ที่เลิกใช้แล้วสำหรับ schema native แบบเดิมยังคง export ไว้สำหรับ
Plugin ภายนอกของบุคคลที่สามที่มีอยู่แล้ว แต่ Plugin ใหม่ไม่ควรใช้งาน

## การ resolve เป้าหมายของช่องทาง

Plugin ช่องทางควรเป็นเจ้าของ semantics ของเป้าหมายแบบเฉพาะช่องทาง
คงโฮสต์ขาออกที่ใช้ร่วมกันให้เป็นแบบทั่วไป และใช้พื้นผิว messaging adapter สำหรับกฎของผู้ให้บริการ:

- `messaging.inferTargetChatType({ to })` ตัดสินว่าเป้าหมายที่ normalize แล้ว
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อนค้นหาใน directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอกแกนระบบว่า
  อินพุตควรข้ามไปยังการ resolve แบบ id-like โดยตรงแทนการค้นหาใน directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ Plugin เมื่อ
  แกนระบบต้องการการ resolve ขั้นสุดท้ายที่ผู้ให้บริการเป็นเจ้าของหลังการ normalize
  หรือหลังหาไม่พบใน directory
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route
  แบบเฉพาะผู้ให้บริการเมื่อ resolve เป้าหมายได้แล้ว

การแยกความรับผิดชอบที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจเรื่องหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peer/group
- ใช้ `looksLikeId` สำหรับการตรวจว่า "ให้ปฏิบัติกับสิ่งนี้เป็น target id แบบ explicit/native"
- ใช้ `resolveTarget` สำหรับ fallback การ normalize แบบเฉพาะผู้ให้บริการ ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- เก็บ id แบบ native ของผู้ให้บริการ เช่น chat id, thread id, JID, handle และ room
  id ไว้ภายในค่า `target` หรือพารามิเตอร์เฉพาะผู้ให้บริการ ไม่ใช่ในฟิลด์ SDK ทั่วไป

## Directory ที่อิงตาม config

Plugins ที่สร้างรายการ directory จาก config ควรเก็บตรรกะนั้นไว้ใน
Plugin และใช้ตัวช่วยที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/directory-runtime`

ใช้สิ่งนี้เมื่อช่องทางต้องการ peer/group ที่อิงตาม config เช่น:

- peer ของ DM ที่ขับเคลื่อนด้วย allowlist
- แผนที่ channel/group ที่กำหนดค่าไว้
- fallback แบบ static ของ directory ที่อิงตามขอบเขตบัญชี

ตัวช่วยที่ใช้ร่วมกันใน `directory-runtime` จะจัดการเฉพาะงานทั่วไป:

- การกรอง query
- การใช้ limit
- ตัวช่วย deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id แบบเฉพาะช่องทางควรอยู่ใน implementation
ของ Plugin

## Catalog ของผู้ให้บริการ

Plugin ผู้ให้บริการสามารถกำหนด model catalog สำหรับการอนุมานได้ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` ส่งคืนรูปแบบเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับรายการผู้ให้บริการหนึ่งรายการ
- `{ providers }` สำหรับหลายรายการผู้ให้บริการ

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ model id แบบเฉพาะผู้ให้บริการ ค่าเริ่มต้น
ของ base URL หรือ metadata ของโมเดลที่ถูกควบคุมด้วย auth

`catalog.order` ควบคุมว่า catalog ของ Plugin จะถูกรวมเมื่อใดเมื่อเทียบกับ
ผู้ให้บริการ implicit ที่มีมาในตัวของ OpenClaw:

- `simple`: ผู้ให้บริการธรรมดาที่ขับเคลื่อนด้วย API key หรือ env
- `profile`: ผู้ให้บริการที่ปรากฏเมื่อมี auth profile
- `paired`: ผู้ให้บริการที่สังเคราะห์รายการผู้ให้บริการที่เกี่ยวข้องหลายรายการ
- `late`: รอบสุดท้าย หลังจากผู้ให้บริการ implicit อื่น ๆ

ผู้ให้บริการที่มาทีหลังจะชนะเมื่อ key ชนกัน ดังนั้น Plugin จึงสามารถตั้งใจ override
รายการผู้ให้บริการที่มีมาในตัวซึ่งมี provider id เดียวกันได้

ความเข้ากันได้:

- `discovery` ยังใช้งานได้ในฐานะ alias แบบเดิม
- หากลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`

## การตรวจสอบช่องทางแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนช่องทาง ให้พิจารณา implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทางรันไทม์ โดยสามารถสมมติได้ว่าข้อมูลรับรอง
  ถูก materialize อย่างครบถ้วนแล้ว และสามารถล้มเหลวอย่างรวดเร็วเมื่อไม่มี secret ที่จำเป็น
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และโฟลว์ doctor/config
  repair ไม่ควรต้อง materialize ข้อมูลรับรองรันไทม์เพียงเพื่ออธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- ส่งคืนเฉพาะสถานะบัญชีเชิงพรรณนา
- คงค่า `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะของข้อมูลรับรองเมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องส่งคืนค่าโทเค็นดิบเพียงเพื่อรายงานความพร้อมใช้งานแบบอ่านอย่างเดียว
  การส่งคืน `tokenStatus: "available"` (พร้อมฟิลด์แหล่งที่มาที่สอดคล้องกัน)
  ก็เพียงพอแล้วสำหรับคำสั่งแนว status
- ใช้ `configured_unavailable` เมื่อข้อมูลรับรองถูกกำหนดค่าไว้ผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

สิ่งนี้ช่วยให้คำสั่งแบบอ่านอย่างเดียวรายงานว่า "กำหนดค่าไว้แล้วแต่ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้"
แทนที่จะล้มเหลวหรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## ชุดแพ็กเกจ

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

แต่ละรายการจะกลายเป็น Plugin หากแพ็กระบุ extension หลายตัว id ของ Plugin
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import dependency จาก npm ให้ติดตั้งไว้ในไดเรกทอรีนั้นเพื่อให้
`node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

ข้อป้องกันด้านความปลอดภัย: ทุก entry ใน `openclaw.extensions` ต้องยังคงอยู่ภายใน
ไดเรกทอรี Plugin หลังการ resolve symlink รายการที่หลุดออกนอกไดเรกทอรี package
จะถูกปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` จะติดตั้ง dependency ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` แบบ local ต่อโปรเจกต์ (ไม่มี lifecycle scripts,
ไม่มี dev dependencies ตอนรันไทม์) โดยไม่สนใจการตั้งค่า npm install แบบ global ที่สืบทอดมา
ให้คงต้นไม้ dependency ของ Plugin ให้เป็น "pure JS/TS" และหลีกเลี่ยงแพ็กเกจที่ต้องมี
การ build ผ่าน `postinstall`

ทางเลือกเพิ่มเติม: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลเบา ๆ ที่มีไว้สำหรับ setup เท่านั้น
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ Plugin ช่องทางที่ถูกปิดใช้งาน หรือ
เมื่อ Plugin ช่องทางเปิดใช้งานอยู่แต่ยังไม่ถูกกำหนดค่า ระบบจะโหลด `setupEntry`
แทน entry หลักของ Plugin ทั้งหมด วิธีนี้ช่วยให้การเริ่มต้นทำงานและ setup เบาขึ้น
เมื่อ entry หลักของ Plugin ของคุณยังต่อเครื่องมือ hook หรือโค้ดอื่นที่มีเฉพาะรันไทม์ด้วย

ทางเลือกเพิ่มเติม: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถเลือกให้ Plugin ช่องทางใช้เส้นทาง `setupEntry` เดียวกันในช่วง startup
ก่อนเริ่ม listen ของ gateway ได้ แม้ว่าช่องทางนั้นจะถูกกำหนดค่าไว้แล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ทั้งหมดที่ต้องมีอยู่
ก่อนที่ gateway จะเริ่ม listen ในทางปฏิบัติ นั่นหมายความว่า setup entry
ต้องลงทะเบียนความสามารถทุกอย่างที่เป็นของช่องทางซึ่ง startup พึ่งพา เช่น:

- การลงทะเบียนช่องทางเอง
- route HTTP ใด ๆ ที่ต้องพร้อมใช้งานก่อนที่ gateway จะเริ่ม listen
- method, tool หรือ service ของ gateway ใด ๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก entry แบบเต็มของคุณยังคงเป็นเจ้าของความสามารถ startup ที่จำเป็นใด ๆ อยู่ อย่าเปิดใช้
แฟล็กนี้ ให้คง Plugin ไว้ที่พฤติกรรมค่าเริ่มต้น และให้ OpenClaw โหลด entry แบบเต็มระหว่าง startup

ช่องทางที่บันเดิลยังสามารถเผยแพร่ helper ของพื้นผิว contract สำหรับ setup-only ที่แกนระบบ
สามารถใช้ได้ก่อนจะโหลดรันไทม์ช่องทางแบบเต็ม พื้นผิวการเลื่อนระดับ setup ปัจจุบันมีดังนี้:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

แกนระบบใช้พื้นผิวนี้เมื่อจำเป็นต้องเลื่อนระดับ config ช่องทางแบบบัญชีเดียวรุ่นเก่า
ไปเป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลด entry หลักของ Plugin แบบเต็ม
Matrix คือตัวอย่างที่บันเดิลอยู่ในปัจจุบัน: มันย้ายเฉพาะคีย์ auth/bootstrap ไปยังบัญชี
ที่ถูกเลื่อนระดับแบบมีชื่อเมื่อมี named account อยู่แล้ว และสามารถคงคีย์ default-account
ที่ไม่เป็น canonical แต่ถูกกำหนดค่าไว้ แทนที่จะสร้าง `accounts.default` เสมอ

adapter สำหรับแพตช์ setup เหล่านั้นช่วยให้การค้นพบพื้นผิว contract ของสิ่งที่บันเดิล
ยังคงเป็นแบบ lazy เวลา import จึงยังเบาอยู่; พื้นผิวการเลื่อนระดับจะถูกโหลดเมื่อถูกใช้ครั้งแรกเท่านั้น
แทนที่จะย้อนกลับไปเข้าสู่ startup ของช่องทางที่บันเดิลในตอน import โมดูล

เมื่อพื้นผิว startup เหล่านั้นรวม method ของ Gateway RPC ไว้ด้วย ให้คงไว้ภายใต้
prefix แบบเฉพาะของ Plugin namespace ผู้ดูแลระบบของแกนระบบ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้ และจะ resolve
เป็น `operator.admin` เสมอ แม้ว่า Plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

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

### เมทาดาทา catalog ของช่องทาง

Plugin ช่องทางสามารถโฆษณาเมทาดาทาสำหรับ setup/discovery ผ่าน `openclaw.channel` และ
คำแนะนำการติดตั้งผ่าน `openclaw.install` ซึ่งช่วยให้ข้อมูล catalog ของแกนระบบไม่ต้องมีข้อมูลผูกตายตัว

ตัวอย่าง:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (โฮสต์เอง)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "แชตแบบโฮสต์เองผ่าน Webhook bot ของ Nextcloud Talk",
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

- `detailLabel`: ป้ายกำกับรองสำหรับพื้นผิว catalog/status ที่ละเอียดขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการ catalog นี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความในพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนช่องทางจากพื้นผิวรายการช่องทางที่กำหนดค่าแล้วเมื่อกำหนดเป็น `false`
- `exposure.setup`: ซ่อนช่องทางจากตัวเลือก setup/configure แบบโต้ตอบเมื่อกำหนดเป็น `false`
- `exposure.docs`: ทำเครื่องหมายช่องทางว่าเป็นภายใน/ส่วนตัวสำหรับพื้นผิวการนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังยอมรับได้เพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้ช่องทางเข้าร่วมโฟลว์ `allowFrom` ของ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับการผูกบัญชีแบบชัดเจนแม้ว่าจะมีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับการค้นหา session เมื่อ resolve เป้าหมายการประกาศ

OpenClaw ยังสามารถรวม **catalog ช่องทางภายนอก** ได้ด้วย (เช่น export จาก
registry ของ MPM) ให้วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือหลายไฟล์ (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์ควร
มี `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมสำหรับคีย์ `"entries"` ได้ด้วย

รายการ catalog ช่องทางที่สร้างขึ้นและรายการ catalog การติดตั้งผู้ให้บริการจะแสดง
ข้อเท็จจริงของแหล่งติดตั้งที่ normalize แล้วถัดจากบล็อก `openclaw.install` แบบดิบ
ข้อเท็จจริงที่ normalize แล้วจะระบุว่า npm spec เป็นเวอร์ชันแบบ exact หรือเป็นตัวเลือกแบบลอยตัว
มีเมทาดาทา integrity ที่คาดหวังหรือไม่ และมีพาธแหล่งที่มาแบบ local ให้ใช้ด้วยหรือไม่
เมื่อทราบ identity ของ catalog/package แล้ว ข้อเท็จจริงที่ normalize แล้วจะเตือนหากชื่อ
แพ็กเกจ npm ที่ parse ได้เบี่ยงเบนจาก identity นั้น
นอกจากนี้ยังเตือนเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่มา
ที่ไม่มีอยู่ และเมื่อมีเมทาดาทา integrity ของ npm แต่ไม่มีแหล่ง npm ที่ถูกต้อง
ผู้ใช้ข้อมูลควรถือว่า `installSource` เป็นฟิลด์ทางเลือกแบบเพิ่มเติม เพื่อให้
รายการที่สร้างด้วยมือและ shim ของ catalog ไม่จำเป็นต้องสังเคราะห์มัน
สิ่งนี้ช่วยให้ onboarding และการวินิจฉัยอธิบายสถานะของ source plane ได้โดยไม่ต้อง
import รันไทม์ของ Plugin

รายการ npm ภายนอกอย่างเป็นทางการควรใช้ `npmSpec` แบบ exact พร้อม
`expectedIntegrity` ชื่อแพ็กเกจเปล่าและ dist-tag ยังคงใช้งานได้เพื่อความเข้ากันได้
แต่จะแสดงคำเตือนของ source plane เพื่อให้ catalog ค่อย ๆ ขยับไปสู่การติดตั้งแบบ pin เวอร์ชัน
และตรวจสอบ integrity โดยไม่ทำให้ Plugin ที่มีอยู่ใช้งานไม่ได้
เมื่อ onboarding ติดตั้งจากพาธ catalog แบบ local ระบบจะบันทึกรายการดัชนี Plugin ที่ถูกจัดการ
โดยใช้ `source: "path"` และ `sourcePath` แบบ relative ต่อ workspace เมื่อทำได้
พาธโหลดเชิงปฏิบัติการแบบ absolute จะยังคงอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งจะหลีกเลี่ยงการทำซ้ำพาธ local ของเวิร์กสเตชัน
ลงใน config ที่มีอายุยืน สิ่งนี้ช่วยให้การติดตั้งเพื่อการพัฒนาในเครื่องมองเห็นได้จาก
การวินิจฉัย source plane โดยไม่เพิ่มพื้นผิวการเปิดเผยพาธระบบไฟล์ดิบเป็นชุดที่สอง
ดัชนี Plugin ที่ persist ไว้ใน `plugins/installs.json` คือแหล่งจริงของข้อมูลการติดตั้ง
และสามารถรีเฟรชได้โดยไม่ต้องโหลดโมดูลรันไทม์ของ Plugin
แม็ป `installRecords` ของมันคงทนแม้เมื่อ manifest ของ Plugin จะหายไปหรือไม่ถูกต้อง;
อาร์เรย์ `plugins` ของมันเป็นมุมมอง manifest/cache ที่สร้างใหม่ได้

## Plugin เอนจินบริบท

Plugin เอนจินบริบทเป็นเจ้าของ orchestration ของบริบทเซสชันสำหรับ ingest, assembly
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือกเอนจินที่ใช้งานผ่าน
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องการแทนที่หรือขยาย pipeline บริบทเริ่มต้น
แทนที่จะเพียงเพิ่มการค้นหาหน่วยความจำหรือ hook

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

หากเอนจินของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึม Compaction ให้คง `compact()`
ไว้และ delegate อย่างชัดเจน:

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

## การเพิ่มความสามารถใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้าม
ระบบ Plugin ด้วยการเข้าถึงภายในแบบส่วนตัว ให้เพิ่มความสามารถที่ขาดอยู่

ลำดับที่แนะนำ:

1. กำหนด contract ของแกนระบบ
   ตัดสินใจว่าพฤติกรรมร่วมใดที่แกนระบบควรเป็นเจ้าของ: policy, fallback, การรวม config,
   lifecycle, semantics ที่หันหน้าเข้าหาช่องทาง และรูปแบบของตัวช่วยรันไทม์
2. เพิ่มพื้นผิวการลงทะเบียน/รันไทม์ของ Plugin แบบมีชนิด
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิวความสามารถแบบมีชนิด
   ที่เล็กที่สุดแต่ใช้งานได้จริง
3. เดินสายแกนระบบ + ผู้ใช้ระดับช่องทาง/ฟีเจอร์
   ช่องทางและ Plugin ฟีเจอร์ควรใช้ความสามารถใหม่ผ่านแกนระบบ
   ไม่ใช่โดย import implementation ของผู้จำหน่ายโดยตรง
4. ลงทะเบียน implementation ของผู้จำหน่าย
   จากนั้น Plugin ของผู้จำหน่ายจึงลงทะเบียน backend ของตนเข้ากับความสามารถนั้น
5. เพิ่มการครอบคลุมระดับ contract
   เพิ่มการทดสอบเพื่อให้รูปแบบ ownership และการลงทะเบียนยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw ยังคงมีแนวทางชัดเจนโดยไม่กลายเป็นระบบที่ hardcode ตาม
มุมมองของผู้ให้บริการรายใดรายหนึ่ง ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับรายการไฟล์แบบเป็นรูปธรรมและตัวอย่างที่ทำครบแล้ว

### รายการตรวจสอบความสามารถ

เมื่อคุณเพิ่มความสามารถใหม่ implementation โดยทั่วไปควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- ชนิด contract ของแกนระบบใน `src/<capability>/types.ts`
- runner/ตัวช่วยรันไทม์ของแกนระบบใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียน Plugin API ใน `src/plugins/types.ts`
- การเดินสาย registry ของ Plugin ใน `src/plugins/registry.ts`
- การเปิดเผยรันไทม์ของ Plugin ใน `src/plugins/runtime/*` เมื่อ Plugin ฟีเจอร์/ช่องทาง
  ต้องใช้มัน
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- assertion ด้าน ownership/contract ใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับผู้ปฏิบัติการ/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป โดยทั่วไปนั่นเป็นสัญญาณว่าความสามารถนั้น
ยังไม่ได้ผสานรวมอย่างสมบูรณ์

### แม่แบบความสามารถ

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

สิ่งนี้ทำให้กฎเรียบง่าย:

- แกนระบบเป็นเจ้าของ contract + orchestration ของความสามารถ
- Plugin ของผู้จำหน่ายเป็นเจ้าของ implementation ของผู้จำหน่าย
- Plugin ฟีเจอร์/ช่องทางใช้ตัวช่วยรันไทม์
- การทดสอบ contract ทำให้ ownership ชัดเจน

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — โมเดลและรูปแบบความสามารถสาธารณะ
- [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugins](/th/plugins/building-plugins)
