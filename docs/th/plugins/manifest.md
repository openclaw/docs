---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องการส่งมอบ schema ของ config สำหรับ Plugin หรือดีบักข้อผิดพลาดในการตรวจสอบ Plugin
summary: ข้อกำหนดของ manifest ของ Plugin + JSON schema (การตรวจสอบ config แบบเข้มงวด)
title: manifest ของ Plugin
x-i18n:
    generated_at: "2026-04-26T11:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

หน้านี้มีไว้สำหรับ **manifest ของ native OpenClaw plugin** เท่านั้น

สำหรับเลย์เอาต์ bundle ที่เข้ากันได้ ดู [Plugin bundles](/th/plugins/bundles)

รูปแบบ bundle ที่เข้ากันได้ใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือเลย์เอาต์ component เริ่มต้นของ Claude
  ที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw ตรวจจับเลย์เอาต์ bundle เหล่านั้นอัตโนมัติด้วย แต่จะไม่ตรวจสอบ
กับ schema ของ `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ compatible bundles ปัจจุบัน OpenClaw จะอ่าน bundle metadata พร้อมทั้ง
skill roots ที่ประกาศไว้, Claude command roots, ค่าเริ่มต้นจาก `settings.json` ของ Claude bundle,
ค่าเริ่มต้นของ Claude bundle LSP และ supported hook packs เมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของ OpenClaw runtime

native OpenClaw plugin ทุกตัว **ต้อง** มีไฟล์ `openclaw.plugin.json` อยู่ที่
**plugin root** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบ configuration
**โดยไม่ต้องรันโค้ดของ Plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถูกมองว่าเป็นข้อผิดพลาดของ Plugin และบล็อกการตรวจสอบ config

ดูคู่มือระบบ Plugin ฉบับเต็มได้ที่: [Plugins](/th/tools/plugin)
สำหรับ capability model แบบเนทีฟและแนวทางความเข้ากันได้ภายนอกในปัจจุบัน:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือเมทาดาต้าที่ OpenClaw อ่าน **ก่อนจะโหลดโค้ด
Plugin ของคุณ** ทุกอย่างด้านล่างต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูต
Plugin runtime

**ใช้สำหรับ:**

- identity ของ Plugin, การตรวจสอบ config และ UI hints ของ config
- เมทาดาต้าของ auth, onboarding และ setup (alias, auto-enable, provider env vars, auth choices)
- activation hints สำหรับพื้นผิว control-plane
- ความเป็นเจ้าของ model-family แบบ shorthand
- snapshots แบบคงที่ของความเป็นเจ้าของ capability (`contracts`)
- เมทาดาต้าของ QA runner ที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันสามารถตรวจสอบได้
- เมทาดาต้า config เฉพาะช่องที่ถูก merge เข้าไปใน catalog และพื้นผิวการตรวจสอบ

**ห้ามใช้สำหรับ:** การลงทะเบียนพฤติกรรม runtime, การประกาศ code entrypoints
หรือ npm install metadata สิ่งเหล่านั้นเป็นหน้าที่ของโค้ด Plugin และ `package.json`

## ตัวอย่างขั้นต่ำ

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## ตัวอย่างแบบครบขึ้น

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin ผู้ให้บริการ OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## ข้อมูลอ้างอิงฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น | ประเภท                           | ความหมาย                                                                                                                                                                                                                      |
| ------------------------------------ | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | ใช่    | `string`                         | ID canonical ของ Plugin นี่คือ ID ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                              |
| `configSchema`                       | ใช่    | `object`                         | JSON Schema แบบ inline สำหรับ config ของ Plugin นี้                                                                                                                                                                             |
| `enabledByDefault`                   | ไม่    | `true`                           | ทำเครื่องหมายว่า bundled Plugin ถูกเปิดใช้งานตามค่าเริ่มต้น หากละไว้ หรือกำหนดค่าเป็นค่าใดก็ตามที่ไม่ใช่ `true` Plugin จะยังคงถูกปิดตามค่าเริ่มต้น                                                                          |
| `legacyPluginIds`                    | ไม่    | `string[]`                       | IDs แบบเดิมที่ normalize มายัง canonical plugin id นี้                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | ไม่    | `string[]`                       | provider ids ที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อมีการอ้างถึงผ่าน auth, config หรือ model refs                                                                                                                     |
| `kind`                               | ไม่    | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบ exclusive ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                   |
| `channels`                           | ไม่    | `string[]`                       | channel ids ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับ discovery และการตรวจสอบ config                                                                                                                                                 |
| `providers`                          | ไม่    | `string[]`                       | provider ids ที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | ไม่    | `string`                         | พาธโมดูล provider-discovery แบบ lightweight โดยอิงจาก plugin root สำหรับเมทาดาต้า provider catalog ที่มีขอบเขตอยู่ใน manifest และสามารถโหลดได้โดยไม่ต้อง activate full plugin runtime                                   |
| `modelSupport`                       | ไม่    | `object`                         | เมทาดาต้า shorthand ของ model-family ที่ manifest เป็นเจ้าของ ใช้เพื่อ auto-load Plugin ก่อน runtime                                                                                                                         |
| `modelCatalog`                       | ไม่    | `object`                         | เมทาดาต้า model catalog แบบประกาศสำหรับ providers ที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญา control-plane สำหรับการทำรายการแบบอ่านอย่างเดียว, onboarding, model pickers, aliases และ suppression ในอนาคต โดยไม่ต้องโหลด plugin runtime |
| `providerEndpoints`                  | ไม่    | `object[]`                       | เมทาดาต้า host/baseUrl ของ endpoint ที่ manifest เป็นเจ้าของ สำหรับ provider routes ที่ core ต้องจัดประเภทก่อนโหลด provider runtime                                                                                           |
| `cliBackends`                        | ไม่    | `string[]`                       | CLI inference backend ids ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับ startup auto-activation จาก explicit config refs                                                                                                                |
| `syntheticAuthRefs`                  | ไม่    | `string[]`                       | refs ของ provider หรือ CLI backend ที่ synthetic auth hook ของ Plugin เจ้าของควรถูก probe ระหว่าง cold model discovery ก่อน runtime โหลด                                                                                    |
| `nonSecretAuthMarkers`               | ไม่    | `string[]`                       | ค่า API key placeholder ที่เป็นของ bundled plugin ซึ่งแสดงถึงสถานะข้อมูลรับรองแบบ non-secret, local, OAuth หรือ ambient                                                                                                       |
| `commandAliases`                     | ไม่    | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้าง diagnostics แบบรับรู้ Plugin สำหรับ config และ CLI ก่อน runtime โหลด                                                                                                         |
| `providerAuthEnvVars`                | ไม่    | `Record<string, string[]>`       | เมทาดาต้า env แบบเข้ากันได้ย้อนหลังที่เลิกใช้แล้วสำหรับการค้นหา auth/status ของ provider ควรใช้ `setup.providers[].envVars` สำหรับ Plugins ใหม่; OpenClaw ยังคงอ่านสิ่งนี้ในช่วงหน้าต่าง deprecation                        |
| `providerAuthAliases`                | ไม่    | `Record<string, string>`         | provider ids ที่ควรใช้ provider id อื่นซ้ำสำหรับการค้นหา auth เช่น coding provider ที่แชร์ API key และ auth profiles กับ base provider                                                                                      |
| `channelEnvVars`                     | ไม่    | `Record<string, string[]>`       | เมทาดาต้า env ของช่องแบบต้นทุนต่ำที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้สำหรับพื้นผิวการตั้งค่าหรือ auth ของช่องที่ขับเคลื่อนด้วย env ซึ่งตัวช่วย generic สำหรับ startup/config ควรมองเห็น         |
| `providerAuthChoices`                | ไม่    | `object[]`                       | เมทาดาต้า auth-choice แบบต้นทุนต่ำสำหรับ onboarding pickers, preferred-provider resolution และการผูก CLI flag แบบง่าย                                                                                                         |
| `activation`                         | ไม่    | `object`                         | เมทาดาต้า activation planner แบบต้นทุนต่ำสำหรับการโหลดที่ถูกทริกเกอร์ด้วย provider, command, channel, route และ capability เป็นเมทาดาต้าเท่านั้น; พฤติกรรมจริงยังคงเป็นของ plugin runtime                                  |
| `setup`                              | ไม่    | `object`                         | descriptors ของ setup/onboarding แบบต้นทุนต่ำที่พื้นผิว discovery และ setup สามารถตรวจสอบได้โดยไม่ต้องโหลด plugin runtime                                                                                                   |
| `qaRunners`                          | ไม่    | `object[]`                       | descriptors ของ QA runner แบบต้นทุนต่ำที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันใช้งานก่อน plugin runtime โหลด                                                                                                                    |
| `contracts`                          | ไม่    | `object`                         | snapshot แบบคงที่ของ bundled capability สำหรับ external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และ tool ownership |
| `mediaUnderstandingProviderMetadata` | ไม่    | `Record<string, object>`         | ค่าเริ่มต้นของ media-understanding แบบต้นทุนต่ำสำหรับ provider ids ที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                         |
| `channelConfigs`                     | ไม่    | `Record<string, object>`         | เมทาดาต้า config ของช่องที่ manifest เป็นเจ้าของ ซึ่ง merge เข้าไปในพื้นผิว discovery และ validation ก่อน runtime โหลด                                                                                                         |
| `skills`                             | ไม่    | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด โดยอิงจาก plugin root                                                                                                                                                                              |
| `name`                               | ไม่    | `string`                         | ชื่อ Plugin แบบอ่านเข้าใจได้สำหรับมนุษย์                                                                                                                                                                                       |
| `description`                        | ไม่    | `string`                         | สรุปสั้น ๆ ที่แสดงในพื้นผิวของ Plugin                                                                                                                                                                                          |
| `version`                            | ไม่    | `string`                         | เวอร์ชันของ Plugin เพื่อใช้เป็นข้อมูลประกอบ                                                                                                                                                                                    |
| `uiHints`                            | ไม่    | `Record<string, object>`         | ป้ายกำกับ UI, placeholders และ hints เรื่องความอ่อนไหวสำหรับฟิลด์ config                                                                                                                                                      |

## ข้อมูลอ้างอิง `providerAuthChoices`

แต่ละรายการ `providerAuthChoices` อธิบายตัวเลือก onboarding หรือ auth หนึ่งรายการ
OpenClaw จะอ่านสิ่งนี้ก่อนที่ provider runtime จะโหลด
รายการ setup ของ provider ใช้ทั้งตัวเลือกจาก manifest เหล่านี้, ตัวเลือก setup
ที่ได้จาก descriptor และเมทาดาต้าจาก install-catalog โดยไม่ต้องโหลด provider runtime

| ฟิลด์                 | จำเป็น | ประเภท                                          | ความหมาย                                                                                                  |
| --------------------- | ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่    | `string`                                        | provider id ที่ตัวเลือกนี้สังกัดอยู่                                                                          |
| `method`              | ใช่    | `string`                                        | auth method id ที่จะใช้ dispatch ไปหา                                                                        |
| `choiceId`            | ใช่    | `string`                                        | auth-choice id แบบคงที่ที่ใช้โดย onboarding และโฟลว์ CLI                                                     |
| `choiceLabel`         | ไม่    | `string`                                        | ป้ายกำกับที่ผู้ใช้มองเห็น หากไม่ระบุ OpenClaw จะ fallback ไปใช้ `choiceId`                                    |
| `choiceHint`          | ไม่    | `string`                                        | ข้อความช่วยเหลือสั้น ๆ สำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่    | `number`                                        | ค่าที่ต่ำกว่าจะถูกเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดย assistant                                     |
| `assistantVisibility` | ไม่    | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกนี้จากตัวเลือกของ assistant แต่ยังคงอนุญาตให้เลือกด้วย CLI แบบแมนนวล                           |
| `deprecatedChoiceIds` | ไม่    | `string[]`                                      | choice ids แบบเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้มายังตัวเลือกทดแทนนี้                                           |
| `groupId`             | ไม่    | `string`                                        | group id แบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                                   |
| `groupLabel`          | ไม่    | `string`                                        | ป้ายกำกับของกลุ่มที่ผู้ใช้มองเห็น                                                                             |
| `groupHint`           | ไม่    | `string`                                        | ข้อความช่วยเหลือสั้น ๆ สำหรับกลุ่ม                                                                           |
| `optionKey`           | ไม่    | `string`                                        | option key ภายในสำหรับโฟลว์ auth แบบแฟล็กเดียวอย่างง่าย                                                     |
| `cliFlag`             | ไม่    | `string`                                        | ชื่อ CLI flag เช่น `--openrouter-api-key`                                                                   |
| `cliOption`           | ไม่    | `string`                                        | รูปแบบ CLI option แบบเต็ม เช่น `--openrouter-api-key <key>`                                                  |
| `cliDescription`      | ไม่    | `string`                                        | คำอธิบายที่ใช้ใน CLI help                                                                                   |
| `onboardingScopes`    | ไม่    | `Array<"text-inference" \| "image-generation">` | พื้นผิว onboarding ใดบ้างที่ควรแสดงตัวเลือกนี้ หากไม่ระบุ ค่าจะเป็น `["text-inference"]` ตามค่าเริ่มต้น |

## ข้อมูลอ้างอิง `commandAliases`

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่ง runtime ที่ผู้ใช้อาจ
ใส่ผิดลงใน `plugins.allow` หรือพยายามรันเป็น root CLI command OpenClaw
ใช้เมทาดาต้านี้สำหรับ diagnostics โดยไม่ต้อง import plugin runtime code

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| ฟิลด์        | จำเป็น | ประเภท            | ความหมาย                                                                 |
| ------------ | ------ | ----------------- | ------------------------------------------------------------------------ |
| `name`       | ใช่    | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                                           |
| `kind`       | ไม่    | `"runtime-slash"` | ทำเครื่องหมาย alias นี้ว่าเป็นคำสั่ง slash ในแชต ไม่ใช่ root CLI command |
| `cliCommand` | ไม่    | `string`          | root CLI command ที่เกี่ยวข้องเพื่อใช้แนะนำสำหรับการทำงานผ่าน CLI หากมี    |

## ข้อมูลอ้างอิง `activation`

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใดบ้าง
ที่ควรรวมมันไว้ในแผน activation/load

บล็อกนี้เป็นเมทาดาต้าของ planner ไม่ใช่ lifecycle API มันไม่ลงทะเบียน
พฤติกรรม runtime, ไม่แทนที่ `register(...)` และไม่รับประกันว่า
plugin code ได้ถูกรันไปแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด candidate plugins ก่อนจะ fallback ไปยังเมทาดาต้าความเป็นเจ้าของใน manifest ที่มีอยู่ เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ควรใช้เมทาดาต้าที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของได้อยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, setup descriptors หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์ได้ ใช้ `activation` สำหรับ planner hints เพิ่มเติมที่ไม่สามารถแทนได้ด้วยฟิลด์ความเป็นเจ้าของเหล่านั้น
ใช้ `cliBackends` ระดับบนสุดสำหรับ CLI runtime aliases เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` มีไว้เฉพาะสำหรับ
embedded agent harness ids ที่ยังไม่มีฟิลด์ความเป็นเจ้าของอยู่แล้ว

บล็อกนี้เป็นเมทาดาต้าเท่านั้น มันไม่ลงทะเบียนพฤติกรรม runtime และไม่
แทนที่ `register(...)`, `setupEntry` หรือ runtime/plugin entrypoints อื่น
ตัวใช้งานปัจจุบันใช้มันเป็น narrowing hint ก่อนการโหลด Plugin แบบกว้างกว่า ดังนั้น
activation metadata ที่หายไปมักมีผลเพียงด้านประสิทธิภาพ; ไม่ควร
เปลี่ยนความถูกต้อง ตราบใดที่ legacy manifest ownership fallbacks ยังมีอยู่

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| ฟิลด์              | จำเป็น | ประเภท                                               | ความหมาย                                                                                                                                       |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onProviders`      | ไม่    | `string[]`                                           | provider ids ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                      |
| `onAgentHarnesses` | ไม่    | `string[]`                                           | embedded agent harness runtime ids ที่ควรรวม Plugin นี้ไว้ในแผน activation/load ใช้ `cliBackends` ระดับบนสุดสำหรับ CLI backend aliases         |
| `onCommands`       | ไม่    | `string[]`                                           | command ids ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                       |
| `onChannels`       | ไม่    | `string[]`                                           | channel ids ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                       |
| `onRoutes`         | ไม่    | `string[]`                                           | route kinds ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                       |
| `onCapabilities`   | ไม่    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | capability hints แบบกว้างที่ใช้โดย control-plane activation planning ควรใช้ฟิลด์ที่แคบกว่านี้เมื่อเป็นไปได้                                  |

ตัวใช้งานจริงในปัจจุบัน:

- command-triggered CLI planning จะ fallback ไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- agent-runtime startup planning ใช้ `activation.onAgentHarnesses` สำหรับ
  embedded harnesses และใช้ `cliBackends[]` ระดับบนสุดสำหรับ CLI runtime aliases
- channel-triggered setup/channel planning จะ fallback ไปใช้ความเป็นเจ้าของ `channels[]`
  แบบเดิม เมื่อไม่มี explicit channel activation metadata
- provider-triggered setup/runtime planning จะ fallback ไปใช้
  ความเป็นเจ้าของ `providers[]` และ `cliBackends[]` ระดับบนสุดแบบเดิม เมื่อไม่มี explicit provider
  activation metadata

planner diagnostics สามารถแยก explicit activation hints ออกจาก manifest
ownership fallback ได้ ตัวอย่างเช่น `activation-command-hint` หมายถึง
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายถึง
planner ใช้ความเป็นเจ้าของจาก `commandAliases` แทน reason labels เหล่านี้มีไว้สำหรับ
host diagnostics และ tests; ผู้เขียน Plugin ควรยังคงประกาศเมทาดาต้าที่อธิบายความเป็นเจ้าของได้ดีที่สุด

## ข้อมูลอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ Plugin มี transport runners หนึ่งตัวหรือมากกว่าภายใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน ให้เก็บเมทาดาต้านี้ให้มีต้นทุนต่ำและเป็นแบบคงที่; plugin
runtime ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
ที่เบา ซึ่ง export `qaRunnerCliRegistrations`

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "รัน Matrix live QA lane ที่รองรับด้วย Docker กับ homeserver แบบใช้แล้วทิ้ง"
    }
  ]
}
```

| ฟิลด์         | จำเป็น | ประเภท   | ความหมาย                                                         |
| ------------- | ------ | -------- | ----------------------------------------------------------------- |
| `commandName` | ใช่    | `string` | subcommand ที่ mount ใต้ `openclaw qa` เช่น `matrix`             |
| `description` | ไม่    | `string` | ข้อความ help แบบ fallback ที่ใช้เมื่อโฮสต์ที่ใช้ร่วมกันต้องการ stub command |

## ข้อมูลอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการเมทาดาต้าของ Plugin แบบต้นทุนต่ำ
ก่อนที่ runtime จะโหลด

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังคงอธิบาย CLI inference
backends ส่วน `setup.cliBackends` คือพื้นผิว descriptor เฉพาะ setup สำหรับ
control-plane/setup flows ที่ควรคงเป็น metadata-only

เมื่อมีการระบุ `setup.providers` และ `setup.cliBackends` คือพื้นผิว lookup แบบ descriptor-first ที่ต้องการสำหรับ setup discovery หาก descriptor เพียงแค่จำกัด candidate plugin ให้แคบลง และ setup ยังคงต้องการ setup-time runtime hooks ที่สมบูรณ์กว่า ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็นเส้นทางการทำงาน fallback

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหา generic provider auth และ env-var ด้วย `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter ในช่วงหน้าต่าง deprecation แต่ non-bundled plugins ที่ยังใช้มัน
จะได้รับ manifest diagnostic Plugins ใหม่ควรวางเมทาดาต้า env ของ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมาน setup choices แบบง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มี setup entry หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้ setup runtime explicit `providerAuthChoices` ยังคงเป็นตัวเลือกที่ควรใช้ก่อนสำหรับ labels แบบกำหนดเอง, CLI flags, onboarding scope และเมทาดาต้าสำหรับ assistant

ตั้งค่า `requiresRuntime: false` เฉพาะเมื่อ descriptors เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw จะถือว่า `false` แบบ explicit เป็นสัญญาแบบ descriptor-only
และจะไม่รัน `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
plugin แบบ descriptor-only ยังส่งมอบหนึ่งใน setup runtime entries เหล่านั้นอยู่
OpenClaw จะรายงาน diagnostic แบบ additive และยังคงเพิกเฉยมันต่อไป การละ
`requiresRuntime` ไว้จะคงพฤติกรรม fallback แบบเดิม เพื่อไม่ให้ plugins เดิมที่เพิ่ม
descriptors โดยไม่มีแฟล็กนี้เกิดการพัง

เนื่องจากการค้นหา setup สามารถรันโค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้
ค่าที่ normalize แล้วของ `setup.providers[].id` และ `setup.cliBackends[]` จึงต้องคงความไม่ซ้ำกัน
ข้าม plugins ที่ถูกค้นพบ ความเป็นเจ้าของที่กำกวมจะล้มเหลวแบบ fail closed แทนการเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อมีการรัน setup runtime จริง setup registry diagnostics จะรายงาน descriptor
drift หาก `setup-api` ลงทะเบียน provider หรือ CLI backend ที่ manifest
descriptors ไม่ได้ประกาศไว้ หรือถ้า descriptor ไม่มี runtime registration ที่ตรงกัน
diagnostics เหล่านี้เป็นแบบ additive และไม่ปฏิเสธ legacy plugins

### ข้อมูลอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น | ประเภท     | ความหมาย                                                                                 |
| ------------- | ------ | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | ใช่    | `string`   | provider id ที่ถูกเปิดเผยระหว่าง setup หรือ onboarding ให้คง normalized ids ให้ไม่ซ้ำกันทั้งระบบ |
| `authMethods` | ไม่    | `string[]` | setup/auth method ids ที่ provider นี้รองรับได้โดยไม่ต้องโหลด full runtime                 |
| `envVars`     | ไม่    | `string[]` | env vars ที่พื้นผิว generic setup/status สามารถตรวจสอบได้ก่อน plugin runtime โหลด          |

### ฟิลด์ของ `setup`

| ฟิลด์              | จำเป็น | ประเภท     | ความหมาย                                                                                          |
| ------------------ | ------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่    | `object[]` | descriptors ของ provider setup ที่เปิดเผยระหว่าง setup และ onboarding                               |
| `cliBackends`      | ไม่    | `string[]` | backend ids สำหรับเวลาทำ setup ที่ใช้สำหรับ descriptor-first setup lookup ให้คง normalized ids ไม่ซ้ำกันทั้งระบบ |
| `configMigrations` | ไม่    | `string[]` | config migration ids ที่พื้นผิว setup ของ Plugin นี้เป็นเจ้าของ                                       |
| `requiresRuntime`  | ไม่    | `boolean`  | setup ยังต้องใช้การรัน `setup-api` หลัง descriptor lookup หรือไม่                                    |

## ข้อมูลอ้างอิง `uiHints`

`uiHints` เป็นแผนที่จากชื่อฟิลด์ config ไปยัง rendering hints ขนาดเล็ก

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

hint ของแต่ละฟิลด์สามารถมีได้ดังนี้:

| ฟิลด์         | ประเภท     | ความหมาย                                  |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | ป้ายกำกับฟิลด์ที่ผู้ใช้มองเห็น            |
| `help`        | `string`   | ข้อความช่วยเหลือสั้น ๆ                   |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                     |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์นี้ว่าเป็นขั้นสูง      |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์นี้ว่าเป็นความลับหรืออ่อนไหว |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตในฟอร์ม  |

## ข้อมูลอ้างอิง `contracts`

ใช้ `contracts` เฉพาะสำหรับเมทาดาต้าความเป็นเจ้าของ capability แบบคงที่ ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้อง import plugin runtime

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

แต่ละรายการเป็นแบบไม่บังคับ:

| ฟิลด์                            | ประเภท     | ความหมาย                                                                |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory ids ปัจจุบันคือ `codex-app-server`   |
| `agentToolResultMiddleware`      | `string[]` | runtime ids ที่ bundled plugin สามารถลงทะเบียน tool-result middleware ให้ได้ |
| `externalAuthProviders`          | `string[]` | provider ids ที่ Plugin นี้เป็นเจ้าของ external auth profile hook        |
| `speechProviders`                | `string[]` | speech provider ids ที่ Plugin นี้เป็นเจ้าของ                            |
| `realtimeTranscriptionProviders` | `string[]` | realtime-transcription provider ids ที่ Plugin นี้เป็นเจ้าของ             |
| `realtimeVoiceProviders`         | `string[]` | realtime-voice provider ids ที่ Plugin นี้เป็นเจ้าของ                    |
| `memoryEmbeddingProviders`       | `string[]` | memory embedding provider ids ที่ Plugin นี้เป็นเจ้าของ                  |
| `mediaUnderstandingProviders`    | `string[]` | media-understanding provider ids ที่ Plugin นี้เป็นเจ้าของ               |
| `imageGenerationProviders`       | `string[]` | image-generation provider ids ที่ Plugin นี้เป็นเจ้าของ                  |
| `videoGenerationProviders`       | `string[]` | video-generation provider ids ที่ Plugin นี้เป็นเจ้าของ                  |
| `webFetchProviders`              | `string[]` | web-fetch provider ids ที่ Plugin นี้เป็นเจ้าของ                         |
| `webSearchProviders`             | `string[]` | web-search provider ids ที่ Plugin นี้เป็นเจ้าของ                        |
| `tools`                          | `string[]` | ชื่อ agent tool ที่ Plugin นี้เป็นเจ้าของสำหรับ bundled contract checks  |

`contracts.embeddedExtensionFactories` ถูกคงไว้สำหรับ bundled Codex
app-server-only extension factories ส่วน bundled tool-result transforms ควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน External plugins ไม่สามารถ
ลงทะเบียน tool-result middleware ได้ เพราะ seam นี้สามารถเขียนทับผลลัพธ์ของเครื่องมือที่มีความเชื่อถือสูงก่อนที่โมเดลจะเห็น

provider plugins ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugins ที่ไม่มีการประกาศนี้ยังคงรันผ่าน deprecated compatibility fallback ได้ แต่ fallback นั้นช้ากว่าและจะถูกนำออกหลังหน้าต่าง migration

bundled memory embedding providers ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับทุก adapter id ที่เปิดเผย รวมถึง
adapters ที่มีมาในตัวอย่าง `local` เส้นทาง CLI แบบ standalone ใช้สัญญา manifest นี้เพื่อโหลดเฉพาะ Plugin เจ้าของ ก่อนที่ full Gateway runtime จะลงทะเบียน providers

## ข้อมูลอ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
โมเดลค่าเริ่มต้น, ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสารแบบ native ที่ generic core helpers ต้องใช้ก่อน runtime โหลด คีย์ต้องถูกประกาศไว้ใน
`contracts.mediaUnderstandingProviders` ด้วย

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

แต่ละรายการของ provider สามารถมีได้ดังนี้:

| ฟิลด์                  | ประเภท                              | ความหมาย                                                                  |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | media capabilities ที่ provider นี้เปิดเผย                                  |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้น capability-to-model ที่ใช้เมื่อ config ไม่ได้ระบุโมเดล          |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะเรียงก่อนสำหรับ automatic credential-based provider fallback |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบ native ที่ provider รองรับ                                  |

## ข้อมูลอ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ channel plugin ต้องการเมทาดาต้า config แบบต้นทุนต่ำก่อน
runtime โหลด การค้นหา setup/status ของช่องแบบอ่านอย่างเดียวสามารถใช้เมทาดาต้านี้
ได้โดยตรงสำหรับ configured external channels เมื่อไม่มี setup entry หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้ setup runtime

`channelConfigs` เป็นเมทาดาต้าใน manifest ของ Plugin ไม่ใช่ top-level user config
section ใหม่ ผู้ใช้ยังคงกำหนดค่า channel instances ภายใต้ `channels.<channel-id>`
OpenClaw อ่านเมทาดาต้าใน manifest เพื่อพิจารณาว่า Plugin ใดเป็นเจ้าของ configured
channel นั้น ก่อนที่ plugin runtime code จะถูกเรียกใช้

สำหรับ channel plugin, `configSchema` และ `channelConfigs` อธิบายคนละพาธ:

- `configSchema` ใช้ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ใช้ตรวจสอบ `channels.<channel-id>`

non-bundled plugins ที่ประกาศ `channels[]` ควรประกาศ `channelConfigs` ที่ตรงกันด้วย
หากไม่มี OpenClaw ยังคงโหลด Plugin ได้ แต่พื้นผิว cold-path ของ config schema, setup และ Control UI จะไม่สามารถรู้รูปแบบตัวเลือกที่เป็นของช่องได้ จนกว่า plugin runtime จะถูกเรียกใช้

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้นแบบ `auto` ที่เป็นแบบคงที่สำหรับการตรวจสอบ command config ที่รันก่อน channel runtime โหลด Bundled channels ยังสามารถเผยแพร่ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่ไปกับเมทาดาต้า channel catalog อื่น ๆ ที่ package เป็นเจ้าของได้

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "การเชื่อมต่อ Matrix homeserver",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

แต่ละรายการของ channel สามารถมีได้ดังนี้:

| ฟิลด์         | ประเภท                   | ความหมาย                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการ declared channel config        |
| `uiHints`     | `Record<string, object>` | UI labels/placeholders/sensitive hints แบบไม่บังคับสำหรับส่วน config ของช่องนั้น           |
| `label`       | `string`                 | ป้ายกำกับของช่องที่ merge เข้า picker และ inspect surfaces เมื่อ runtime metadata ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายสั้น ๆ ของช่องสำหรับ inspect และ catalog surfaces                                  |
| `commands`    | `object`                 | native command และ native skill auto-defaults แบบคงที่ สำหรับการตรวจสอบ config ก่อน runtime |
| `preferOver`  | `string[]`               | legacy หรือ plugin ids ที่มีลำดับความสำคัญต่ำกว่า ซึ่งช่องนี้ควรมีอันดับเหนือกว่าใน selection surfaces |

### การแทนที่ channel plugin อื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ควรได้รับการเลือกก่อนสำหรับ channel id ที่
อีก Plugin หนึ่งก็สามารถให้ได้เช่นกัน กรณีที่พบบ่อยคือ plugin id ที่ถูกเปลี่ยนชื่อ, standalone plugin ที่มาแทน bundled plugin หรือ maintained fork ที่
ยังคงใช้ channel id เดิมเพื่อความเข้ากันได้ของ config

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

เมื่อมีการกำหนดค่า `channels.chat` OpenClaw จะพิจารณาทั้ง channel id และ
preferred plugin id หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
เป็น bundled หรือถูกเปิดใช้งานตามค่าเริ่มต้น OpenClaw จะปิดมันใน effective
runtime config เพื่อให้มี Plugin เพียงตัวเดียวที่เป็นเจ้าของช่องและเครื่องมือของมัน อย่างไรก็ตามการเลือกแบบ explicit ของผู้ใช้ยังคงมีความสำคัญสูงสุด: หากผู้ใช้เปิดใช้ทั้งสอง Plugin อย่างชัดเจน OpenClaw จะคงการเลือกนั้นไว้และรายงาน duplicate channel/tool diagnostics แทนการเปลี่ยนชุด Plugin ที่ร้องขอแบบเงียบ ๆ

ให้จำกัดขอบเขตของ `preferOver` ไว้เฉพาะ plugin ids ที่สามารถให้ช่องเดียวกันได้จริง
มันไม่ใช่ฟิลด์ลำดับความสำคัญแบบทั่วไป และไม่ได้เปลี่ยนชื่อคีย์ config ของผู้ใช้

## ข้อมูลอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน provider plugin ของคุณจาก
shorthand model ids เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่ plugin runtime
จะโหลด

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญดังนี้:

- `provider/model` refs แบบ explicit จะใช้เมทาดาต้า `providers` ใน manifest ของเจ้าของ
- `modelPatterns` มีความสำคัญเหนือ `modelPrefixes`
- หาก non-bundled plugin หนึ่งตัวและ bundled plugin หนึ่งตัวตรงกันทั้งคู่
  non-bundled plugin จะชนะ
- ความกำกวมที่เหลือจะถูกเพิกเฉยจนกว่าผู้ใช้หรือ config จะระบุ provider

ฟิลด์:

| ฟิลด์           | ประเภท     | ความหมาย                                                                   |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | prefixes ที่จับคู่ด้วย `startsWith` กับ shorthand model ids                 |
| `modelPatterns` | `string[]` | แหล่ง regex ที่จับคู่กับ shorthand model ids หลังลบ profile suffix แล้ว      |

## ข้อมูลอ้างอิง `modelCatalog`

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้เมทาดาต้าโมเดลของ provider ก่อน
โหลด plugin runtime นี่คือแหล่งข้อมูลที่ manifest เป็นเจ้าของสำหรับ catalog
rows แบบคงที่, provider aliases, suppression rules และ discovery mode การ refresh ระหว่าง runtime ยังคงเป็นหน้าที่ของ provider runtime code แต่ manifest จะบอก core ว่าเมื่อใดจำเป็นต้องใช้ runtime

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

ฟิลด์ระดับบนสุด:

| ฟิลด์          | ประเภท                                                   | ความหมาย                                                                                              |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | catalog rows สำหรับ provider ids ที่ Plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย |
| `aliases`      | `Record<string, object>`                                 | provider aliases ที่ควร resolve ไปยัง owned provider สำหรับการวางแผน catalog หรือ suppression        |
| `suppressions` | `object[]`                                               | model rows จากแหล่งอื่นที่ Plugin นี้ suppress ด้วยเหตุผลเฉพาะของ provider                           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | catalog ของ provider อ่านจากเมทาดาต้าใน manifest ได้, refresh เข้าแคชได้ หรือจำเป็นต้องใช้ runtime |

ฟิลด์ของ provider:

| ฟิลด์     | ประเภท                   | ความหมาย                                                          |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | default base URL แบบไม่บังคับสำหรับโมเดลใน catalog ของ provider นี้ |
| `api`     | `ModelApi`               | default API adapter แบบไม่บังคับสำหรับโมเดลใน catalog นี้          |
| `headers` | `Record<string, string>` | static headers แบบไม่บังคับที่ใช้กับ provider catalog นี้         |
| `models`  | `object[]`               | model rows ที่จำเป็น rows ที่ไม่มี `id` จะถูกละเว้น                |

ฟิลด์ของ model:

| ฟิลด์           | ประเภท                                                         | ความหมาย                                                                     |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | provider-local model id โดยไม่มี prefix `provider/`                           |
| `name`          | `string`                                                       | display name แบบไม่บังคับ                                                     |
| `api`           | `ModelApi`                                                     | per-model API override แบบไม่บังคับ                                           |
| `baseUrl`       | `string`                                                       | per-model base URL override แบบไม่บังคับ                                      |
| `headers`       | `Record<string, string>`                                       | per-model static headers แบบไม่บังคับ                                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | modalities ที่โมเดลรับได้                                                     |
| `reasoning`     | `boolean`                                                      | โมเดลนี้เปิดเผยพฤติกรรมการ reasoning หรือไม่                                  |
| `contextWindow` | `number`                                                       | native provider context window                                                |
| `contextTokens` | `number`                                                       | effective runtime context cap แบบไม่บังคับ เมื่อแตกต่างจาก `contextWindow`    |
| `maxTokens`     | `number`                                                       | จำนวน output tokens สูงสุดเมื่อทราบ                                            |
| `cost`          | `object`                                                       | ราคาต่อหนึ่งล้านโทเค็นแบบ USD ที่ไม่บังคับ รวมถึง `tieredPricing` แบบไม่บังคับ |
| `compat`        | `object`                                                       | flags ด้าน compatibility แบบไม่บังคับที่ตรงกับ OpenClaw model config compatibility |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะของรายการ suppress เฉพาะเมื่อแถวนั้นไม่ควรปรากฏเลยจริง ๆ                |
| `statusReason`  | `string`                                                       | เหตุผลแบบไม่บังคับที่แสดงพร้อมสถานะที่ไม่พร้อมใช้งาน                          |
| `replaces`      | `string[]`                                                     | provider-local model ids รุ่นเก่าที่โมเดลนี้มาแทน                             |
| `replacedBy`    | `string`                                                       | provider-local model id ที่มาแทนสำหรับ rows ที่ถูก deprecated                  |
| `tags`          | `string[]`                                                     | แท็กแบบคงที่ที่ใช้โดย pickers และ filters                                     |

อย่าใส่ข้อมูลที่ใช้เฉพาะ runtime ลงใน `modelCatalog` หาก provider ต้องใช้ account
state, API request หรือการค้นหา process ในเครื่องเพื่อให้รู้ชุดโมเดลที่สมบูรณ์
ให้ประกาศ provider นั้นเป็น `refreshable` หรือ `runtime` ใน `discovery`

### OpenClaw Provider Index

OpenClaw Provider Index คือ preview metadata ที่ OpenClaw เป็นเจ้าของ สำหรับ providers
ที่ plugins ของมันอาจยังไม่ได้ติดตั้ง มันไม่ใช่ส่วนหนึ่งของ plugin manifest
plugin manifests ยังคงเป็นแหล่งอำนาจของ installed-plugin ส่วน Provider Index คือ
สัญญา fallback ภายในที่พื้นผิว installable-provider และ pre-install
model picker ในอนาคตจะใช้ เมื่อ plugin ของ provider ยังไม่ได้ติดตั้ง

ลำดับความเป็นเจ้าของของ catalog:

1. User config
2. `modelCatalog` ใน manifest ของ installed plugin
3. model catalog cache จาก explicit refresh
4. preview rows จาก OpenClaw Provider Index

Provider Index ต้องไม่มี secrets, enabled state, runtime hooks หรือข้อมูลโมเดล
สดที่เฉพาะบัญชี preview catalogs ของมันใช้ provider row shape แบบ `modelCatalog`
เดียวกับ plugin manifests แต่ควรถูกจำกัดไว้ที่ stable display metadata เว้นแต่ฟิลด์ของ runtime adapter เช่น `api`, `baseUrl`, pricing หรือ compatibility flags จะถูกตั้งใจให้สอดคล้องกับ installed plugin manifest providers ที่มี live `/models` discovery ควรเขียน refreshed rows ผ่านพาธ explicit model catalog cache แทนการให้การทำรายการปกติหรือ onboarding ไปเรียก provider APIs

Provider Index entries อาจมีเมทาดาต้าของ installable-plugin สำหรับ providers ที่ plugin ของมันถูกย้ายออกจาก core หรือยังไม่ได้ติดตั้งด้วย เมทาดาต้านี้สะท้อนรูปแบบ channel catalog: ชื่อแพ็กเกจ, npm install spec,
expected integrity และ auth-choice labels แบบต้นทุนต่ำ ก็เพียงพอที่จะแสดงตัวเลือก setup ที่ติดตั้งได้ เมื่อ plugin ถูกติดตั้งแล้ว manifest ของมันจะมีความสำคัญสูงสุด และรายการใน Provider Index จะถูกละเว้นสำหรับ provider นั้น

คีย์ capability แบบเดิมที่ระดับบนสุดเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นความเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

ทั้งสองไฟล์มีหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, การตรวจสอบ config, auth-choice metadata และ UI hints ที่ต้องมีอยู่ก่อนโค้ด Plugin จะรัน                             |
| `package.json`         | npm metadata, การติดตั้ง dependencies และบล็อก `openclaw` ที่ใช้สำหรับ entrypoints, install gating, setup หรือ catalog metadata |

หากคุณไม่แน่ใจว่าเมทาดาต้าชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ข้อมูลนั้นก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเกี่ยวกับ packaging, entry files หรือพฤติกรรมการติดตั้งของ npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ใน package.json ที่มีผลต่อ discovery

เมทาดาต้าก่อน runtime ของ Plugin บางส่วนถูกเก็บไว้ใน `package.json` ภายใต้บล็อก
`openclaw` โดยตั้งใจ แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ประกาศ entrypoints ของ native plugin ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                                                      |
| `openclaw.runtimeExtensions`                                      | ประกาศ built JavaScript runtime entrypoints สำหรับแพ็กเกจที่ติดตั้งแล้ว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                  |
| `openclaw.setupEntry`                                             | lightweight setup-only entrypoint ที่ใช้ระหว่าง onboarding, deferred channel startup และการค้นหา channel status/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin |
| `openclaw.runtimeSetupEntry`                                      | ประกาศ built JavaScript setup entrypoint สำหรับแพ็กเกจที่ติดตั้งแล้ว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                       |
| `openclaw.channel`                                                | เมทาดาต้า channel catalog แบบต้นทุนต่ำ เช่น labels, docs paths, aliases และข้อความสำหรับ selection                                                                                 |
| `openclaw.channel.commands`                                       | เมทาดาต้า native command และ native skill auto-default แบบคงที่ ซึ่งใช้โดยพื้นผิว config, audit และ command-list ก่อน channel runtime โหลด                                         |
| `openclaw.channel.configuredState`                                | เมทาดาต้าของ configured-state checker แบบ lightweight ที่สามารถตอบว่า “มี setup แบบ env-only อยู่แล้วหรือไม่?” โดยไม่ต้องโหลด full channel runtime                                    |
| `openclaw.channel.persistedAuthState`                             | เมทาดาต้าของ persisted-auth checker แบบ lightweight ที่สามารถตอบว่า “มีการลงชื่อเข้าใช้อยู่แล้วหรือไม่?” โดยไม่ต้องโหลด full channel runtime                                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | hints สำหรับการติดตั้ง/อัปเดตของ bundled plugins และ plugins ที่เผยแพร่ภายนอก                                                                                                       |
| `openclaw.install.defaultChoice`                                  | เส้นทางการติดตั้งที่ต้องการ เมื่อมีแหล่งติดตั้งให้เลือกหลายแหล่ง                                                                                                                     |
| `openclaw.install.minHostVersion`                                 | เวอร์ชันขั้นต่ำของโฮสต์ OpenClaw ที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22`                                                                                                   |
| `openclaw.install.expectedIntegrity`                              | สตริง npm dist integrity ที่คาดหวัง เช่น `sha512-...`; โฟลว์การติดตั้งและอัปเดตจะตรวจสอบอาร์ติแฟกต์ที่ดึงมาว่าตรงกับค่านี้                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตเส้นทาง recovery แบบแคบสำหรับการติดตั้ง bundled-plugin ใหม่เมื่อ config ไม่ถูกต้อง                                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิว channel แบบ setup-only โหลดก่อน full channel plugin ระหว่าง startup                                                                                                 |

เมทาดาต้าใน manifest เป็นตัวกำหนดว่าตัวเลือก provider/channel/setup ใดจะปรากฏใน
onboarding ก่อน runtime โหลด ส่วน `package.json#openclaw.install` บอก
onboarding ว่าควรดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกตัวเลือกหนึ่งในนั้น
อย่าย้าย install hints ไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด manifest
registry ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ใหม่กว่าแต่ยังถูกต้องจะข้าม
Plugin บนโฮสต์ที่เก่ากว่า

การปักหมุดเวอร์ชัน npm แบบตรงตัวมีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการใน external catalog ทางการ
ควรจับคู่ exact specs กับ `expectedIntegrity` เพื่อให้โฟลว์อัปเดตล้มเหลวแบบ fail closed หาก npm artifact ที่ดึงมาไม่ตรงกับ release ที่ปักหมุดไว้อีกต่อไป
onboarding แบบโต้ตอบยังคงเสนอ trusted registry npm specs รวมถึง bare
package names และ dist-tags เพื่อความเข้ากันได้ catalog diagnostics สามารถ
แยกแยะระหว่าง exact, floating, integrity-pinned, missing-integrity, package-name
mismatch และ invalid default-choice sources ได้ และยังเตือนเมื่อ
มี `expectedIntegrity` อยู่แต่ไม่มี npm source ที่ถูกต้องให้ปักหมุดได้
เมื่อมี `expectedIntegrity`
โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้มัน; เมื่อไม่มี จะบันทึกการ resolve จาก registry
ไว้โดยไม่มี integrity pin

channel plugins ควรมี `openclaw.setupEntry` เมื่อ status, channel list
หรือ SecretRef scans ต้องระบุบัญชีที่กำหนดค่าไว้โดยไม่ต้องโหลด full
runtime setup entry ควรเปิดเผยเมทาดาต้าของช่อง พร้อม adapters สำหรับ config,
status และ secrets ที่ปลอดภัยสำหรับ setup; ให้เก็บ network clients, gateway listeners
และ transport runtimes ไว้ใน main extension entrypoint

ฟิลด์ runtime entrypoint ไม่ได้ override การตรวจสอบขอบเขตของแพ็กเกจสำหรับ source
entrypoint fields ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้พาธ
`openclaw.extensions` ที่หลุดออกนอกขอบเขตถูกโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกจำกัดให้แคบโดยตั้งใจ มันไม่ได้
ทำให้ configs ที่พังแบบใดก็ได้สามารถติดตั้งได้ ปัจจุบันมันอนุญาตเฉพาะให้โฟลว์ติดตั้ง
กู้คืนจากความล้มเหลวบางประเภทของการอัปเกรด bundled-plugin ที่ค้างอยู่ เช่น
bundled plugin path ที่หายไป หรือรายการ `channels.<id>` ที่ค้างอยู่ของ bundled plugin ตัวเดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้ง และส่ง operator ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ package metadata สำหรับ tiny checker
module:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

ใช้สิ่งนี้เมื่อโฟลว์ setup, doctor หรือ configured-state ต้องการ probe แบบ yes/no
ด้าน auth ที่ประหยัด ก่อน full channel plugin จะโหลด target export ควรเป็นฟังก์ชันเล็ก ๆ
ที่อ่านเฉพาะ persisted state เท่านั้น; อย่ากำหนดเส้นทางมันผ่าน full
channel runtime barrel

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับ cheap env-only
configured checks:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

ใช้สิ่งนี้เมื่อช่องสามารถตอบสถานะ configured-state จาก env หรืออินพุตขนาดเล็กอื่นที่ไม่ใช่
runtime ได้ หากการตรวจต้องใช้ full config resolution หรือ real
channel runtime ให้เก็บตรรกะนั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญของ discovery (plugin ids ซ้ำกัน)

OpenClaw ค้นหา plugins จากหลายราก (bundled, global install, workspace, explicit config-selected paths) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บไว้เพียง manifest ที่มี **ลำดับความสำคัญสูงสุด**; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดเคียงข้างกัน

ลำดับความสำคัญจากสูงไปต่ำ:

1. **Config-selected** — พาธที่ถูกปักหมุดไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — plugins ที่มาพร้อม OpenClaw
3. **Global install** — plugins ที่ติดตั้งไว้ใน global OpenClaw plugin root
4. **Workspace** — plugins ที่ถูกค้นพบโดยอิงจาก workspace ปัจจุบัน

ผลที่ตามมา:

- fork หรือสำเนาเก่าของ bundled plugin ที่อยู่ใน workspace จะไม่ shadow บิลด์แบบ bundled
- หากต้องการ override bundled plugin ด้วย local plugin จริง ๆ ให้ปักหมุดมันผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่ง workspace discovery
- การทิ้งรายการซ้ำจะถูกบันทึกในล็อก เพื่อให้ Doctor และ startup diagnostics ชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนดของ JSON Schema

- **ทุก Plugin ต้องมี JSON Schema** แม้ว่าจะไม่รับ config ใด ๆ ก็ตาม
- schema ว่างเปล่าก็ยอมรับได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schemas จะถูกตรวจสอบตอนอ่าน/เขียน config ไม่ใช่ตอน runtime

## พฤติกรรมการตรวจสอบ

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ channel id นั้นจะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง plugin ids ที่ **สามารถค้นพบได้** IDs ที่ไม่รู้จักเป็น **ข้อผิดพลาด**
- หากมีการติดตั้ง Plugin แต่ manifest หรือ schema ของมันเสียหรือหายไป
  การตรวจสอบจะล้มเหลว และ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin อยู่แต่ Plugin ถูก **ปิดใช้งาน**
  config จะยังคงถูกเก็บไว้ และจะมี **คำเตือน** ใน Doctor + logs

ดู [ข้อมูลอ้างอิง Configuration](/th/gateway/configuration) สำหรับ schema เต็มของ `plugins.*`

## หมายเหตุ

- manifest เป็น **สิ่งจำเป็นสำหรับ native OpenClaw plugins** รวมถึงการโหลดจาก local filesystem ด้วย runtime ยังคงโหลดโมดูลของ Plugin แยกต่างหาก; manifest มีไว้เฉพาะสำหรับ discovery + validation
- native manifests ถูก parse ด้วย JSON5 ดังนั้น comments, trailing commas และ unquoted keys จึงยอมรับได้ ตราบใดที่ค่าท้ายสุดยังคงเป็น object
- ตัวโหลด manifest จะอ่านเฉพาะฟิลด์ของ manifest ที่มีเอกสารกำกับเท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ได้ทั้งหมด เมื่อ Plugin ไม่ต้องการสิ่งเหล่านี้
- `providerDiscoveryEntry` ต้องคงความ lightweight และไม่ควร import runtime code แบบกว้าง; ใช้มันสำหรับเมทาดาต้า provider catalog แบบคงที่ หรือ narrow discovery descriptors ไม่ใช่การทำงานในเวลาที่มีคำขอ
- exclusive plugin kinds จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- เมทาดาต้า env-var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว และ `channelEnvVars`) เป็นแบบประกาศเท่านั้น พื้นผิวแบบอ่านอย่างเดียว เช่น status, audit, การตรวจสอบ cron delivery และอื่น ๆ ยังคงใช้นโยบายความเชื่อถือของ Plugin และ effective activation ก่อนจะถือว่า env var ถูกกำหนดค่าแล้ว
- สำหรับเมทาดาต้า wizard ระหว่าง runtime ที่ต้องใช้ provider code ดู [Provider runtime hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณขึ้นกับ native modules ให้จัดทำเอกสารขั้นตอน build และข้อกำหนด allowlist ของ package-manager ที่เกี่ยวข้อง (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugins" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugins
  </Card>
  <Card title="สถาปัตยกรรมของ Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและ capability model
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    ข้อมูลอ้างอิง Plugin SDK และ subpath imports
  </Card>
</CardGroup>
