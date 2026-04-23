---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องส่งมอบ schema ของ config สำหรับ plugin หรือดีบักข้อผิดพลาดการตรวจสอบ plugin
summary: ข้อกำหนดของ Plugin manifest + JSON schema (การตรวจสอบ config แบบเข้มงวด)
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-23T10:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest (`openclaw.plugin.json`)

หน้านี้สำหรับ **native OpenClaw plugin manifest** เท่านั้น

สำหรับรูปแบบ bundle ที่เข้ากันได้ ดู [Plugin bundles](/th/plugins/bundles)

รูปแบบ bundle ที่เข้ากันได้จะใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือเลย์เอาต์ component
  ค่าเริ่มต้นของ Claude ที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw จะตรวจจับเลย์เอาต์ bundle เหล่านั้นโดยอัตโนมัติเช่นกัน แต่จะไม่ตรวจสอบ
เทียบกับ schema ของ `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ bundles ที่เข้ากันได้ ปัจจุบัน OpenClaw จะอ่าน metadata ของ bundle พร้อมกับ
skill roots ที่ประกาศไว้, Claude command roots, ค่าเริ่มต้น `settings.json` ของ Claude bundle,
ค่าเริ่มต้น LSP ของ Claude bundle และ hook packs ที่รองรับ เมื่อเลย์เอาต์ตรงกับสิ่งที่ OpenClaw runtime คาดไว้

native OpenClaw plugin ทุกตัว **ต้อง**มีไฟล์ `openclaw.plugin.json` อยู่ใน
**plugin root** OpenClaw ใช้ manifest นี้ในการตรวจสอบ configuration
**โดยไม่ต้องรันโค้ดของ plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถือเป็น
ข้อผิดพลาดของ plugin และจะบล็อกการตรวจสอบ config

ดูคู่มือระบบ plugin ฉบับเต็มได้ที่: [Plugins](/th/tools/plugin)
สำหรับ capability model แบบ native และแนวทางความเข้ากันได้ภายนอกในปัจจุบัน:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่านก่อนโหลด
โค้ด plugin ของคุณ

ใช้สำหรับ:

- ตัวตนของ plugin
- การตรวจสอบ config
- metadata ของ auth และ onboarding ที่ควรเข้าถึงได้โดยไม่ต้องบูต plugin
  runtime
- คำใบ้การเปิดใช้งานแบบต้นทุนต่ำที่พื้นผิว control-plane สามารถตรวจสอบได้ก่อนที่ runtime
  จะถูกโหลด
- ตัวบรรยายการตั้งค่าแบบต้นทุนต่ำที่พื้นผิว setup/onboarding สามารถตรวจสอบได้ก่อนที่
  runtime จะถูกโหลด
- metadata ของ alias และ auto-enable ที่ควรถูก resolve ก่อนที่ plugin runtime จะถูกโหลด
- metadata แบบ shorthand สำหรับความเป็นเจ้าของ model-family ที่ควรเปิดใช้งาน
  plugin โดยอัตโนมัติก่อนที่ runtime จะถูกโหลด
- snapshot ของความเป็นเจ้าของ capability แบบ static ที่ใช้สำหรับการต่อสาย compat ของ bundled plugin และ
  การครอบคลุม contract
- metadata ของ QA runner แบบต้นทุนต่ำที่โฮสต์ `openclaw qa` ส่วนกลางสามารถตรวจสอบได้
  ก่อนที่ plugin runtime จะถูกโหลด
- metadata ของ config เฉพาะ channel ที่ควรรวมเข้ากับพื้นผิว catalog และการตรวจสอบ
  โดยไม่ต้องโหลด runtime
- คำใบ้สำหรับ UI ของ config

ห้ามใช้สำหรับ:

- การลงทะเบียนพฤติกรรม runtime
- การประกาศ code entrypoints
- metadata สำหรับการติดตั้ง npm

สิ่งเหล่านั้นควรอยู่ในโค้ด plugin และ `package.json`

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

## ตัวอย่างแบบสมบูรณ์

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "plugin ผู้ให้บริการ OpenRouter",
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

## เอกสารอ้างอิงฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น | ชนิด                            | ความหมาย                                                                                                                                                                                                                     |
| ------------------------------------ | ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่    | `string`                        | plugin id แบบ canonical นี่คือ id ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                          |
| `configSchema`                       | ใช่    | `object`                        | JSON Schema แบบ inline สำหรับ config ของ plugin นี้                                                                                                                                                                         |
| `enabledByDefault`                   | ไม่    | `true`                          | ระบุว่า bundled plugin นี้เปิดใช้งานโดยค่าเริ่มต้น หากละไว้ หรือกำหนดค่าอื่นที่ไม่ใช่ `true` plugin จะยังคงปิดใช้งานโดยค่าเริ่มต้น                                                                                     |
| `legacyPluginIds`                    | ไม่    | `string[]`                      | ids แบบเดิมที่จะถูก normalize ให้เป็น canonical plugin id นี้                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | ไม่    | `string[]`                      | provider ids ที่ควรเปิดใช้งาน plugin นี้โดยอัตโนมัติเมื่อ auth, config หรือ model refs กล่าวถึง provider เหล่านั้น                                                                                                       |
| `kind`                               | ไม่    | `"memory"` \| `"context-engine"` | ประกาศชนิด plugin แบบเอกสิทธิ์ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                  |
| `channels`                           | ไม่    | `string[]`                      | channel ids ที่ plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นหาและการตรวจสอบ config                                                                                                                                                 |
| `providers`                          | ไม่    | `string[]`                      | provider ids ที่ plugin นี้เป็นเจ้าของ                                                                                                                                                                                       |
| `modelSupport`                       | ไม่    | `object`                        | metadata แบบ shorthand ของ model-family ที่ manifest เป็นเจ้าของ ใช้สำหรับโหลด plugin อัตโนมัติก่อน runtime                                                                                                                |
| `providerEndpoints`                  | ไม่    | `object[]`                      | metadata ของ host/baseUrl ของ endpoint ที่ manifest เป็นเจ้าของ สำหรับ provider routes ที่ core ต้องจัดประเภทก่อนที่ provider runtime จะถูกโหลด                                                                             |
| `cliBackends`                        | ไม่    | `string[]`                      | CLI inference backend ids ที่ plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติระหว่างเริ่มต้นจาก config refs ที่ระบุชัดเจน                                                                                           |
| `syntheticAuthRefs`                  | ไม่    | `string[]`                      | refs ของ provider หรือ CLI backend ที่ synthetic auth hook ซึ่ง plugin เป็นเจ้าของควรถูก probe ระหว่างการค้นหา model แบบ cold ก่อนที่ runtime จะถูกโหลด                                                                    |
| `nonSecretAuthMarkers`               | ไม่    | `string[]`                      | ค่า API key ตัวแทนที่ bundled plugin เป็นเจ้าของ ซึ่งแทนสถานะข้อมูลรับรองแบบไม่เป็นความลับในเครื่อง, OAuth หรือแบบ ambient                                                                                               |
| `commandAliases`                     | ไม่    | `object[]`                      | ชื่อคำสั่งที่ plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการวินิจฉัย config และ CLI ที่รับรู้ plugin ก่อนที่ runtime จะถูกโหลด                                                                                                      |
| `providerAuthEnvVars`                | ไม่    | `Record<string, string[]>`      | metadata ของ env สำหรับ provider-auth แบบต้นทุนต่ำที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด plugin                                                                                                                  |
| `providerAuthAliases`                | ไม่    | `Record<string, string>`        | provider ids ที่ควรใช้ provider id อื่นซ้ำสำหรับการค้นหา auth เช่น coding provider ที่ใช้ API key และ auth profiles ร่วมกับ base provider                                                                                 |
| `channelEnvVars`                     | ไม่    | `Record<string, string[]>`      | metadata ของ env สำหรับ channel แบบต้นทุนต่ำที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด plugin ใช้สิ่งนี้สำหรับการตั้งค่า channel หรือพื้นผิว auth ที่ขับเคลื่อนด้วย env ซึ่งตัวช่วยเริ่มต้น/config แบบทั่วไปควรมองเห็น |
| `providerAuthChoices`                | ไม่    | `object[]`                      | metadata ของตัวเลือก auth แบบต้นทุนต่ำสำหรับ onboarding pickers, การ resolve preferred-provider และการผูก CLI flag แบบง่าย                                                                                                 |
| `activation`                         | ไม่    | `object`                        | คำใบ้การเปิดใช้งานแบบต้นทุนต่ำสำหรับการโหลดที่ถูกทริกเกอร์โดย provider, command, channel, route และ capability เป็น metadata เท่านั้น; พฤติกรรมจริงยังคงเป็นของ plugin runtime                                            |
| `setup`                              | ไม่    | `object`                        | ตัวบรรยาย setup/onboarding แบบต้นทุนต่ำที่พื้นผิว discovery และ setup สามารถตรวจสอบได้โดยไม่ต้องโหลด plugin runtime                                                                                                       |
| `qaRunners`                          | ไม่    | `object[]`                      | ตัวบรรยาย QA runner แบบต้นทุนต่ำที่ใช้โดยโฮสต์ `openclaw qa` ส่วนกลางก่อนที่ plugin runtime จะถูกโหลด                                                                                                                       |
| `contracts`                          | ไม่    | `object`                        | snapshot ของ capability แบบ static สำหรับ bundled plugin สำหรับ external auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของ tool |
| `mediaUnderstandingProviderMetadata` | ไม่    | `Record<string, object>`        | ค่าเริ่มต้นของ media-understanding แบบต้นทุนต่ำสำหรับ provider ids ที่ประกาศไว้ใน `contracts.mediaUnderstandingProviders`                                                                                                     |
| `channelConfigs`                     | ไม่    | `Record<string, object>`        | metadata ของ config เฉพาะ channel ที่ manifest เป็นเจ้าของ ซึ่งจะถูกรวมเข้ากับพื้นผิว discovery และการตรวจสอบก่อนที่ runtime จะถูกโหลด                                                                                     |
| `skills`                             | ไม่    | `string[]`                      | ไดเรกทอรี Skills ที่จะโหลด โดยอ้างอิงสัมพันธ์กับ plugin root                                                                                                                                                               |
| `name`                               | ไม่    | `string`                        | ชื่อ plugin ที่มนุษย์อ่านเข้าใจได้                                                                                                                                                                                           |
| `description`                        | ไม่    | `string`                        | สรุปสั้น ๆ ที่แสดงในพื้นผิวของ plugin                                                                                                                                                                                        |
| `version`                            | ไม่    | `string`                        | เวอร์ชันของ plugin เพื่อใช้เป็นข้อมูลประกอบ                                                                                                                                                                                  |
| `uiHints`                            | ไม่    | `Record<string, object>`        | ป้ายข้อความของ UI, placeholder และคำใบ้ด้านความอ่อนไหวสำหรับฟิลด์ config                                                                                                                                                   |

## เอกสารอ้างอิง `providerAuthChoices`

แต่ละรายการใน `providerAuthChoices` อธิบายตัวเลือก onboarding หรือ auth หนึ่งรายการ
OpenClaw จะอ่านสิ่งนี้ก่อนที่ provider runtime จะถูกโหลด

| ฟิลด์                 | จำเป็น | ชนิด                                           | ความหมาย                                                                                             |
| --------------------- | ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่    | `string`                                       | provider id ที่ตัวเลือกนี้สังกัด                                                                     |
| `method`              | ใช่    | `string`                                       | auth method id ที่จะใช้สำหรับ dispatch                                                               |
| `choiceId`            | ใช่    | `string`                                       | auth-choice id ที่คงที่ ใช้โดย onboarding และ flow ของ CLI                                           |
| `choiceLabel`         | ไม่    | `string`                                       | ป้ายข้อความสำหรับผู้ใช้ หากละไว้ OpenClaw จะ fallback ไปใช้ `choiceId`                               |
| `choiceHint`          | ไม่    | `string`                                       | ข้อความช่วยสั้น ๆ สำหรับตัวเลือก                                                                     |
| `assistantPriority`   | ไม่    | `number`                                       | ค่าที่น้อยกว่าจะถูกเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดย assistant                           |
| `assistantVisibility` | ไม่    | `"visible"` \| `"manual-only"`                 | ซ่อนตัวเลือกนี้จากตัวเลือกของ assistant แต่ยังอนุญาตให้เลือกเองผ่าน CLI ได้                          |
| `deprecatedChoiceIds` | ไม่    | `string[]`                                     | choice ids แบบเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้มายังตัวเลือกทดแทนนี้                                   |
| `groupId`             | ไม่    | `string`                                       | group id แบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                           |
| `groupLabel`          | ไม่    | `string`                                       | ป้ายข้อความสำหรับผู้ใช้ของกลุ่มนั้น                                                                   |
| `groupHint`           | ไม่    | `string`                                       | ข้อความช่วยสั้น ๆ สำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่    | `string`                                       | option key ภายในสำหรับ flow auth แบบใช้แฟล็กเดียวอย่างง่าย                                          |
| `cliFlag`             | ไม่    | `string`                                       | ชื่อ CLI flag เช่น `--openrouter-api-key`                                                            |
| `cliOption`           | ไม่    | `string`                                       | รูปแบบเต็มของ CLI option เช่น `--openrouter-api-key <key>`                                           |
| `cliDescription`      | ไม่    | `string`                                       | คำอธิบายที่ใช้ใน help ของ CLI                                                                        |
| `onboardingScopes`    | ไม่    | `Array<"text-inference" \| "image-generation">` | พื้นผิว onboarding ที่ตัวเลือกนี้ควรปรากฏ หากละไว้ จะใช้ค่าเริ่มต้นเป็น `["text-inference"]`        |

## เอกสารอ้างอิง `commandAliases`

ใช้ `commandAliases` เมื่อ plugin เป็นเจ้าของชื่อคำสั่ง runtime ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามรันเป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ต้องนำเข้าโค้ด runtime ของ plugin

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

| ฟิลด์       | จำเป็น | ชนิด             | ความหมาย                                                               |
| ----------- | ------ | ---------------- | ---------------------------------------------------------------------- |
| `name`      | ใช่    | `string`         | ชื่อคำสั่งที่เป็นของ plugin นี้                                        |
| `kind`      | ไม่    | `"runtime-slash"` | ระบุว่า alias นี้เป็นคำสั่ง slash ในแชต ไม่ใช่คำสั่ง CLI ระดับราก     |
| `cliCommand` | ไม่   | `string`         | คำสั่ง CLI ระดับรากที่เกี่ยวข้องเพื่อแนะนำสำหรับการทำงานผ่าน CLI หากมี |

## เอกสารอ้างอิง `activation`

ใช้ `activation` เมื่อ plugin สามารถประกาศได้อย่างประหยัดว่ามีเหตุการณ์ control-plane ใดบ้าง
ที่ควรทำให้มันถูกเปิดใช้งานในภายหลัง

## เอกสารอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ plugin เพิ่ม transport runners หนึ่งตัวหรือมากกว่านั้นไว้ใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน ให้คง metadata นี้ให้เบาและคงที่; plugin
runtime ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
แบบ lightweight ที่ export `qaRunnerCliRegistrations`

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| ฟิลด์         | จำเป็น | ชนิด    | ความหมาย                                                        |
| ------------- | ------ | ------- | ---------------------------------------------------------------- |
| `commandName` | ใช่    | `string` | subcommand ที่ถูก mount ใต้ `openclaw qa` เช่น `matrix`         |
| `description` | ไม่    | `string` | ข้อความ help แบบ fallback ที่ใช้เมื่อโฮสต์ส่วนกลางต้องมี stub command |

บล็อกนี้เป็น metadata เท่านั้น ไม่ได้ลงทะเบียนพฤติกรรม runtime และ
ไม่ได้แทนที่ `register(...)`, `setupEntry` หรือ entrypoints อื่นของ runtime/plugin
ผู้ใช้ปัจจุบันใช้มันเป็นคำใบ้เพื่อจำกัดขอบเขตก่อนการโหลด plugin ในวงกว้างขึ้น ดังนั้น
การขาด metadata ของ activation โดยทั่วไปจะมีผลเพียงด้านประสิทธิภาพ; ไม่ควร
เปลี่ยนความถูกต้องตราบใดที่ยังมี fallback เดิมจากความเป็นเจ้าของใน manifest

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

| ฟิลด์            | จำเป็น | ชนิด                                                | ความหมาย                                                       |
| ---------------- | ------ | --------------------------------------------------- | -------------------------------------------------------------- |
| `onProviders`    | ไม่    | `string[]`                                          | provider ids ที่ควรเปิดใช้งาน plugin นี้เมื่อมีการร้องขอ       |
| `onCommands`     | ไม่    | `string[]`                                          | command ids ที่ควรเปิดใช้งาน plugin นี้                        |
| `onChannels`     | ไม่    | `string[]`                                          | channel ids ที่ควรเปิดใช้งาน plugin นี้                        |
| `onRoutes`       | ไม่    | `string[]`                                          | route kinds ที่ควรเปิดใช้งาน plugin นี้                        |
| `onCapabilities` | ไม่    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้ในการวางแผน activation ของ control-plane |

ผู้ใช้จริงในปัจจุบัน:

- การวางแผน CLI ที่ถูกทริกเกอร์ด้วย command จะ fallback ไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- การวางแผน setup/channel ที่ถูกทริกเกอร์ด้วย channel จะ fallback ไปใช้ความเป็นเจ้าของ
  `channels[]` แบบเดิม เมื่อไม่มี metadata ของ activation สำหรับ channel อย่างชัดเจน
- การวางแผน setup/runtime ที่ถูกทริกเกอร์ด้วย provider จะ fallback ไปใช้ความเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบเดิม เมื่อไม่มี metadata ของ activation
  สำหรับ provider อย่างชัดเจน

## เอกสารอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการ metadata ที่ plugin เป็นเจ้าของแบบเบา
ก่อนที่ runtime จะถูกโหลด

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

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังคงใช้อธิบาย CLI inference
backends ส่วน `setup.cliBackends` เป็นพื้นผิวตัวบรรยายเฉพาะ setup สำหรับ
flows ของ control-plane/setup ที่ควรคงเป็น metadata เท่านั้น

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็นพื้นผิวค้นหาแบบ descriptor-first
ที่ควรใช้เป็นหลักสำหรับการค้นหา setup หาก descriptor เพียงแค่จำกัดขอบเขต
plugin ผู้สมัคร และ setup ยังต้องการ hooks ของ runtime ในช่วง setup ที่สมบูรณ์กว่า
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็นเส้นทาง fallback
สำหรับการทำงานจริง

เนื่องจากการค้นหา setup สามารถรันโค้ด `setup-api` ที่ plugin เป็นเจ้าของได้
ค่าที่ normalize แล้วของ `setup.providers[].id` และ `setup.cliBackends[]` ต้องคงความไม่ซ้ำกัน
ระหว่าง plugins ที่ค้นพบ ความเป็นเจ้าของที่กำกวมจะล้มเหลวแบบปิดปลอดภัย แทนที่จะเลือก
ผู้ชนะตามลำดับการค้นพบ

### เอกสารอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น | ชนิด      | ความหมาย                                                                              |
| ------------- | ------ | --------- | -------------------------------------------------------------------------------------- |
| `id`          | ใช่    | `string`  | provider id ที่เปิดเผยระหว่าง setup หรือ onboarding ให้คง ids ที่ normalize แล้วไม่ซ้ำกันทั่วระบบ |
| `authMethods` | ไม่    | `string[]` | setup/auth method ids ที่ provider นี้รองรับได้โดยไม่ต้องโหลด runtime เต็มรูปแบบ      |
| `envVars`     | ไม่    | `string[]` | env vars ที่พื้นผิว setup/status แบบทั่วไปสามารถตรวจสอบได้ก่อนที่ plugin runtime จะถูกโหลด |

### ฟิลด์ของ `setup`

| ฟิลด์              | จำเป็น | ชนิด      | ความหมาย                                                                                         |
| ------------------ | ------ | --------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | ไม่    | `object[]` | ตัวบรรยาย setup ของ provider ที่เปิดเผยระหว่าง setup และ onboarding                              |
| `cliBackends`      | ไม่    | `string[]` | backend ids ช่วง setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first ให้คง ids ที่ normalize แล้วไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่    | `string[]` | config migration ids ที่พื้นผิว setup ของ plugin นี้เป็นเจ้าของ                                  |
| `requiresRuntime`  | ไม่    | `boolean` | ระบุว่า setup ยังต้องรัน `setup-api` ต่อหลังจากค้นหาด้วย descriptor หรือไม่                    |

## เอกสารอ้างอิง `uiHints`

`uiHints` คือแมปจากชื่อฟิลด์ config ไปยังคำใบ้เล็ก ๆ สำหรับการเรนเดอร์

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

คำใบ้ของแต่ละฟิลด์สามารถมีได้:

| ฟิลด์         | ชนิด      | ความหมาย                               |
| ------------- | --------- | -------------------------------------- |
| `label`       | `string`  | ป้ายชื่อฟิลด์สำหรับผู้ใช้              |
| `help`        | `string`  | ข้อความช่วยสั้น ๆ                      |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                  |
| `advanced`    | `boolean` | ระบุว่าฟิลด์นี้เป็นขั้นสูง             |
| `sensitive`   | `boolean` | ระบุว่าฟิลด์นี้เป็นความลับหรืออ่อนไหว |
| `placeholder` | `string`  | ข้อความ placeholder สำหรับอินพุตแบบฟอร์ม |

## เอกสารอ้างอิง `contracts`

ใช้ `contracts` เฉพาะกับ metadata ความเป็นเจ้าของ capability แบบ static ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้องนำเข้า plugin runtime

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| ฟิลด์                            | ชนิด      | ความหมาย                                                           |
| -------------------------------- | --------- | ------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | embedded runtime ids ที่ bundled plugin อาจลงทะเบียน factories ให้ |
| `externalAuthProviders`          | `string[]` | provider ids ที่ plugin นี้เป็นเจ้าของ external auth profile hook  |
| `speechProviders`                | `string[]` | speech provider ids ที่ plugin นี้เป็นเจ้าของ                      |
| `realtimeTranscriptionProviders` | `string[]` | realtime-transcription provider ids ที่ plugin นี้เป็นเจ้าของ      |
| `realtimeVoiceProviders`         | `string[]` | realtime-voice provider ids ที่ plugin นี้เป็นเจ้าของ              |
| `mediaUnderstandingProviders`    | `string[]` | media-understanding provider ids ที่ plugin นี้เป็นเจ้าของ         |
| `imageGenerationProviders`       | `string[]` | image-generation provider ids ที่ plugin นี้เป็นเจ้าของ            |
| `videoGenerationProviders`       | `string[]` | video-generation provider ids ที่ plugin นี้เป็นเจ้าของ            |
| `webFetchProviders`              | `string[]` | web-fetch provider ids ที่ plugin นี้เป็นเจ้าของ                   |
| `webSearchProviders`             | `string[]` | web-search provider ids ที่ plugin นี้เป็นเจ้าของ                  |
| `tools`                          | `string[]` | ชื่อเครื่องมือของ agent ที่ plugin นี้เป็นเจ้าของ สำหรับ bundled contract checks |

provider plugins ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugins ที่ไม่มีการประกาศนี้ยังคงทำงานได้
ผ่าน compatibility fallback แบบ deprecated แต่ fallback นั้นช้ากว่าและ
จะถูกลบหลังหมดช่วง migration

## เอกสารอ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
default models, ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสารแบบ native
ที่ตัวช่วย core แบบทั่วไปต้องใช้ก่อนที่ runtime จะถูกโหลด โดยคีย์ต้องถูกประกาศไว้ด้วยใน
`contracts.mediaUnderstandingProviders`

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

แต่ละรายการของ provider สามารถมีได้:

| ฟิลด์                  | ชนิด                               | ความหมาย                                                                  |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | media capabilities ที่ provider นี้เปิดเผย                                |
| `defaultModels`        | `Record<string, string>`           | ค่าเริ่มต้น capability-to-model ที่ใช้เมื่อ config ไม่ได้ระบุ model      |
| `autoPriority`         | `Record<string, number>`           | ตัวเลขที่น้อยกว่าจะถูกเรียงก่อนสำหรับ fallback ของ provider อัตโนมัติตาม credentials |
| `nativeDocumentInputs` | `"pdf"[]`                          | อินพุตเอกสารแบบ native ที่ provider รองรับ                               |

## เอกสารอ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ channel plugin ต้องการ metadata ของ config แบบเบา
ก่อนที่ runtime จะถูกโหลด

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

แต่ละรายการของ channel สามารถมีได้:

| ฟิลด์         | ชนิด                    | ความหมาย                                                                                   |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการ config ของ channel ที่ประกาศไว้ |
| `uiHints`     | `Record<string, object>` | ป้ายข้อความ UI/placeholder/คำใบ้ด้านความอ่อนไหวแบบไม่บังคับสำหรับส่วน config ของ channel นั้น |
| `label`       | `string`                | ป้ายชื่อของ channel ที่รวมเข้ากับพื้นผิว picker และ inspect เมื่อ metadata ของ runtime ยังไม่พร้อม |
| `description` | `string`                | คำอธิบายสั้น ๆ ของ channel สำหรับพื้นผิว inspect และ catalog                              |
| `preferOver`  | `string[]`              | plugin ids แบบเดิมหรือมีลำดับความสำคัญต่ำกว่าที่ channel นี้ควรอยู่เหนือกว่าในพื้นผิวการเลือก |

## เอกสารอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน provider plugin ของคุณจาก
shorthand model ids เช่น `gpt-5.4` หรือ `claude-sonnet-4.6` ก่อนที่ plugin runtime
จะถูกโหลด

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญดังนี้:

- `provider/model` refs แบบชัดเจนจะใช้ metadata `providers` ของ manifest ที่เป็นเจ้าของ
- `modelPatterns` มีลำดับเหนือ `modelPrefixes`
- หากมีทั้ง plugin แบบ non-bundled และ bundled ที่ตรงกัน plugin แบบ non-bundled
  จะชนะ
- ความกำกวมที่เหลือจะถูกเพิกเฉยจนกว่าผู้ใช้หรือ config จะระบุ provider

ฟิลด์:

| ฟิลด์           | ชนิด      | ความหมาย                                                                        |
| --------------- | --------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | prefix ที่จับคู่ด้วย `startsWith` กับ shorthand model ids                       |
| `modelPatterns` | `string[]` | แหล่ง regex ที่จับคู่กับ shorthand model ids หลังตัด profile suffix ออกแล้ว   |

คีย์ capability ระดับบนสุดแบบเดิมเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด
manifest ปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นความเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

สองไฟล์นี้มีหน้าที่ต่างกัน:

| ไฟล์                  | ใช้สำหรับ                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, การตรวจสอบ config, metadata ของ auth-choice และคำใบ้ UI ที่ต้องมีอยู่ก่อนที่โค้ด plugin จะรัน                 |
| `package.json`         | metadata ของ npm, การติดตั้ง dependencies และบล็อก `openclaw` ที่ใช้สำหรับ entrypoints, install gating, setup หรือ catalog metadata |

หากคุณไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ไหน ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ข้อมูลนั้นก่อนโหลดโค้ด plugin ให้วางไว้ใน `openclaw.plugin.json`
- หากเกี่ยวกับ packaging, entry files หรือพฤติกรรมการติดตั้ง npm ให้วางไว้ใน `package.json`

### ฟิลด์ใน package.json ที่มีผลต่อ discovery

metadata ของ plugin บางส่วนก่อน runtime ตั้งใจให้อยู่ใน `package.json` ภายใต้
บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                            | ความหมาย                                                                                                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                            | ประกาศ entrypoints ของ native plugin ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                                                                       |
| `openclaw.runtimeExtensions`                                     | ประกาศ entrypoints ของ JavaScript runtime ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้งไว้ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                          |
| `openclaw.setupEntry`                                            | entrypoint แบบ lightweight สำหรับ setup เท่านั้น ใช้ระหว่าง onboarding, การเริ่มต้น channel แบบ deferred และการค้นหา status/SecretRef ของ channel แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin |
| `openclaw.runtimeSetupEntry`                                     | ประกาศ setup entrypoint ของ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้งไว้ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                             |
| `openclaw.channel`                                               | metadata ของแค็ตตาล็อก channel แบบเบา เช่น labels, docs paths, aliases และข้อความสำหรับการเลือก                                                                                     |
| `openclaw.channel.configuredState`                               | metadata ของตัวตรวจสอบ configured-state แบบ lightweight ที่ตอบได้ว่า “มีการตั้งค่าแบบ env-only อยู่แล้วหรือไม่” โดยไม่ต้องโหลด channel runtime เต็มรูปแบบ                             |
| `openclaw.channel.persistedAuthState`                            | metadata ของตัวตรวจสอบ persisted-auth แบบ lightweight ที่ตอบได้ว่า “มีอะไรที่ลงชื่อเข้าใช้ไว้แล้วหรือไม่” โดยไม่ต้องโหลด channel runtime เต็มรูปแบบ                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`        | คำใบ้สำหรับการติดตั้ง/อัปเดต bundled plugins และ plugins ที่เผยแพร่ภายนอก                                                                                                           |
| `openclaw.install.defaultChoice`                                 | เส้นทางการติดตั้งที่ต้องการเมื่อมีหลายแหล่งติดตั้งให้เลือก                                                                                                                            |
| `openclaw.install.minHostVersion`                                | เวอร์ชันขั้นต่ำของ OpenClaw host ที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22`                                                                                                      |
| `openclaw.install.expectedIntegrity`                             | สตริง integrity ของ npm dist ที่คาดหวัง เช่น `sha512-...`; flows ของการติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมาว่าตรงกับค่านี้                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                    | อนุญาตเส้นทางการกู้คืนแบบจำกัดสำหรับการติดตั้ง bundled plugin ใหม่เมื่อ config ไม่ถูกต้อง                                                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิว channel แบบ setup-only โหลดก่อน full channel plugin ระหว่างเริ่มต้น                                                                                                 |

metadata ของ manifest เป็นตัวตัดสินว่าตัวเลือก provider/channel/setup ใดบ้างจะปรากฏใน
onboarding ก่อนที่ runtime จะถูกโหลด ส่วน `package.json#openclaw.install` บอก
onboarding ว่าจะดึงหรือเปิดใช้ plugin นั้นอย่างไรเมื่อผู้ใช้เลือกตัวเลือกเหล่านั้น
ห้ามย้าย install hints ไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและระหว่างการโหลด
manifest registry ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ถูกต้องแต่ใหม่กว่าจะข้าม
plugin นั้นบน hosts ที่เก่ากว่า

การตรึงเวอร์ชัน npm แบบตายตัวมีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` และควรจับคู่กับ
`expectedIntegrity` เมื่อต้องการให้ flows ของการอัปเดตล้มเหลวแบบปิดปลอดภัย หาก artifact npm
ที่ดึงมาไม่ตรงกับ release ที่ตรึงไว้แล้ว onboarding แบบโต้ตอบ
จะเสนอสเปก npm จาก registry ที่เชื่อถือได้ รวมทั้งชื่อแพ็กเกจเปล่าและ dist-tags
เมื่อมี `expectedIntegrity` flows ของการติดตั้ง/อัปเดตจะบังคับใช้ค่านี้; เมื่อไม่มี
ระบบจะบันทึกการ resolve จาก registry โดยไม่มี integrity pin

channel plugins ควรมี `openclaw.setupEntry` เมื่อ status, รายการ channel
หรือการสแกน SecretRef ต้องการระบุบัญชีที่ตั้งค่าไว้โดยไม่ต้องโหลด
runtime เต็มรูปแบบ setup entry ควรเปิดเผย metadata ของ channel พร้อม config
status และ adapters ของ secrets ที่ปลอดภัยสำหรับ setup; ให้คง network clients, gateway listeners
และ transport runtimes ไว้ใน extension entrypoint หลัก

ฟิลด์ runtime entrypoint จะไม่ override การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
source entrypoint ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตถูกโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกออกแบบให้แคบโดยเจตนา มัน
ไม่ได้ทำให้ configs ที่พังแบบทั่วไปสามารถติดตั้งได้ ปัจจุบันจะอนุญาตเฉพาะ
flows ของการติดตั้งเพื่อกู้คืนจากความล้มเหลวบางอย่างของการอัปเกรด bundled plugin แบบเก่า เช่น
พาธของ bundled plugin ที่หายไป หรือรายการ `channels.<id>` แบบเก่าของ bundled plugin
ตัวเดียวกันนั้น ข้อผิดพลาดของ config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ปฏิบัติงาน
ไปยัง `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` เป็น metadata ของแพ็กเกจสำหรับโมดูลตัวตรวจสอบขนาดเล็ก:

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

ใช้เมื่อ flows ของ setup, doctor หรือ configured-state ต้องการการ probe สถานะ auth
แบบ yes/no ที่เบาก่อนที่ full channel plugin จะถูกโหลด export เป้าหมายควรเป็นฟังก์ชัน
ขนาดเล็กที่อ่านเฉพาะ persisted state; อย่ากำหนดเส้นทางผ่าน barrel ของ full
channel runtime

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบ configured-state
แบบ env-only ที่เบา:

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

ใช้เมื่อ channel สามารถตอบ configured-state ได้จาก env หรืออินพุตเล็ก ๆ แบบ non-runtime
อื่น ๆ หากการตรวจสอบต้องใช้การ resolve config เต็มรูปแบบหรือ
channel runtime จริง ให้เก็บตรรกะนั้นไว้ใน hook `config.hasConfiguredState`
ของ plugin แทน

## ลำดับความสำคัญของการค้นหา (plugin ids ซ้ำกัน)

OpenClaw ค้นหา plugins จากหลายราก (bundled, global install, workspace, พาธที่เลือกอย่างชัดเจนจาก config) หากการค้นหาสองรายการมี `id` เดียวกัน จะเก็บไว้เฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด** เท่านั้น; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดควบคู่กัน

ลำดับความสำคัญ จากสูงไปต่ำ:

1. **Config-selected** — พาธที่ตรึงไว้ชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — plugins ที่มากับ OpenClaw
3. **Global install** — plugins ที่ติดตั้งไว้ใน global OpenClaw plugin root
4. **Workspace** — plugins ที่ค้นพบโดยอ้างอิงจาก workspace ปัจจุบัน

ผลกระทบ:

- สำเนาแบบ fork หรือเก่าของ bundled plugin ที่วางอยู่ใน workspace จะไม่ทับ bundled build
- หากต้องการ override bundled plugin ด้วย plugin ในเครื่องจริง ๆ ให้ตรึงผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่ง workspace discovery
- การทิ้งรายการซ้ำจะถูกบันทึกลง log เพื่อให้ Doctor และการวินิจฉัยตอนเริ่มต้นสามารถชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนดของ JSON Schema

- **ทุก plugin ต้องมี JSON Schema** แม้ว่าจะไม่รับ config ใด ๆ ก็ตาม
- ยอมรับ schema ว่างได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schemas จะถูกตรวจสอบในเวลาที่อ่าน/เขียน config ไม่ใช่ใน runtime

## พฤติกรรมการตรวจสอบ

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ channel id นั้นจะถูกประกาศโดย
  plugin manifest
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง plugin ids ที่ **สามารถค้นพบได้** ids ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด**
- หาก plugin ถูกติดตั้งไว้แต่มี manifest หรือ schema ที่เสียหายหรือหายไป
  การตรวจสอบจะล้มเหลว และ Doctor จะรายงานข้อผิดพลาดของ plugin
- หากมี config ของ plugin อยู่ แต่ plugin นั้น **ถูกปิดใช้งาน**
  config จะยังคงอยู่ และจะมี **คำเตือน** แสดงใน Doctor + logs

ดู [Configuration reference](/th/gateway/configuration) สำหรับ schema เต็มของ `plugins.*`

## หมายเหตุ

- manifest เป็น **สิ่งจำเป็นสำหรับ native OpenClaw plugins** รวมถึงการโหลดจาก filesystem ในเครื่อง
- runtime ยังคงโหลดโมดูล plugin แยกต่างหาก; manifest มีไว้สำหรับ
  discovery + validation เท่านั้น
- native manifests ถูก parse ด้วย JSON5 ดังนั้น comments, trailing commas และ
  unquoted keys จึงยอมรับได้ ตราบใดที่ค่าท้ายสุดยังคงเป็นออบเจ็กต์
- manifest loader จะอ่านเฉพาะฟิลด์ manifest ที่มีการบันทึกไว้เท่านั้น หลีกเลี่ยงการเพิ่ม
  custom top-level keys ที่นี่
- `providerAuthEnvVars` คือเส้นทาง metadata แบบเบาสำหรับ auth probes, การตรวจสอบ env-marker
  และพื้นผิว provider-auth ลักษณะคล้ายกันที่ไม่ควรบูต plugin
  runtime เพียงเพื่อจะตรวจสอบชื่อ env
- `providerAuthAliases` ช่วยให้ provider variants สามารถใช้ env vars ของ auth
  auth profiles, auth ที่อิง config และตัวเลือก onboarding แบบ API-key ของ provider อื่นซ้ำได้
  โดยไม่ต้อง hardcode ความสัมพันธ์นั้นไว้ใน core
- `providerEndpoints` ช่วยให้ provider plugins เป็นเจ้าของ metadata สำหรับการจับคู่
  host/baseUrl ของ endpoint แบบง่าย ใช้เฉพาะกับ endpoint classes ที่ core รองรับอยู่แล้ว;
  พฤติกรรม runtime ยังคงเป็นของ plugin
- `syntheticAuthRefs` คือเส้นทาง metadata แบบเบาสำหรับ synthetic
  auth hooks ที่ provider เป็นเจ้าของ ซึ่งต้องมองเห็นได้สำหรับการค้นหา model แบบ cold ก่อนที่ runtime
  registry จะมีอยู่ ให้ใส่เฉพาะ refs ที่ provider หรือ CLI backend ใน runtime
  implement `resolveSyntheticAuth` จริงเท่านั้น
- `nonSecretAuthMarkers` คือเส้นทาง metadata แบบเบาสำหรับ placeholder API keys
  ที่ bundled plugin เป็นเจ้าของ เช่น markers สำหรับข้อมูลรับรองในเครื่อง, OAuth หรือ ambient
  Core จะถือว่าสิ่งเหล่านี้ไม่ใช่ secrets สำหรับการแสดง auth และการตรวจสอบ secret
  โดยไม่ต้อง hardcode provider เจ้าของ
- `channelEnvVars` คือเส้นทาง metadata แบบเบาสำหรับ shell-env fallback, setup
  prompts และพื้นผิว channel ลักษณะคล้ายกันที่ไม่ควรบูต plugin runtime
  เพียงเพื่อจะตรวจสอบชื่อ env ชื่อ env เป็น metadata ไม่ใช่การ activation
  ด้วยตัวมันเอง: status, audit, การตรวจสอบความถูกต้องของการส่ง Cron และพื้นผิวแบบอ่านอย่างเดียวอื่น ๆ
  ยังคงใช้ trust และนโยบาย effective activation ของ plugin ก่อนที่มัน
  จะถือว่า env var เป็น channel ที่ตั้งค่าไว้
- `providerAuthChoices` คือเส้นทาง metadata แบบเบาสำหรับ auth-choice pickers,
  การ resolve `--auth-choice`, การแม็ป preferred-provider และการลงทะเบียน CLI flag
  อย่างง่ายใน onboarding ก่อนที่ provider runtime จะถูกโหลด สำหรับ metadata ของ runtime wizard
  ที่ต้องใช้โค้ด provider ดู
  [Provider runtime hooks](/th/plugins/architecture#provider-runtime-hooks)
- ชนิด plugin แบบเอกสิทธิ์ถูกเลือกผ่าน `plugins.slots.*`
  - `kind: "memory"` ถูกเลือกโดย `plugins.slots.memory`
  - `kind: "context-engine"` ถูกเลือกโดย `plugins.slots.contextEngine`
    (ค่าเริ่มต้น: `legacy` ในตัว)
- สามารถละ `channels`, `providers`, `cliBackends` และ `skills` ได้เมื่อ
  plugin ไม่ต้องการสิ่งเหล่านั้น
- หาก plugin ของคุณพึ่งพา native modules ให้บันทึกขั้นตอน build และ
  ข้อกำหนด allowlist ของ package-manager ที่เกี่ยวข้อง (เช่น pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — เริ่มต้นใช้งานกับ plugins
- [Plugin Architecture](/th/plugins/architecture) — สถาปัตยกรรมภายใน
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิง Plugin SDK
