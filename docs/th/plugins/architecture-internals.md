---
read_when:
    - การติดตั้งใช้งาน provider runtime hooks, วงจรชีวิตของแชนเนล หรือ package packs
    - การดีบักลำดับการโหลด Plugin หรือสถานะรีจิสทรี
    - การเพิ่มความสามารถ Plugin ใหม่หรือ context engine Plugin
summary: 'สถาปัตยกรรม Plugin ภายใน: ไปป์ไลน์การโหลด รีจิสทรี runtime hooks HTTP routes และตารางอ้างอิง'
title: สถาปัตยกรรม Plugin ภายใน
x-i18n:
    generated_at: "2026-04-25T13:52:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

สำหรับโมเดลความสามารถสาธารณะ รูปแบบของ Plugin และสัญญาด้านความเป็นเจ้าของ/การทำงาน
ดู [Plugin architecture](/th/plugins/architecture) หน้านี้เป็นเอกสารอ้างอิง
สำหรับกลไกภายใน: ไปป์ไลน์การโหลด รีจิสทรี runtime hooks Gateway HTTP routes import paths และตาราง schema

## ไปป์ไลน์การโหลด

ตอนเริ่มต้น OpenClaw จะทำประมาณนี้:

1. ค้นหารากของ Plugin ที่เป็นผู้สมัคร
2. อ่าน manifests ของ bundle แบบเนทีฟหรือแบบที่เข้ากันได้ และ package metadata
3. ปฏิเสธผู้สมัครที่ไม่ปลอดภัย
4. normalize config ของ Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินใจเปิดใช้งานสำหรับผู้สมัครแต่ละราย
6. โหลด native modules ที่เปิดใช้งาน: built bundled modules ใช้ native loader;
   ส่วน native plugins ที่ยังไม่ build ใช้ jiti
7. เรียก native hooks `register(api)` และรวบรวมการลงทะเบียนลงใน plugin registry
8. เปิดเผยรีจิสทรีให้กับพื้นผิวของคำสั่ง/รันไทม์

<Note>
`activate` เป็น alias แบบเดิมของ `register` — loader จะ resolve ตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกในจุดเดียวกัน Bundled plugins ทั้งหมดใช้ `register`; สำหรับ Plugin ใหม่ควรเลือกใช้ `register`
</Note>

safety gates จะเกิดขึ้น **ก่อน** การทำงานของรันไทม์ ผู้สมัครจะถูกบล็อก
เมื่อ entry หลุดออกนอก plugin root, path เขียนได้โดยทุกคน หรือความเป็นเจ้าของ path
ดูน่าสงสัยสำหรับ plugins ที่ไม่ใช่ bundled

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งข้อมูลจริงของ control plane OpenClaw ใช้มันเพื่อ:

- ระบุ Plugin
- ค้นหา channels/Skills/config schema ที่ประกาศไว้ หรือความสามารถของ bundle
- ตรวจสอบ `plugins.entries.<id>.config`
- เสริม labels/placeholders ของ Control UI
- แสดง metadata สำหรับการติดตั้ง/แค็ตตาล็อก
- คงตัวบรรยาย activation และ setup แบบประหยัดไว้โดยไม่ต้องโหลด plugin runtime

สำหรับ native plugins โมดูลรันไทม์คือส่วน data-plane โดยจะลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flows

บล็อก `activation` และ `setup` แบบไม่บังคับใน manifest ยังคงอยู่บน control plane
สิ่งเหล่านี้เป็นตัวบรรยายแบบ metadata-only สำหรับการวางแผน activation และการค้นพบ setup;
ไม่ได้แทนที่การลงทะเบียนรันไทม์ `register(...)` หรือ `setupEntry`
ผู้ใช้ live activation กลุ่มแรกตอนนี้ใช้ hints ของคำสั่ง แชนเนล และ provider จาก manifest
เพื่อจำกัดการโหลด Plugin ก่อนการสร้างรีจิสทรีแบบกว้างขึ้น:

- การโหลด CLI จะจำกัดลงไปยัง plugins ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การตั้งค่าแชนเนล/การ resolve Plugin จะจำกัดลงไปยัง plugins ที่เป็นเจ้าของ
  channel id ที่ร้องขอ
- การ resolve setup/runtime ของ provider แบบ explicit จะจำกัดลงไปยัง plugins ที่เป็นเจ้าของ
  provider id ที่ร้องขอ

activation planner เปิดเผยทั้ง API แบบ ids-only สำหรับผู้เรียกเดิม และ
plan API สำหรับการวินิจฉัยใหม่ รายการใน plan จะรายงานสาเหตุที่ Plugin ถูกเลือก
โดยแยก hints ของ planner แบบ explicit `activation.*` ออกจาก
manifest ownership fallback เช่น `providers`, `channels`, `commandAliases`,
`setup.providers`, `contracts.tools` และ hooks การแยกเหตุผลนี้คือขอบเขตความเข้ากันได้:
metadata ของ Plugin เดิมยังคงทำงานต่อได้ ขณะที่โค้ดใหม่สามารถตรวจจับ broad hints
หรือพฤติกรรม fallback ได้โดยไม่เปลี่ยน semantics ของการโหลดรันไทม์

ตอนนี้การค้นพบ setup จะให้ความสำคัญกับ ids ที่ตัวบรรยายเป็นเจ้าของ เช่น
`setup.providers` และ `setup.cliBackends` เพื่อจำกัด candidate plugins ก่อน fallback ไปยัง
`setup-api` สำหรับ plugins ที่ยังต้องการ runtime hooks ในช่วง setup โฟลว์ setup ของ provider ใช้
manifest `providerAuthChoices` ก่อน จากนั้นจึง fallback ไปยัง
runtime wizard choices และ install-catalog choices เพื่อความเข้ากันได้ ค่าที่ explicit คือ
`setup.requiresRuntime: false` เป็นจุดตัดแบบ descriptor-only; ส่วน `requiresRuntime`
ที่ไม่ระบุไว้จะคง fallback แบบเดิมของ setup-api เพื่อความเข้ากันได้ หากมี
Plugin ที่ถูกค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ normalized setup provider หรือ CLI
backend id เดียวกัน การค้นหา setup จะปฏิเสธเจ้าของที่กำกวมแทนที่จะอาศัย
ลำดับการค้นพบ เมื่อ setup runtime ทำงานจริง registry diagnostics จะรายงาน
drift ระหว่าง `setup.providers` / `setup.cliBackends` กับ providers หรือ CLI
backends ที่ลงทะเบียนโดย setup-api โดยไม่บล็อก plugins แบบเดิม

### สิ่งที่ loader แคชไว้

OpenClaw เก็บแคชภายในโปรเซสแบบสั้น ๆ สำหรับ:

- ผลลัพธ์การค้นพบ
- ข้อมูล manifest registry
- plugin registries ที่โหลดแล้ว

แคชเหล่านี้ช่วยลดต้นทุนของการเริ่มต้นแบบเป็นระลอกและค่าใช้จ่ายของคำสั่งที่เรียกซ้ำ
ควรคิดว่าเป็นแคชด้านประสิทธิภาพอายุสั้น ไม่ใช่การจัดเก็บถาวร

หมายเหตุด้านประสิทธิภาพ:

- ตั้งค่า `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` หรือ
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` เพื่อปิดใช้งานแคชเหล่านี้
- ปรับช่วงเวลาแคชด้วย `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` และ
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`

## โมเดลรีจิสทรี

Plugins ที่โหลดแล้วจะไม่ไปแก้ไข core globals แบบสุ่มโดยตรง แต่จะลงทะเบียนเข้าไปใน
plugin registry กลาง

รีจิสทรีจะติดตาม:

- ระเบียน Plugin (identity, source, origin, status, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- commands ที่ Plugin เป็นเจ้าของ

จากนั้นความสามารถของ core จะอ่านจากรีจิสทรีนั้น แทนที่จะคุยกับโมดูลของ Plugin โดยตรง
ซึ่งช่วยให้การโหลดเป็นทางเดียว:

- โมดูล Plugin -> การลงทะเบียนในรีจิสทรี
- core runtime -> การใช้งานจากรีจิสทรี

การแยกนี้สำคัญต่อการดูแลรักษา หมายความว่าพื้นผิวส่วนใหญ่ของ core ต้องการเพียง
จุดเชื่อมต่อเดียว: "อ่านรีจิสทรี" ไม่ใช่ "ทำกรณีพิเศษให้ทุกโมดูลของ Plugin"

## callbacks สำหรับ conversation binding

Plugins ที่ bind บทสนทนาไว้สามารถตอบสนองได้เมื่อการอนุมัติถูก resolve

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
ได้รับการอนุมัติหรือถูกปฏิเสธ:

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
- `request`: สรุปคำขอเดิม detach hint sender id และ
  metadata ของบทสนทนา

callback นี้มีไว้เพื่อแจ้งเตือนเท่านั้น ไม่ได้เปลี่ยนว่าใครได้รับอนุญาตให้ bind บทสนทนา
และจะทำงานหลังจากการจัดการการอนุมัติของ core เสร็จสิ้นแล้ว

## provider runtime hooks

provider plugins มี 3 ชั้น:

- **Manifest metadata** สำหรับการค้นหาก่อนรันไทม์ที่ประหยัด:
  `setup.providers[].envVars`, ค่าเข้ากันได้แบบเดิมที่เลิกใช้แล้ว `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` และ `channelEnvVars`
- **Config-time hooks**: `catalog` (เดิมคือ `discovery`) พร้อม
  `applyConfigDefaults`
- **Runtime hooks**: hooks แบบไม่บังคับมากกว่า 40 รายการที่ครอบคลุม auth, model resolution,
  stream wrapping, ระดับการคิด, replay policy และ usage endpoints ดู
  รายการเต็มภายใต้ [ลำดับและการใช้งานของ Hook](#hook-order-and-usage)

OpenClaw ยังคงเป็นเจ้าของ generic agent loop, failover, transcript handling และ
tool policy hooks เหล่านี้คือพื้นผิวการขยายสำหรับพฤติกรรมเฉพาะของ provider
โดยไม่ต้องสร้าง inference transport แบบกำหนดเองทั้งชุด

ใช้ manifest `setup.providers[].envVars` เมื่อ provider มี credentials แบบ env
ที่เส้นทางทั่วไปของ auth/status/model-picker ควรมองเห็นได้โดยไม่ต้อง
โหลด plugin runtime ค่า `providerAuthEnvVars` ที่เลิกใช้แล้ว
ยังคงถูกอ่านโดย compatibility adapter ระหว่างช่วงเลิกใช้ และ plugins ที่ไม่ใช่ bundled
ที่ใช้มันจะได้รับ manifest diagnostic ใช้ manifest `providerAuthAliases`
เมื่อ provider id หนึ่งควรนำ env vars, auth profiles,
config-backed auth และตัวเลือก onboarding แบบ API-key ของ provider id อื่นกลับมาใช้ซ้ำ ใช้ manifest
`providerAuthChoices` เมื่อพื้นผิว CLI ด้าน onboarding/auth-choice ควรรู้
choice id, group labels และการเชื่อมต่อ auth แบบ one-flag ง่าย ๆ ของ provider
โดยไม่ต้องโหลด provider runtime ส่วน provider runtime
`envVars` ควรใช้สำหรับ hints ที่หันไปทางโอเปอเรเตอร์ เช่น labels ใน onboarding หรือ
OAuth client-id/client-secret setup vars

ใช้ manifest `channelEnvVars` เมื่อแชนเนลมี auth หรือ setup แบบขับเคลื่อนด้วย env
ที่ generic shell-env fallback, การตรวจสอบ config/status หรือ setup prompts ควรมองเห็นได้
โดยไม่ต้องโหลด channel runtime

### ลำดับและการใช้งานของ Hook

สำหรับ model/provider plugins, OpenClaw จะเรียก hooks ตามลำดับคร่าว ๆ นี้
คอลัมน์ "When to use" คือแนวทางตัดสินใจอย่างรวดเร็ว

| #   | Hook                              | สิ่งที่ทำ                                                                                                   | ใช้เมื่อใด                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่ config ของ provider ไปยัง `models.providers` ระหว่างการสร้าง `models.json`                                | provider เป็นเจ้าของแค็ตตาล็อกหรือค่าเริ่มต้นของ base URL                                                                                                  |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้น global config ที่ provider เป็นเจ้าของระหว่างการ materialize config                                      | ค่าเริ่มต้นขึ้นอยู่กับโหมด auth, env หรือ semantics ของตระกูลโมเดลของ provider                                                                         |
| --  | _(การค้นหาโมเดลในตัว)_         | OpenClaw จะลองเส้นทาง registry/catalog ปกติก่อน                                                          | _(ไม่ใช่ Plugin hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | normalize aliases ของ model-id แบบเดิมหรือ preview ก่อนการค้นหา                                                     | provider เป็นเจ้าของการล้าง aliases ก่อนการ resolve โมเดล canonical                                                                                 |
| 4   | `normalizeTransport`              | normalize `api` / `baseUrl` ของตระกูล provider ก่อนการประกอบโมเดลแบบทั่วไป                                      | provider เป็นเจ้าของการล้าง transport สำหรับ provider ids แบบกำหนดเองในตระกูล transport เดียวกัน                                                          |
| 5   | `normalizeConfig`                 | normalize `models.providers.<id>` ก่อนการ resolve provider/runtime                                           | provider ต้องการล้าง config ที่ควรอยู่กับ Plugin; ตัวช่วยตระกูล Google แบบ bundled ก็ทำหน้าที่ backstop ให้กับรายการ config ของ Google ที่รองรับด้วย   |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียน compat สำหรับ native streaming-usage กับ config providers                                               | provider ต้องการการแก้ไข metadata ของ native streaming usage ที่อิงตาม endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | resolve env-marker auth สำหรับ config providers ก่อนโหลด runtime auth                                       | provider มีการ resolve API-key แบบ env-marker ที่ provider เป็นเจ้าของ; `amazon-bedrock` ก็มี built-in AWS env-marker resolver ในส่วนนี้ด้วย                  |
| 8   | `resolveSyntheticAuth`            | เปิดเผย auth แบบ local/self-hosted หรือแบบ config-backed โดยไม่จัดเก็บ plaintext                                   | provider สามารถทำงานได้ด้วย synthetic/local credential marker                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | overlay external auth profiles ที่ provider เป็นเจ้าของ; ค่าเริ่มต้นของ `persistence` คือ `runtime-only` สำหรับ creds ที่ CLI/app เป็นเจ้าของ | provider นำ external auth credentials กลับมาใช้ซ้ำโดยไม่เก็บ copied refresh tokens; ให้ประกาศ `contracts.externalAuthProviders` ใน manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ synthetic profile placeholders ที่เก็บไว้ให้อยู่หลัง auth แบบ env/config-backed                                      | provider จัดเก็บ synthetic placeholder profiles ที่ไม่ควรชนะลำดับความสำคัญ                                                                 |
| 11  | `resolveDynamicModel`             | sync fallback สำหรับ model ids ที่ provider เป็นเจ้าของแต่ยังไม่มีใน local registry                                       | provider ยอมรับ upstream model ids แบบ arbitrary                                                                                                 |
| 12  | `prepareDynamicModel`             | warm-up แบบ async จากนั้น `resolveDynamicModel` จะรันอีกครั้ง                                                           | provider ต้องใช้ metadata จากเครือข่ายก่อน resolve ids ที่ไม่รู้จัก                                                                                  |
| 13  | `normalizeResolvedModel`          | เขียนซ้ำขั้นสุดท้ายก่อนที่ embedded runner จะใช้โมเดลที่ resolve แล้ว                                               | provider ต้องการ rewrites ด้าน transport แต่ยังใช้ core transport อยู่                                                                             |
| 14  | `contributeResolvedModelCompat`   | เพิ่ม compat flags สำหรับ vendor models ที่อยู่หลัง transport แบบ compatible อื่น                                  | provider รู้จักโมเดลของตนเองบน proxy transports โดยไม่ต้องเข้ายึดความเป็น provider                                                       |
| 15  | `capabilities`                    | metadata ด้าน transcript/tooling ที่ provider เป็นเจ้าของและถูกใช้โดย shared core logic                                           | provider ต้องการจัดการ quirks ของ transcript/ตระกูล provider                                                                                              |
| 16  | `normalizeToolSchemas`            | normalize tool schemas ก่อนที่ embedded runner จะมองเห็น                                                    | provider ต้องการล้าง schema ของตระกูล transport                                                                                                |
| 17  | `inspectToolSchemas`              | เปิดเผย schema diagnostics ที่ provider เป็นเจ้าของหลังการ normalize                                                  | provider ต้องการคำเตือนด้านคีย์เวิร์ด โดยไม่ต้องสอนกฎเฉพาะ provider ให้ core                                                                 |
| 18  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบ native หรือ tagged                                                              | provider ต้องการ reasoning/final output แบบ tagged แทนฟิลด์ native                                                                         |
| 19  | `prepareExtraParams`              | normalize request params ก่อน generic stream option wrappers                                              | provider ต้องการ request params ค่าเริ่มต้นหรือการล้างพารามิเตอร์ราย provider                                                                           |
| 20  | `createStreamFn`                  | แทนที่เส้นทาง stream ปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                   | provider ต้องการ wire protocol แบบกำหนดเอง ไม่ใช่เพียง wrapper                                                                                     |
| 21  | `wrapStreamFn`                    | stream wrapper หลังจาก generic wrappers ถูกใช้แล้ว                                                              | provider ต้องการ wrappers ด้าน request headers/body/model compat โดยไม่ต้องใช้ custom transport                                                          |
| 22  | `resolveTransportTurnState`       | แนบ native per-turn transport headers หรือ metadata                                                           | provider ต้องการให้ generic transports ส่ง turn identity แบบ native ของ provider                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | แนบ native WebSocket headers หรือนโยบาย session cool-down                                                    | provider ต้องการให้ generic WS transports ปรับ headers ของเซสชันหรือนโยบาย fallback                                                               |
| 24  | `formatApiKey`                    | ตัวจัดรูปแบบ auth-profile: โปรไฟล์ที่จัดเก็บไว้จะกลายเป็นสตริง `apiKey` ของรันไทม์                                     | provider จัดเก็บ metadata ด้าน auth เพิ่มเติมและต้องการรูปร่างโทเค็นของรันไทม์แบบกำหนดเอง                                                                    |
| 25  | `refreshOAuth`                    | override การ refresh OAuth สำหรับ custom refresh endpoints หรือนโยบาย refresh-failure                                  | provider ไม่เข้ากับ refreshers แบบใช้ร่วมกันของ `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | repair hint ที่ถูกผนวกเพิ่มเมื่อการ refresh OAuth ล้มเหลว                                                                  | provider ต้องการคำแนะนำซ่อมแซม auth ที่ provider เป็นเจ้าของหลังการ refresh ล้มเหลว                                                                      |
| 27  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ provider เป็นเจ้าของ                                                                 | provider มี raw overflow errors ที่ generic heuristics จะพลาด                                                                                |
| 28  | `classifyFailoverReason`          | การจัดประเภทเหตุผลของ failover ที่ provider เป็นเจ้าของ                                                                  | provider สามารถแมป raw API/transport errors ไปเป็น rate-limit/overload ฯลฯ                                                                          |
| 29  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับ providers แบบ proxy/backhaul                                                               | provider ต้องการการกำหนดสิทธิ์ cache TTL แบบเฉพาะ proxy                                                                                                |
| 30  | `buildMissingAuthMessage`         | สิ่งทดแทนสำหรับข้อความกู้คืน missing-auth แบบทั่วไป                                                      | provider ต้องการคำแนะนำการกู้คืน missing-auth แบบเฉพาะ provider                                                                                 |
| 31  | `suppressBuiltInModel`            | การซ่อนโมเดล upstream ที่ล้าสมัย พร้อมคำแนะนำข้อผิดพลาดสำหรับผู้ใช้แบบไม่บังคับ                                          | provider ต้องการซ่อนแถว upstream ที่ล้าสมัย หรือแทนที่ด้วยคำแนะนำจาก vendor                                                                 |
| 32  | `augmentModelCatalog`             | แถวในแค็ตตาล็อกแบบ synthetic/final ที่ถูกผนวกเพิ่มหลังการค้นพบ                                                          | provider ต้องการแถว forward-compat แบบ synthetic ใน `models list` และ pickers                                                                     |
| 33  | `resolveThinkingProfile`          | ชุดระดับ `/think`, ป้ายแสดงผล และค่าเริ่มต้นสำหรับโมเดลโดยเฉพาะ                                                 | provider เปิดเผยลำดับชั้นการคิดแบบกำหนดเอง หรือป้ายแบบ binary สำหรับโมเดลที่เลือก                                                                 |
| 34  | `isBinaryThinking`                | compatibility hook สำหรับ reasoning toggle แบบ on/off                                                                     | provider เปิดเผยการคิดแบบ binary เพียงเปิด/ปิด                                                                                                  |
| 35  | `supportsXHighThinking`           | compatibility hook สำหรับการรองรับ reasoning แบบ `xhigh`                                                                   | provider ต้องการให้ `xhigh` ใช้ได้เฉพาะกับบางโมเดล                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | compatibility hook สำหรับระดับ `/think` ค่าเริ่มต้น                                                                      | provider เป็นเจ้าของนโยบาย `/think` ค่าเริ่มต้นสำหรับตระกูลโมเดล                                                                                      |
| 37  | `isModernModelRef`                | ตัวจับคู่ modern-model สำหรับ live profile filters และการเลือก smoke                                              | provider เป็นเจ้าของการจับคู่ preferred-model สำหรับ live/smoke                                                                                             |
| 38  | `prepareRuntimeAuth`              | แลก credential ที่กำหนดค่าไว้ให้กลายเป็นโทเค็น/คีย์ของรันไทม์จริงก่อน inference                       | provider ต้องการ token exchange หรือ request credential แบบอายุสั้น                                                                             |
| 39  | `resolveUsageAuth`                | resolve credentials สำหรับการใช้งาน/การคิดค่าบริการของ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                                     | provider ต้องการการแยกวิเคราะห์ usage/quota token แบบกำหนดเอง หรือ usage credential ที่ต่างออกไป                                                               |
| 40  | `fetchUsageSnapshot`              | ดึงและ normalize snapshots การใช้งาน/โควตาแบบเฉพาะ provider หลังจาก resolve auth แล้ว                             | provider ต้องการ endpoint การใช้งานเฉพาะ provider หรือ parser ของ payload                                                                           |
| 41  | `createEmbeddingProvider`         | สร้าง embedding adapter ที่ provider เป็นเจ้าของสำหรับ memory/search                                                     | พฤติกรรมของ memory embedding ควรอยู่กับ provider plugin                                                                                    |
| 42  | `buildReplayPolicy`               | คืนค่า replay policy ที่ควบคุมการจัดการ transcript สำหรับ provider                                        | provider ต้องการนโยบาย transcript แบบกำหนดเอง (เช่น การตัด thinking-block ออก)                                                               |
| 43  | `sanitizeReplayHistory`           | เขียน replay history ใหม่หลังจาก generic transcript cleanup                                                        | provider ต้องการ replay rewrites แบบเฉพาะ provider ที่มากกว่าตัวช่วย shared compaction                                                             |
| 44  | `validateReplayTurns`             | การตรวจสอบหรือปรับรูปร่าง replay-turn ขั้นสุดท้ายก่อน embedded runner                                           | provider transport ต้องการการตรวจสอบเทิร์นที่เข้มงวดกว่าหลังจาก generic sanitation                                                                    |
| 45  | `onModelSelected`                 | รันผลข้างเคียงหลังการเลือกโมเดลที่ provider เป็นเจ้าของ                                                                 | provider ต้องการ telemetry หรือสถานะที่ provider เป็นเจ้าของเมื่อโมเดลถูกเปิดใช้งาน                                                                  |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
provider plugin ที่จับคู่ได้ก่อน จากนั้นจึงไล่ไปยัง provider plugins อื่นที่รองรับ hook
จนกว่าจะมีตัวใดตัวหนึ่งเปลี่ยน model id หรือ transport/config จริง วิธีนี้ช่วยให้
alias/compat provider shims ยังคงทำงานได้ โดยไม่ต้องให้ผู้เรียกรู้ว่า bundled plugin ตัวใดเป็นเจ้าของ rewrite นั้น
หากไม่มี provider hook ใด rewrite รายการ config ที่รองรับในตระกูล Google
bundled Google config normalizer ก็ยังคงทำ compatibility cleanup นั้นต่อไป

หาก provider ต้องการ wire protocol แบบกำหนดเองเต็มรูปแบบ หรือ request executor แบบกำหนดเอง
นั่นเป็นส่วนขยายอีกประเภทหนึ่ง hooks เหล่านี้มีไว้สำหรับพฤติกรรมของ provider
ที่ยังคงรันอยู่บน inference loop ปกติของ OpenClaw

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

### ตัวอย่างที่มาพร้อมระบบ

bundled provider plugins จะผสมผสาน hooks ด้านบนเพื่อรองรับความต้องการด้าน catalog,
auth, thinking, replay และ usage ของแต่ละ vendor ชุด hooks ที่เป็นทางการอยู่ร่วมกับ
แต่ละ Plugin ภายใต้ `extensions/`; หน้านี้อธิบายรูปร่างโดยรวม แทนการ
สะท้อนรายการทั้งหมด

<AccordionGroup>
  <Accordion title="providers แบบ pass-through catalog">
    OpenRouter, Kilocode, Z.AI และ xAI ลงทะเบียน `catalog` พร้อม
    `resolveDynamicModel` / `prepareDynamicModel` เพื่อให้สามารถเปิดเผย upstream
    model ids ได้ก่อนแค็ตตาล็อกแบบ static ของ OpenClaw
  </Accordion>
  <Accordion title="providers ที่มี OAuth และ usage endpoint">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi และ z.ai จับคู่
    `prepareRuntimeAuth` หรือ `formatApiKey` กับ `resolveUsageAuth` +
    `fetchUsageSnapshot` เพื่อเป็นเจ้าของ token exchange และการเชื่อมต่อกับ `/usage`
  </Accordion>
  <Accordion title="ตระกูลของ replay และ transcript cleanup">
    ตระกูลแบบมีชื่อที่ใช้ร่วมกัน (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ช่วยให้ providers เลือกใช้
    transcript policy ผ่าน `buildReplayPolicy` แทนที่แต่ละ Plugin จะ
    re-implement cleanup เอง
  </Accordion>
  <Accordion title="providers แบบ catalog-only">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ
    `volcengine` ลงทะเบียนเพียง `catalog` และอาศัย shared inference loop
  </Accordion>
  <Accordion title="ตัวช่วย stream เฉพาะ Anthropic">
    Beta headers, `/fast` / `serviceTier` และ `context1m` อยู่ภายใน
    seam สาธารณะ `api.ts` / `contract-api.ts` ของ Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) แทนที่จะอยู่ใน
    SDK ทั่วไป
  </Accordion>
</AccordionGroup>

## ตัวช่วยรันไทม์

Plugins สามารถเข้าถึงตัวช่วยจาก core บางส่วนผ่าน `api.runtime` สำหรับ TTS:

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

- `textToSpeech` คืนค่า payload เอาต์พุต TTS ปกติของ core สำหรับพื้นผิวแบบไฟล์/voice-note
- ใช้การกำหนดค่า `messages.tts` และการเลือก provider ของ core
- คืนค่า PCM audio buffer + sample rate โดย Plugins ต้อง resample/encode เองสำหรับ providers
- `listVoices` เป็นทางเลือกแยกตาม provider ใช้มันสำหรับตัวเลือกเสียงของ vendor หรือ setup flows
- รายการเสียงสามารถมีข้อมูลเมตาที่หลากหลายกว่า เช่น locale, เพศ และ personality tags สำหรับ pickers ที่รับรู้ provider
- ปัจจุบัน OpenAI และ ElevenLabs รองรับ telephony ส่วน Microsoft ไม่รองรับ

Plugins ยังสามารถลงทะเบียน speech providers ผ่าน `api.registerSpeechProvider(...)`

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

- ให้คงนโยบาย TTS, fallback และการส่งมอบการตอบกลับไว้ใน core
- ใช้ speech providers สำหรับพฤติกรรมการสังเคราะห์ที่ vendor เป็นเจ้าของ
- อินพุต `edge` แบบเดิมของ Microsoft จะถูก normalize ไปเป็น provider id `microsoft`
- โมเดลความเป็นเจ้าของที่แนะนำคืออิงตามบริษัท: vendor plugin หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และ providers ด้านสื่ออื่น ๆ ในอนาคตเมื่อ OpenClaw เพิ่ม
  capability contracts เหล่านั้น

สำหรับการทำความเข้าใจรูปภาพ/เสียง/วิดีโอ Plugins จะลงทะเบียน
media-understanding provider แบบ typed หนึ่งตัว แทนถุง key/value แบบทั่วไป:

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

- ให้คง orchestration, fallback, config และการเดินสายของแชนเนลไว้ใน core
- ให้พฤติกรรมเฉพาะ vendor อยู่ใน provider plugin
- การขยายแบบเพิ่มควรคงความเป็น typed: เพิ่มเมธอดแบบไม่บังคับ, ฟิลด์ผลลัพธ์แบบไม่บังคับ และ capabilities แบบไม่บังคับ
- การสร้างวิดีโอทำตามรูปแบบเดียวกันอยู่แล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - vendor plugins ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - feature/channel plugins ใช้ `api.runtime.videoGeneration.*`

สำหรับ runtime helpers ของ media-understanding Plugins สามารถเรียกใช้:

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

สำหรับการถอดเสียง audio Plugins สามารถใช้ได้ทั้งรันไทม์ของ media-understanding
หรือ alias แบบเก่าของ STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // ไม่บังคับ เมื่อไม่สามารถอนุมาน MIME ได้อย่างน่าเชื่อถือ:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวแบบใช้ร่วมกันที่แนะนำสำหรับ
  image/audio/video understanding
- ใช้การกำหนดค่า audio ของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของ provider
- คืนค่า `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียง (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่ในฐานะ compatibility alias

Plugins ยังสามารถเริ่มการรัน subagent แบบเบื้องหลังผ่าน `api.runtime.subagent`:

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

- `provider` และ `model` เป็น overrides ต่อการรันแบบไม่บังคับ ไม่ใช่การเปลี่ยนแปลงเซสชันแบบถาวร
- OpenClaw จะยอมรับฟิลด์ override เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับ fallback runs ที่ Plugin เป็นเจ้าของ โอเปอเรเตอร์ต้องเลือกเปิดใช้ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด trusted plugins ให้ใช้ได้เฉพาะเป้าหมาย canonical `provider/model` ที่ระบุ หรือใช้ `"*"` เพื่ออนุญาตทุกเป้าหมายอย่างชัดเจน
- การรัน subagent ของ Plugin ที่ไม่น่าเชื่อถือยังคงใช้งานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ

สำหรับ web search Plugins สามารถใช้ shared runtime helper แทน
การเข้าถึงการเดินสาย tool ของเอเจนต์โดยตรง:

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

Plugins ยังสามารถลงทะเบียน web-search providers ผ่าน
`api.registerWebSearchProvider(...)`

หมายเหตุ:

- ให้คงการเลือก provider, การ resolve credentials และ semantics ของคำขอแบบใช้ร่วมกันไว้ใน core
- ใช้ web-search providers สำหรับ search transports ที่เฉพาะ vendor
- `api.runtime.webSearch.*` คือพื้นผิวแบบใช้ร่วมกันที่แนะนำสำหรับ feature/channel plugins ที่ต้องการพฤติกรรมการค้นหาโดยไม่ต้องพึ่ง agent tool wrapper

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

- `generate(...)`: สร้างรูปภาพโดยใช้สาย provider สำหรับการสร้างรูปภาพที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการ providers สำหรับการสร้างรูปภาพที่พร้อมใช้งานและ capabilities ของแต่ละตัว

## Gateway HTTP routes

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

- `path`: พาธของ route ภายใต้ Gateway HTTP server
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อให้ต้องใช้ gateway auth ปกติ หรือ `"plugin"` สำหรับ auth/webhook verification ที่ Plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ Plugin เดียวกันแทนที่ route registration เดิมของตนเองได้
- `handler`: คืนค่า `true` เมื่อ route จัดการคำขอแล้ว

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้วและจะทำให้เกิดข้อผิดพลาดตอนโหลด Plugin ให้ใช้ `api.registerHttpRoute(...)` แทน
- Plugin routes ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบ exact จะถูกปฏิเสธ เว้นแต่ `replaceExisting: true` และ Plugin หนึ่งไม่สามารถแทนที่ route ของอีก Plugin ได้
- routes ที่ทับซ้อนกันแต่ใช้ระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คง fallthrough chains แบบ `exact`/`prefix` ไว้ที่ระดับ auth เดียวกันเท่านั้น
- routes ที่ใช้ `auth: "plugin"` จะ **ไม่ได้รับ** runtime scopes ของโอเปอเรเตอร์โดยอัตโนมัติ สิ่งเหล่านี้มีไว้สำหรับ webhooks/signature verification ที่ Plugin จัดการเอง ไม่ใช่การเรียก Gateway helper แบบมีสิทธิพิเศษ
- routes ที่ใช้ `auth: "gateway"` จะทำงานภายใน Gateway request runtime scope แต่ scope นั้นถูกตั้งใจให้อนุรักษ์นิยม:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) จะตรึง plugin-route runtime scopes ไว้ที่ `operator.write` แม้ผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP ที่เชื่อถือได้และมีการระบุอัตลักษณ์ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน private ingress) จะยอมรับ `x-openclaw-scopes` ก็ต่อเมื่อมี header นั้นอย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` ในคำขอ plugin-route แบบมีอัตลักษณ์เหล่านั้น runtime scope จะ fallback ไปเป็น `operator.write`
- กฎในทางปฏิบัติ: อย่าคิดว่า plugin route ที่ใช้ gateway-auth เป็นพื้นผิว admin แบบโดยนัย หาก route ของคุณต้องการพฤติกรรมระดับ admin เท่านั้น ให้บังคับใช้โหมด auth แบบมีอัตลักษณ์ และบันทึกสัญญา header `x-openclaw-scopes` แบบ explicit ไว้ให้ชัดเจน

## import paths ของ Plugin SDK

ใช้ subpaths ของ SDK แบบแคบแทน root barrel แบบก้อนเดียว `openclaw/plugin-sdk`
เมื่อพัฒนา plugins ใหม่ subpaths หลักมีดังนี้:

| Subpath                             | วัตถุประสงค์                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitive สำหรับการลงทะเบียน Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | ตัวช่วยสำหรับ entry/build ของแชนเนล                        |
| `openclaw/plugin-sdk/core`          | ตัวช่วยใช้ร่วมกันทั่วไปและ umbrella contract       |
| `openclaw/plugin-sdk/config-schema` | Zod schema ของ `openclaw.json` ที่ระดับราก (`OpenClawSchema`) |

channel plugins จะเลือกใช้จากตระกูล seams แบบแคบ — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` และ `channel-actions` พฤติกรรมการอนุมัติควรรวมอยู่บนสัญญา `approvalCapability` เดียว แทนการปะปนไปกับฟิลด์ Plugin ที่ไม่เกี่ยวข้อง
ดู [Channel plugins](/th/plugins/sdk-channel-plugins)

ตัวช่วยด้าน runtime และ config อยู่ภายใต้ subpaths `*-runtime`
ที่ชื่อสอดคล้องกัน (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` เป็นต้น)

<Info>
`openclaw/plugin-sdk/channel-runtime` เลิกใช้แล้ว — เป็น compatibility shim สำหรับ
plugins รุ่นเก่า โค้ดใหม่ควร import primitive แบบทั่วไปที่แคบกว่าแทน
</Info>

entry points ภายใน repo (ต่อหนึ่ง bundled plugin package root):

- `index.js` — entry ของ bundled plugin
- `api.js` — helper/types barrel
- `runtime-api.js` — barrel สำหรับ runtime เท่านั้น
- `setup-entry.js` — entry ของ setup plugin

external plugins ควร import เฉพาะ subpaths `openclaw/plugin-sdk/*` เท่านั้น ห้าม
import `src/*` ของ package Plugin อื่นจาก core หรือจาก Plugin อื่น
entry points ที่โหลดผ่าน facade จะเลือกใช้ active runtime config snapshot เมื่อมี
จากนั้นจึง fallback ไปยัง config file ที่ resolve แล้วบนดิสก์

subpaths เฉพาะ capability เช่น `image-generation`, `media-understanding`
และ `speech` มีอยู่เพราะ bundled plugins ใช้สิ่งเหล่านี้อยู่ในปัจจุบัน แต่ไม่ได้หมายความว่าจะเป็นสัญญาภายนอกระยะยาวที่ถูกตรึงไว้อัตโนมัติ — ตรวจสอบหน้าอ้างอิง SDK ที่เกี่ยวข้องเมื่อจะพึ่งพามัน

## Message tool schemas

Plugins ควรเป็นเจ้าของ schema contributions จาก `describeMessageTool(...)` แบบเฉพาะแชนเนล
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
การนำเสนอการส่งแบบใช้ร่วมกันควรใช้สัญญา `MessagePresentation` แบบทั่วไป
แทนฟิลด์ button, component, block หรือ card แบบเนทีฟของ provider
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา
กฎ fallback การแมประหว่าง providers และเช็กลิสต์สำหรับผู้เขียน Plugin

plugins ที่ส่งข้อความได้จะประกาศสิ่งที่สามารถ render ได้ผ่าน message capabilities:

- `presentation` สำหรับ semantic presentation blocks (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอการส่งแบบ pinned-delivery

core จะเป็นผู้ตัดสินใจว่าจะ render presentation แบบเนทีฟหรือ degrade เป็นข้อความ
ห้ามเปิดเผยช่องทาง escape hatch ของ UI แบบเนทีฟของ provider จาก generic message tool
SDK helpers ที่เลิกใช้แล้วสำหรับ legacy native schemas ยังคงถูก export สำหรับ
third-party plugins ที่มีอยู่ แต่ plugins ใหม่ไม่ควรใช้

## การ resolve เป้าหมายของแชนเนล

channel plugins ควรเป็นเจ้าของ semantics ของเป้าหมายแบบเฉพาะแชนเนล ให้คง
outbound host แบบใช้ร่วมกันให้เป็นแบบทั่วไป และใช้พื้นผิวของ messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินว่าเป้าหมายที่ normalize แล้ว
  ควรถูกมองว่าเป็น `direct`, `group` หรือ `channel` ก่อนการค้นหาใน directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่า
  อินพุตควรถูกข้ามไปยังการ resolve แบบ id-like ทันทีแทนการค้นหาใน directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ Plugin เมื่อ
  core ต้องการการ resolve แบบสุดท้ายที่ provider เป็นเจ้าของ หลังจาก normalize แล้วหรือหลังการพลาดจาก directory
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route แบบเฉพาะ provider
  เมื่อเป้าหมายถูก resolve แล้ว

การแบ่งที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจด้านหมวดหมู่ที่ควรเกิดขึ้นก่อน
  การค้นหา peers/groups
- ใช้ `looksLikeId` สำหรับการตรวจสอบประเภท "ให้ถือว่านี่เป็น explicit/native target id"
- ใช้ `resolveTarget` สำหรับ fallback การ normalize แบบเฉพาะ provider ไม่ใช่สำหรับ
  การค้นหา directory แบบกว้าง
- ให้ provider-native ids เช่น chat ids, thread ids, JIDs, handles และ room
  ids อยู่ภายในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ในฟิลด์ SDK แบบทั่วไป

## ไดเรกทอรีที่อิง config

Plugins ที่ derive directory entries จาก config ควรเก็บตรรกะนั้นไว้ใน
Plugin และนำ shared helpers จาก
`openclaw/plugin-sdk/directory-runtime` กลับมาใช้ซ้ำ

ใช้สิ่งนี้เมื่อแชนเนลต้องการ peers/groups ที่อิง config เช่น:

- DM peers ที่ขับเคลื่อนด้วย allowlist
- แมป channel/group ที่กำหนดค่าไว้
- account-scoped static directory fallbacks

shared helpers ใน `directory-runtime` จัดการเฉพาะการทำงานแบบทั่วไป:

- การกรอง query
- การใช้ limit
- helpers สำหรับ deduping/normalization
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id แบบเฉพาะแชนเนลควรอยู่ใน implementation ของ Plugin

## แค็ตตาล็อกของ provider

provider plugins สามารถกำหนด model catalogs สำหรับ inference ได้ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` คืนรูปร่างเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับหนึ่ง provider entry
- `{ providers }` สำหรับหลาย provider entries

ใช้ `catalog` เมื่อ Plugin เป็นเจ้าของ model ids, ค่าเริ่มต้นของ base URL หรือข้อมูลเมตาของโมเดลที่ขึ้นกับ auth

`catalog.order` ควบคุมเวลาที่แค็ตตาล็อกของ Plugin จะถูกผสานเทียบกับ
implicit providers ที่มาพร้อมระบบของ OpenClaw:

- `simple`: providers แบบ API-key ธรรมดาหรือขับเคลื่อนด้วย env
- `profile`: providers ที่ปรากฏเมื่อมี auth profiles
- `paired`: providers ที่สังเคราะห์ provider entries ที่เกี่ยวข้องหลายรายการ
- `late`: รอบสุดท้าย หลังจาก implicit providers อื่น

providers ที่มาทีหลังจะชนะเมื่อเกิด key collision ดังนั้น plugins จึงสามารถ override
built-in provider entry ที่ใช้ provider id เดียวกันได้โดยตั้งใจ

ความเข้ากันได้:

- `discovery` ยังคงใช้งานได้ในฐานะ alias แบบเดิม
- หากลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`

## การตรวจสอบแชนเนลแบบอ่านอย่างเดียว

หาก Plugin ของคุณลงทะเบียนแชนเนล ให้พิจารณาติดตั้ง
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทางของรันไทม์ อนุญาตให้สมมติได้ว่า credentials
  ถูก materialize ครบถ้วนแล้ว และสามารถล้มเหลวอย่างรวดเร็วเมื่อขาด secrets ที่จำเป็น
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และโฟลว์ doctor/config
  repair ไม่ควรต้อง materialize runtime credentials เพียงเพื่ออธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- คืนค่าเฉพาะสถานะบัญชีเชิงพรรณนา
- คงค่า `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะของ credentials เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องคืนค่าดิบของโทเค็นเพียงเพื่อรายงาน
  ความพร้อมใช้งานแบบอ่านอย่างเดียว การคืนค่า `tokenStatus: "available"` (พร้อมฟิลด์ source ที่ตรงกัน)
  ก็เพียงพอสำหรับคำสั่งในลักษณะ status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดค่าผ่าน SecretRef แต่
  ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

วิธีนี้ช่วยให้คำสั่งแบบอ่านอย่างเดียวสามารถรายงานว่า "กำหนดค่าไว้แล้วแต่ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้" แทนที่จะล้มเหลวหรือรายงานผิดว่าบัญชียังไม่ได้กำหนดค่า

## Package packs

ไดเรกทอรีของ Plugin สามารถมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น Plugin หากแพ็กแสดงรายการหลาย extensions, plugin id
จะกลายเป็น `name/<fileBase>`

หาก Plugin ของคุณ import dependencies จาก npm ให้ติดตั้ง dependencies เหล่านั้นในไดเรกทอรีนั้น เพื่อให้
มี `node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

รั้วนิรภัยด้านความปลอดภัย: ทุก entry ใน `openclaw.extensions` ต้องอยู่ภายในไดเรกทอรีของ Plugin
หลังจาก resolve symlink แล้ว entries ที่หลุดออกนอกไดเรกทอรี package จะ
ถูกปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependencies ของ Plugin ด้วย
`npm install --omit=dev --ignore-scripts` (ไม่มี lifecycle scripts และไม่มี dev dependencies ในรันไทม์) ให้คง dependency
trees ของ Plugin เป็นแบบ "pure JS/TS" และหลีกเลี่ยง packages ที่ต้องใช้การ build ผ่าน `postinstall`

ไม่บังคับ: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลแบบ setup-only ที่มีน้ำหนักเบาได้
เมื่อ OpenClaw ต้องการพื้นผิว setup สำหรับ channel plugin ที่ถูกปิดใช้งาน หรือ
เมื่อ channel plugin ถูกเปิดใช้แต่ยังไม่ได้กำหนดค่า ระบบจะโหลด `setupEntry`
แทน full plugin entry วิธีนี้ช่วยให้การเริ่มต้นและ setup เบาลง
เมื่อ plugin entry หลักของคุณยังต้องเดินสาย tools, hooks หรือโค้ด runtime-only อื่น ๆ ด้วย

ไม่บังคับ: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถเลือกให้ channel plugin ใช้เส้นทาง `setupEntry` เดียวกันระหว่างช่วง
pre-listen startup ของ gateway ได้ แม้ว่าแชนเนลจะถูกกำหนดค่าไว้แล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิว startup ทั้งหมดที่ต้องมีอยู่
ก่อนที่ gateway จะเริ่มรับการเชื่อมต่อ ในทางปฏิบัติหมายความว่า setup entry
ต้องลงทะเบียนทุก capability ที่แชนเนลเป็นเจ้าของและ startup ต้องพึ่งพา เช่น:

- การลงทะเบียนแชนเนลเอง
- HTTP routes ใด ๆ ที่ต้องพร้อมใช้งานก่อน gateway เริ่มรับการเชื่อมต่อ
- gateway methods, tools หรือ services ใด ๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก full entry ของคุณยังคงเป็นเจ้าของ capability ใด ๆ ที่จำเป็นต่อ startup อย่าเปิดใช้
แฟล็กนี้ ให้คง Plugin ไว้ที่พฤติกรรมค่าเริ่มต้น และให้ OpenClaw โหลด
full entry ระหว่าง startup

bundled channels ยังสามารถเผยแพร่ตัวช่วยแบบ contract-surface สำหรับ setup-only ที่ core
สามารถใช้ตรวจสอบได้ก่อน full channel runtime จะถูกโหลด พื้นผิวของ setup
promotion ในปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core จะใช้พื้นผิวนั้นเมื่อจำเป็นต้องยกระดับ legacy single-account channel
config ไปเป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลด full plugin entry
Matrix คือตัวอย่าง bundled ปัจจุบัน: มันย้ายเฉพาะคีย์ auth/bootstrap เข้าไปใน
บัญชีที่มีชื่อซึ่งถูกยกระดับ เมื่อมี named accounts อยู่แล้ว และยังสามารถเก็บ
คีย์ default-account แบบ non-canonical ที่กำหนดค่าไว้ แทนการสร้าง
`accounts.default` เสมอ

setup patch adapters เหล่านั้นช่วยให้การค้นพบ bundled contract-surface เป็นแบบ lazy
เวลา import จึงยังเบา; พื้นผิวของ promotion จะถูกโหลดเมื่อใช้งานครั้งแรกเท่านั้น แทนที่จะกลับเข้าไปเริ่ม bundled channel startup ระหว่างการ import โมดูล

เมื่อพื้นผิว startup เหล่านั้นมี gateway RPC methods ด้วย ให้คงไว้บน
prefix ที่เฉพาะกับ Plugin ส่วน namespaces ของ core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้ และจะ resolve
เป็น `operator.admin` เสมอ แม้ Plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

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

### ข้อมูลเมตาของแค็ตตาล็อกแชนเนล

channel plugins สามารถโฆษณาข้อมูลเมตาสำหรับ setup/discovery ผ่าน `openclaw.channel` และ
install hints ผ่าน `openclaw.install` วิธีนี้ช่วยให้ข้อมูลแค็ตตาล็อกของ core ไม่ต้องผูกกับข้อมูลคงที่

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
      "blurb": "แชตแบบ self-hosted ผ่าน webhook bots ของ Nextcloud Talk",
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

- `detailLabel`: ป้ายกำกับรองสำหรับพื้นผิวแค็ตตาล็อก/สถานะที่มีรายละเอียดมากขึ้น
- `docsLabel`: override ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่าซึ่งรายการในแค็ตตาล็อกนี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความคัดลอกในพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าแชนเนลรองรับ Markdown สำหรับการตัดสินใจด้านการจัดรูปแบบข้อความขาออก
- `exposure.configured`: ซ่อนแชนเนลจากพื้นผิวรายการแชนเนลที่กำหนดค่าไว้ เมื่อกำหนดเป็น `false`
- `exposure.setup`: ซ่อนแชนเนลจากตัวเลือก setup/configure แบบอินเทอร์แอคทีฟ เมื่อกำหนดเป็น `false`
- `exposure.docs`: ทำเครื่องหมายว่าแชนเนลเป็น internal/private สำหรับพื้นผิวการนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังยอมรับได้เพื่อความเข้ากันได้; แนะนำให้ใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้แชนเนลใช้โฟลว์ `allowFrom` แบบ quickstart มาตรฐาน
- `forceAccountBinding`: บังคับให้ bind บัญชีแบบ explicit แม้จะมีเพียงบัญชีเดียวก็ตาม
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับ session lookup เมื่อ resolve announce targets

OpenClaw ยังสามารถผสาน **external channel catalogs** ได้ (เช่น export
จากรีจิสทรี MPM) วางไฟล์ JSON ไว้ที่ตำแหน่งใดตำแหน่งหนึ่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปยัง
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วย comma/semicolon/รูปแบบ `PATH`) แต่ละไฟล์ควร
มีข้อมูลรูปแบบ `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมของคีย์ `"entries"` ด้วย

รายการ channel catalog ที่ถูกสร้างขึ้นและรายการ provider install catalog จะเปิดเผย
normalized install-source facts ควบคู่กับบล็อก `openclaw.install` แบบดิบ ข้อเท็จจริงที่ normalize แล้ว
จะระบุว่า npm spec เป็นเวอร์ชันแบบ exact หรือ floating selector,
มี expected integrity metadata หรือไม่ และมี local source path พร้อมใช้งานด้วยหรือไม่
เมื่อทราบอัตลักษณ์ของ catalog/package แล้ว normalized facts จะเตือนหากชื่อ npm package ที่ parse ได้คลาดเคลื่อนจากอัตลักษณ์นั้น
พวกมันยังเตือนด้วยเมื่อ `defaultChoice` ไม่ถูกต้องหรือชี้ไปยังแหล่งที่มา
ที่ไม่พร้อมใช้งาน และเมื่อมี npm integrity metadata อยู่โดยไม่มีแหล่ง npm
ที่ถูกต้อง ผู้ใช้ควรถือว่า `installSource` เป็นฟิลด์แบบ additive optional เพื่อให้
รายการเก่าที่สร้างด้วยมือและ compatibility shims รุ่นเก่าไม่จำเป็นต้องสังเคราะห์มันขึ้นมา
วิธีนี้ช่วยให้ onboarding และ diagnostics อธิบายสถานะของ source-plane ได้โดยไม่ต้อง
import plugin runtime

รายการ npm ภายนอกอย่างเป็นทางการควรเลือกใช้ `npmSpec` แบบ exact พร้อม
`expectedIntegrity` ชื่อ package เปล่าและ dist-tags ยังคงใช้ได้เพื่อความเข้ากันได้
แต่จะทำให้เกิดคำเตือนใน source-plane เพื่อให้แค็ตตาล็อกสามารถขยับไปสู่การติดตั้งแบบ pinned และตรวจสอบ integrity ได้ โดยไม่ทำให้ plugins ที่มีอยู่เดิมพัง
เมื่อ onboarding ติดตั้งจาก local catalog path ระบบจะบันทึก
รายการ `plugins.installs` พร้อม `source: "path"` และ `sourcePath`
ที่เป็น workspace-relative เมื่อเป็นไปได้ พาธการโหลดจริงแบบ absolute ยังคงอยู่ใน
`plugins.load.paths`; ระเบียนการติดตั้งจะหลีกเลี่ยงการคัดลอกพาธของเวิร์กสเตชันภายในเครื่อง
ลงใน config ที่อยู่ยาว วิธีนี้ช่วยให้ local development installs ยังมองเห็นได้ต่อ
source-plane diagnostics โดยไม่เพิ่มพื้นผิวการเปิดเผย raw filesystem-path ชุดที่สอง

## context engine plugins

context engine plugins เป็นเจ้าของ orchestration ของ session context สำหรับ ingest, assembly
และ Compaction ลงทะเบียนจาก Plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` จากนั้นเลือก engine ที่ใช้งานด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ Plugin ของคุณต้องการแทนที่หรือขยาย default context
pipeline แทนที่จะเพียงเพิ่ม memory search หรือ hooks

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

## การเพิ่ม capability ใหม่

เมื่อ Plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้าม
ระบบ Plugin ด้วย private reach-in ให้เพิ่ม capability ที่ขาดอยู่แทน

ลำดับที่แนะนำ:

1. กำหนด core contract
   ตัดสินใจว่าพฤติกรรมแบบใช้ร่วมกันใดที่ core ควรเป็นเจ้าของ: policy, fallback, config merge,
   lifecycle, semantics ที่หันหน้าไปทางแชนเนล และรูปร่างของ runtime helper
2. เพิ่มพื้นผิวแบบ typed สำหรับการลงทะเบียน/runtime ของ Plugin
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วย
   พื้นผิว capability แบบ typed ที่เล็กที่สุดแต่มีประโยชน์
3. เดินสาย core + ผู้ใช้ในส่วน channel/feature
   แชนเนลและ feature plugins ควรใช้ capability ใหม่ผ่าน core
   ไม่ใช่ import vendor implementation โดยตรง
4. ลงทะเบียน vendor implementations
   จากนั้น vendor plugins จึงลงทะเบียน backends ของตนกับ capability นั้น
5. เพิ่ม contract coverage
   เพิ่ม tests เพื่อให้รูปแบบความเป็นเจ้าของและการลงทะเบียนยังคงชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw ยังคงมีจุดยืน โดยไม่กลายเป็นระบบที่ hardcoded ตามมุมมองของ
provider รายใดรายหนึ่ง ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับเช็กลิสต์ไฟล์และตัวอย่างที่ทำงานจริง

### เช็กลิสต์สำหรับ capability

เมื่อคุณเพิ่ม capability ใหม่ โดยทั่วไป implementation ควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- ประเภทของ core contract ใน `src/<capability>/types.ts`
- core runner/runtime helper ใน `src/<capability>/runtime.ts`
- พื้นผิวการลงทะเบียนของ Plugin API ใน `src/plugins/types.ts`
- การเดินสาย plugin registry ใน `src/plugins/registry.ts`
- การเปิดเผย plugin runtime ใน `src/plugins/runtime/*` เมื่อ feature/channel
  plugins ต้องใช้มัน
- capture/test helpers ใน `src/test-utils/plugin-registration.ts`
- การยืนยันความเป็นเจ้าของ/contract ใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับโอเปอเรเตอร์/Plugin ใน `docs/`

หากพื้นผิวใดพื้นผิวหนึ่งหายไป มักเป็นสัญญาณว่า capability นั้น
ยังไม่ถูกผสานรวมอย่างสมบูรณ์

### เทมเพลตของ capability

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

รูปแบบของ contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

ซึ่งทำให้กฎเรียบง่าย:

- core เป็นเจ้าของ capability contract + orchestration
- vendor plugins เป็นเจ้าของ vendor implementations
- feature/channel plugins ใช้ runtime helpers
- contract tests ช่วยให้ความเป็นเจ้าของชัดเจน

## ที่เกี่ยวข้อง

- [Plugin architecture](/th/plugins/architecture) — โมเดล capability และรูปแบบสาธารณะ
- [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- [Plugin SDK setup](/th/plugins/sdk-setup)
- [Building plugins](/th/plugins/building-plugins)
