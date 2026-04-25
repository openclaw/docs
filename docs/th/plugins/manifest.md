---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องส่งมอบสคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดการตรวจสอบความถูกต้องของ Plugin
summary: Manifest ของ Plugin + ข้อกำหนด JSON schema (การตรวจสอบ config แบบเข้มงวด)
title: Manifest ของ Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

หน้านี้มีไว้สำหรับ **manifest ของ Plugin OpenClaw แบบเนทีฟ** เท่านั้น

สำหรับเลย์เอาต์ bundle ที่เข้ากันได้ โปรดดู [Plugin bundles](/th/plugins/bundles)

รูปแบบ bundle ที่เข้ากันได้จะใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือเลย์เอาต์ component เริ่มต้นของ Claude
  ที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw ตรวจจับเลย์เอาต์ bundle เหล่านั้นโดยอัตโนมัติด้วยเช่นกัน แต่จะไม่ตรวจสอบความถูกต้อง
เทียบกับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ bundle ที่เข้ากันได้ ปัจจุบัน OpenClaw จะอ่าน metadata ของ bundle พร้อมกับ
รากของ skill ที่ประกาศไว้ รากของคำสั่ง Claude ค่าเริ่มต้น `settings.json` ของ Claude bundle
ค่าเริ่มต้น LSP ของ Claude bundle และแพ็ก hook ที่รองรับเมื่อเลย์เอาต์ตรงกับ
ข้อกำหนดของรันไทม์ OpenClaw

Plugin OpenClaw แบบเนทีฟทุกตัว **ต้อง** มีไฟล์ `openclaw.plugin.json` อยู่ใน
**รากของ plugin** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบความถูกต้องของการกำหนดค่า
**โดยไม่ต้องรันโค้ดของ plugin** manifest ที่ขาดหายไปหรือไม่ถูกต้องจะถูกมองว่าเป็น
ข้อผิดพลาดของ plugin และจะบล็อกการตรวจสอบความถูกต้องของการกำหนดค่า

ดูคู่มือระบบ Plugin ฉบับเต็มได้ที่: [Plugins](/th/tools/plugin)
สำหรับโมเดลความสามารถแบบเนทีฟและแนวทางปัจจุบันด้านความเข้ากันได้ภายนอก:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่าน **ก่อนที่จะโหลดโค้ด
plugin ของคุณ** ทุกอย่างด้านล่างนี้ต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูตรันไทม์
ของ plugin

**ใช้สำหรับ:**

- เอกลักษณ์ของ plugin การตรวจสอบความถูกต้องของการกำหนดค่า และคำใบ้สำหรับ UI การกำหนดค่า
- metadata สำหรับ auth การเริ่มต้นใช้งาน และการตั้งค่า (alias, การเปิดใช้งานอัตโนมัติ, env var ของ provider, ตัวเลือก auth)
- คำใบ้การเปิดใช้งานสำหรับพื้นผิว control-plane
- ความเป็นเจ้าของแบบย่อของตระกูลโมเดล
- snapshot แบบคงที่ของความเป็นเจ้าของ capability (`contracts`)
- metadata ของตัวรัน QA ที่โฮสต์ `openclaw qa` แบบใช้ร่วมกันสามารถตรวจสอบได้
- metadata การกำหนดค่าเฉพาะ channel ที่ถูกรวมเข้าไปใน catalog และพื้นผิวการตรวจสอบความถูกต้อง

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรมรันไทม์ การประกาศ entrypoint ของโค้ด
หรือ metadata การติดตั้ง npm สิ่งเหล่านั้นควรอยู่ในโค้ด plugin ของคุณและ `package.json`

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

## ตัวอย่างแบบครบถ้วน

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
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

| ฟิลด์                                | จำเป็น | ประเภท                            | ความหมาย                                                                                                                                                                                                                         |
| ------------------------------------ | ------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่     | `string`                          | id มาตรฐานของ plugin นี่คือ id ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                  |
| `configSchema`                       | ใช่     | `object`                          | JSON Schema แบบ inline สำหรับการกำหนดค่าของ plugin นี้                                                                                                                                                                           |
| `enabledByDefault`                   | ไม่     | `true`                            | ระบุว่า plugin ที่รวมมาให้ถูกเปิดใช้งานโดยค่าเริ่มต้น หากละเว้นฟิลด์นี้ หรือกำหนดค่าอื่นใดที่ไม่ใช่ `true` plugin จะยังคงถูกปิดใช้งานโดยค่าเริ่มต้น                                                                         |
| `legacyPluginIds`                    | ไม่     | `string[]`                        | id แบบเดิมที่จะถูกทำให้เป็นมาตรฐานมายัง id มาตรฐานของ plugin นี้                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | ไม่     | `string[]`                        | id ของ provider ที่ควรเปิดใช้งาน plugin นี้โดยอัตโนมัติเมื่อ auth, การกำหนดค่า หรือการอ้างอิงโมเดลมีการกล่าวถึง provider เหล่านั้น                                                                                            |
| `kind`                               | ไม่     | `"memory"` \| `"context-engine"`  | ประกาศชนิดของ plugin แบบเอกสิทธิ์ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                   |
| `channels`                           | ไม่     | `string[]`                        | id ของ channel ที่ plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นหาและการตรวจสอบความถูกต้องของการกำหนดค่า                                                                                                                                |
| `providers`                          | ไม่     | `string[]`                        | id ของ provider ที่ plugin นี้เป็นเจ้าของ                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | ไม่     | `string`                          | พาธโมดูลสำหรับการค้นหา provider แบบน้ำหนักเบา โดยอ้างอิงจากรากของ plugin สำหรับ metadata ของ catalog provider ในขอบเขต manifest ที่สามารถโหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์เต็มรูปแบบของ plugin                             |
| `modelSupport`                       | ไม่     | `object`                          | metadata แบบย่อของตระกูลโมเดลที่ manifest เป็นเจ้าของ ใช้เพื่อโหลด plugin อัตโนมัติก่อนรันไทม์                                                                                                                                |
| `modelCatalog`                       | ไม่     | `object`                          | metadata ของ catalog โมเดลแบบประกาศสำหรับ provider ที่ plugin นี้เป็นเจ้าของ นี่คือสัญญาควบคุมของ control-plane สำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต การเริ่มต้นใช้งาน ตัวเลือกโมเดล alias และการซ่อนโดยไม่ต้องโหลดรันไทม์ของ plugin |
| `providerEndpoints`                  | ไม่     | `object[]`                        | metadata ของ host/baseUrl ของ endpoint ที่ manifest เป็นเจ้าของ สำหรับเส้นทางของ provider ที่แกนระบบต้องจัดประเภทก่อนที่รันไทม์ของ provider จะโหลด                                                                           |
| `cliBackends`                        | ไม่     | `string[]`                        | id ของ backend การอนุมาน CLI ที่ plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติระหว่างการเริ่มต้นจากการอ้างอิงการกำหนดค่าที่ระบุไว้อย่างชัดเจน                                                                      |
| `syntheticAuthRefs`                  | ไม่     | `string[]`                        | การอ้างอิง provider หรือ backend CLI ที่ hook auth แบบ synthetic ซึ่ง plugin เป็นเจ้าของควรถูกตรวจสอบระหว่างการค้นหาโมเดลแบบ cold ก่อนที่รันไทม์จะโหลด                                                                        |
| `nonSecretAuthMarkers`               | ไม่     | `string[]`                        | ค่า API key ตัวแทนที่ plugin แบบ bundled เป็นเจ้าของ ซึ่งแสดงถึงสถานะข้อมูลรับรองแบบไม่ลับในเครื่อง, OAuth หรือข้อมูลรับรองแวดล้อม                                                                                             |
| `commandAliases`                     | ไม่     | `object[]`                        | ชื่อคำสั่งที่ plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการกำหนดค่าที่รับรู้ plugin และการวินิจฉัย CLI ก่อนที่รันไทม์จะโหลด                                                                                                             |
| `providerAuthEnvVars`                | ไม่     | `Record<string, string[]>`        | metadata ของ env สำหรับความเข้ากันได้ย้อนหลังที่เลิกใช้แล้ว สำหรับการค้นหา auth/สถานะของ provider สำหรับ plugin ใหม่ควรใช้ `setup.providers[].envVars`; OpenClaw ยังคงอ่านฟิลด์นี้ในช่วงที่ยังรองรับของที่เลิกใช้งานแล้ว          |
| `providerAuthAliases`                | ไม่     | `Record<string, string>`          | id ของ provider ที่ควรใช้ id ของ provider อื่นซ้ำสำหรับการค้นหา auth เช่น coding provider ที่ใช้ API key และโปรไฟล์ auth ร่วมกับ provider หลัก                                                                                  |
| `channelEnvVars`                     | ไม่     | `Record<string, string[]>`        | metadata ของ env สำหรับ channel แบบต้นทุนต่ำที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ดของ plugin ใช้สำหรับการตั้งค่า channel หรือพื้นผิว auth ที่ขับเคลื่อนด้วย env ซึ่งตัวช่วยการเริ่มต้น/การกำหนดค่าแบบทั่วไปควรมองเห็น |
| `providerAuthChoices`                | ไม่     | `object[]`                        | metadata ของตัวเลือก auth แบบต้นทุนต่ำสำหรับตัวเลือกในขั้นตอนเริ่มต้นใช้งาน การแก้ไข provider ที่ต้องการ และการเชื่อมต่อ CLI flag แบบง่าย                                                                                        |
| `activation`                         | ไม่     | `object`                          | metadata ของตัววางแผนการเปิดใช้งานแบบต้นทุนต่ำสำหรับการโหลดที่ถูกกระตุ้นด้วย provider, คำสั่ง, channel, route และ capability เป็น metadata เท่านั้น; รันไทม์ของ plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                        |
| `setup`                              | ไม่     | `object`                          | คำอธิบายการตั้งค่า/การเริ่มต้นใช้งานแบบต้นทุนต่ำที่พื้นผิวการค้นหาและการตั้งค่าสามารถตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ของ plugin                                                                                              |
| `qaRunners`                          | ไม่     | `object[]`                        | คำอธิบายของตัวรัน QA แบบต้นทุนต่ำที่โฮสต์ `openclaw qa` แบบใช้ร่วมกันใช้ก่อนที่รันไทม์ของ plugin จะโหลด                                                                                                                        |
| `contracts`                          | ไม่     | `object`                          | snapshot capability แบบคงที่สำหรับของที่รวมมาให้ ซึ่งครอบคลุม external auth hook, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่     | `Record<string, object>`          | ค่าเริ่มต้น media-understanding แบบต้นทุนต่ำสำหรับ id ของ provider ที่ประกาศไว้ใน `contracts.mediaUnderstandingProviders`                                                                                                         |
| `channelConfigs`                     | ไม่     | `Record<string, object>`          | metadata การกำหนดค่า channel ที่ manifest เป็นเจ้าของ ซึ่งถูกรวมเข้าไปในพื้นผิวการค้นหาและการตรวจสอบความถูกต้องก่อนที่รันไทม์จะโหลด                                                                                             |
| `skills`                             | ไม่     | `string[]`                        | ไดเรกทอรี Skills ที่จะโหลด โดยอ้างอิงจากรากของ plugin                                                                                                                                                                           |
| `name`                               | ไม่     | `string`                          | ชื่อ plugin ที่มนุษย์อ่านเข้าใจได้                                                                                                                                                                                              |
| `description`                        | ไม่     | `string`                          | สรุปสั้น ๆ ที่แสดงในพื้นผิวของ plugin                                                                                                                                                                                           |
| `version`                            | ไม่     | `string`                          | เวอร์ชันของ plugin เพื่อใช้เป็นข้อมูลอ้างอิง                                                                                                                                                                                    |
| `uiHints`                            | ไม่     | `Record<string, object>`          | ป้ายชื่อ UI, placeholder และคำใบ้ความอ่อนไหวสำหรับฟิลด์การกำหนดค่า                                                                                                                                                            |

## เอกสารอ้างอิง `providerAuthChoices`

แต่ละรายการใน `providerAuthChoices` จะอธิบายตัวเลือกการเริ่มต้นใช้งานหรือ auth หนึ่งรายการ
OpenClaw จะอ่านข้อมูลนี้ก่อนที่รันไทม์ของ provider จะโหลด
โฟลว์การตั้งค่า provider จะให้ความสำคัญกับตัวเลือกใน manifest เหล่านี้ก่อน จากนั้นจึงย้อนกลับไปใช้
metadata ของ wizard ในรันไทม์และตัวเลือก install-catalog เพื่อความเข้ากันได้

| ฟิลด์                 | จำเป็น | ประเภท                                           | ความหมาย                                                                                           |
| --------------------- | ------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่     | `string`                                         | id ของ provider ที่ตัวเลือกนี้สังกัดอยู่                                                             |
| `method`              | ใช่     | `string`                                         | id ของวิธี auth ที่จะใช้ส่งต่อไป                                                                     |
| `choiceId`            | ใช่     | `string`                                         | id ของตัวเลือก auth แบบคงที่ที่ใช้โดยโฟลว์การเริ่มต้นใช้งานและ CLI                                  |
| `choiceLabel`         | ไม่     | `string`                                         | ป้ายชื่อสำหรับผู้ใช้ หากละเว้น OpenClaw จะย้อนกลับไปใช้ `choiceId`                                   |
| `choiceHint`          | ไม่     | `string`                                         | ข้อความช่วยเหลือสั้น ๆ สำหรับตัวเลือก                                                               |
| `assistantPriority`   | ไม่     | `number`                                         | ค่าที่น้อยกว่าจะถูกจัดเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดย assistant                        |
| `assistantVisibility` | ไม่     | `"visible"` \| `"manual-only"`                   | ซ่อนตัวเลือกนี้จากตัวเลือกของ assistant แต่ยังอนุญาตให้เลือกเองผ่าน CLI ได้                         |
| `deprecatedChoiceIds` | ไม่     | `string[]`                                       | id ของตัวเลือกแบบเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้มายังตัวเลือกทดแทนนี้                                |
| `groupId`             | ไม่     | `string`                                         | id ของกลุ่มแบบเลือกได้ สำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                         |
| `groupLabel`          | ไม่     | `string`                                         | ป้ายชื่อสำหรับผู้ใช้ของกลุ่มนั้น                                                                      |
| `groupHint`           | ไม่     | `string`                                         | ข้อความช่วยเหลือสั้น ๆ สำหรับกลุ่ม                                                                   |
| `optionKey`           | ไม่     | `string`                                         | คีย์ option ภายในสำหรับโฟลว์ auth แบบ flag เดียวที่เรียบง่าย                                         |
| `cliFlag`             | ไม่     | `string`                                         | ชื่อ CLI flag เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่     | `string`                                         | รูปแบบ CLI option แบบเต็ม เช่น `--openrouter-api-key <key>`                                         |
| `cliDescription`      | ไม่     | `string`                                         | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                                 |
| `onboardingScopes`    | ไม่     | `Array<"text-inference" \| "image-generation">`  | พื้นผิวการเริ่มต้นใช้งานใดบ้างที่ควรแสดงตัวเลือกนี้ หากละเว้น จะใช้ค่าเริ่มต้นเป็น `["text-inference"]` |

## เอกสารอ้างอิง `commandAliases`

ใช้ `commandAliases` เมื่อ plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดพลาดลงใน `plugins.allow` หรือพยายามรันเป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ต้องนำเข้าโค้ดรันไทม์ของ plugin

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

| ฟิลด์        | จำเป็น | ประเภท            | ความหมาย                                                               |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | ใช่     | `string`          | ชื่อคำสั่งที่เป็นของ plugin นี้                                         |
| `kind`       | ไม่     | `"runtime-slash"` | ระบุว่า alias นี้เป็นคำสั่ง slash ในแชต ไม่ใช่คำสั่ง CLI ระดับราก        |
| `cliCommand` | ไม่     | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องซึ่งควรแนะนำสำหรับการทำงานผ่าน CLI ถ้ามี |

## เอกสารอ้างอิง `activation`

ใช้ `activation` เมื่อ plugin สามารถประกาศได้แบบต้นทุนต่ำว่าเหตุการณ์ใดใน control-plane
ควรรวม plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด

บล็อกนี้เป็น metadata ของตัววางแผน ไม่ใช่ API ของ lifecycle โดยจะไม่ลงทะเบียน
พฤติกรรมรันไทม์ ไม่ได้แทนที่ `register(...)` และไม่ได้รับประกันว่า
โค้ด plugin ได้ถูกเรียกทำงานไปแล้ว ตัววางแผนการเปิดใช้งานจะใช้ฟิลด์เหล่านี้เพื่อจำกัด
ขอบเขต plugin ตัวเลือกก่อน แล้วจึงย้อนกลับไปใช้ metadata ความเป็นเจ้าของใน manifest
ที่มีอยู่แล้ว เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ควรเลือกใช้ metadata ที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของได้อยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, ตัวอธิบาย setup หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์ได้ ใช้ `activation` สำหรับคำใบ้เพิ่มเติมของตัววางแผน
ที่ไม่สามารถแทนได้ด้วยฟิลด์ความเป็นเจ้าของเหล่านั้น

บล็อกนี้เป็น metadata เท่านั้น โดยจะไม่ลงทะเบียนพฤติกรรมรันไทม์ และไม่ได้
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint อื่น ๆ ของรันไทม์/plugin
ตัวใช้งานปัจจุบันใช้มันเป็นคำใบ้เพื่อจำกัดขอบเขตก่อนการโหลด plugin ที่กว้างขึ้น ดังนั้น
การขาด metadata ของ activation มักมีผลแค่ด้านประสิทธิภาพเท่านั้น; ไม่ควร
เปลี่ยนความถูกต้องของการทำงานตราบใดที่ยังมี fallback ของความเป็นเจ้าของใน manifest แบบเดิมอยู่

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

| ฟิลด์            | จำเป็น | ประเภท                                                | ความหมาย                                                                                         |
| ---------------- | ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `onProviders`    | ไม่     | `string[]`                                            | id ของ provider ที่ควรรวม plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                  |
| `onCommands`     | ไม่     | `string[]`                                            | id ของคำสั่งที่ควรรวม plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                      |
| `onChannels`     | ไม่     | `string[]`                                            | id ของ channel ที่ควรรวม plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                   |
| `onRoutes`       | ไม่     | `string[]`                                            | ชนิดของ route ที่ควรรวม plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                   |
| `onCapabilities` | ไม่     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ควรใช้ฟิลด์ที่แคบกว่าถ้าเป็นไปได้ |

ตัวใช้งานจริงในปัจจุบัน:

- การวางแผน CLI ที่ถูกกระตุ้นด้วยคำสั่งจะย้อนกลับไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name`
  แบบเดิม
- การวางแผน setup/channel ที่ถูกกระตุ้นด้วย channel จะย้อนกลับไปใช้ความเป็นเจ้าของ
  `channels[]` แบบเดิมเมื่อไม่มี metadata ของ activation ของ channel แบบชัดเจน
- การวางแผน setup/รันไทม์ที่ถูกกระตุ้นด้วย provider จะย้อนกลับไปใช้ความเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบเดิมเมื่อไม่มี metadata ของ activation ของ provider แบบชัดเจน

การวินิจฉัยของตัววางแผนสามารถแยกความแตกต่างระหว่างคำใบ้ activation แบบชัดเจนกับ
fallback ของความเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายความว่า
`activation.onCommands` ตรงกัน ส่วน `manifest-command-alias` หมายความว่า
ตัววางแผนใช้ความเป็นเจ้าของจาก `commandAliases` แทน ป้ายเหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยของโฮสต์และการทดสอบ; ผู้เขียน plugin ควรประกาศ metadata
ที่อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## เอกสารอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ plugin เพิ่ม transport runner หนึ่งตัวหรือมากกว่านั้นภายใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน เก็บ metadata นี้ให้มีต้นทุนต่ำและเป็นแบบคงที่; รันไทม์ของ plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
แบบน้ำหนักเบาที่ export `qaRunnerCliRegistrations`

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

| ฟิลด์         | จำเป็น | ประเภท   | ความหมาย                                                               |
| ------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | ใช่     | `string` | คำสั่งย่อยที่เมานต์ภายใต้ `openclaw qa` เช่น `matrix`                  |
| `description` | ไม่     | `string` | ข้อความช่วยเหลือสำรองที่ใช้เมื่อโฮสต์ที่ใช้ร่วมกันต้องมีคำสั่งแบบ stub |

## เอกสารอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิวการตั้งค่าและการเริ่มต้นใช้งานต้องการ metadata ที่ plugin เป็นเจ้าของ
แบบต้นทุนต่ำก่อนที่รันไทม์จะโหลด

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

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังคงอธิบาย backend การอนุมานของ CLI
`setup.cliBackends` คือพื้นผิวตัวอธิบายเฉพาะ setup สำหรับโฟลว์ control-plane/setup
ที่ควรคงไว้เป็น metadata เท่านั้น

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็นพื้นผิวสำหรับค้นหาแบบ descriptor-first
ที่ควรใช้ก่อนสำหรับการค้นหา setup หากตัวอธิบายมีไว้เพียงเพื่อจำกัดขอบเขต plugin ตัวเลือก
และ setup ยังต้องใช้ hook รันไทม์ที่สมบูรณ์กว่าสำหรับช่วงตั้งค่า ให้ตั้ง `requiresRuntime: true`
และคง `setup-api` ไว้เป็นเส้นทาง fallback สำหรับการทำงาน

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหา auth ของ provider แบบทั่วไป
และการค้นหา env var ด้วย `providerAuthEnvVars` ยังคงรองรับผ่านตัวแปลงความเข้ากันได้
ในช่วงที่ยังรองรับของที่เลิกใช้งานแล้ว แต่ plugin ที่ไม่ใช่แบบ bundled ที่ยังใช้ฟิลด์นี้
จะได้รับการวินิจฉัยใน manifest plugin ใหม่ควรวาง metadata ของ env สำหรับ setup/สถานะ
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup แบบง่ายจาก `setup.providers[].authMethods`
ได้เมื่อไม่มี setup entry หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องมี setup runtime รายการ `providerAuthChoices` แบบชัดเจนยังคงได้รับความสำคัญ
มากกว่า สำหรับป้ายชื่อแบบกำหนดเอง, CLI flag, ขอบเขตการเริ่มต้นใช้งาน และ metadata ของ assistant

ตั้ง `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw จะถือว่า `false` แบบชัดเจนเป็นสัญญาแบบ descriptor-only
และจะไม่เรียกใช้ `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
plugin แบบ descriptor-only ยังคงส่งมอบ entry ของ setup runtime อย่างใดอย่างหนึ่ง
OpenClaw จะรายงานการวินิจฉัยแบบ additive และยังคงเพิกเฉยมันต่อไป หากละเว้น
`requiresRuntime` จะคงพฤติกรรม fallback แบบเดิมไว้ เพื่อให้ plugin เดิมที่เพิ่ม
descriptor โดยไม่ใส่ flag นี้ไม่พัง

เนื่องจากการค้นหา setup สามารถเรียกใช้โค้ด `setup-api` ที่ plugin เป็นเจ้าของได้
ค่าที่ถูกทำให้เป็นมาตรฐานแล้วของ `setup.providers[].id` และ `setup.cliBackends[]`
จึงต้องไม่ซ้ำกันระหว่าง plugin ที่ถูกค้นพบ ความเป็นเจ้าของที่กำกวมจะล้มเหลวแบบปิด
แทนที่จะเลือกผู้ชนะตามลำดับการค้นพบ

เมื่อมีการเรียกใช้ setup runtime จริง การวินิจฉัยรีจิสทรี setup จะรายงานความคลาดเคลื่อน
ของ descriptor หาก `setup-api` ลงทะเบียน provider หรือ backend CLI ที่ตัวอธิบายใน manifest
ไม่ได้ประกาศไว้ หรือหากมี descriptor ที่ไม่มีการลงทะเบียนรันไทม์ที่ตรงกัน
การวินิจฉัยเหล่านี้เป็นแบบ additive และจะไม่ปฏิเสธ plugin แบบเดิม

### เอกสารอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น | ประเภท     | ความหมาย                                                                              |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | ใช่     | `string`   | id ของ provider ที่ถูกเปิดเผยระหว่าง setup หรือ onboarding โดย id ที่ทำให้เป็นมาตรฐานแล้วต้องไม่ซ้ำกันทั่วระบบ |
| `authMethods` | ไม่     | `string[]` | id ของวิธี setup/auth ที่ provider นี้รองรับได้โดยไม่ต้องโหลดรันไทม์เต็มรูปแบบ                 |
| `envVars`     | ไม่     | `string[]` | env var ที่พื้นผิว setup/สถานะแบบทั่วไปสามารถตรวจสอบได้ก่อนที่รันไทม์ของ plugin จะโหลด         |

### ฟิลด์ `setup`

| ฟิลด์              | จำเป็น | ประเภท     | ความหมาย                                                                                      |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | ไม่     | `object[]` | ตัวอธิบาย setup ของ provider ที่เปิดเผยระหว่าง setup และ onboarding                            |
| `cliBackends`      | ไม่     | `string[]` | id ของ backend ในช่วง setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first โดย id ที่ทำให้เป็นมาตรฐานแล้วต้องไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่     | `string[]` | id ของการย้ายค่ากำหนดค่าที่เป็นของพื้นผิว setup ของ plugin นี้                                  |
| `requiresRuntime`  | ไม่     | `boolean`  | setup ยังคงต้องเรียกใช้ `setup-api` หลังจากการค้นหาจาก descriptor หรือไม่                         |

## เอกสารอ้างอิง `uiHints`

`uiHints` คือแผนที่จากชื่อฟิลด์การกำหนดค่าไปยังคำใบ้เล็ก ๆ สำหรับการเรนเดอร์

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

คำใบ้ของแต่ละฟิลด์สามารถมีได้ดังนี้:

| ฟิลด์         | ประเภท     | ความหมาย                              |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | ป้ายชื่อฟิลด์ที่แสดงต่อผู้ใช้          |
| `help`        | `string`   | ข้อความช่วยเหลือสั้น ๆ                |
| `tags`        | `string[]` | แท็ก UI แบบเลือกได้                   |
| `advanced`    | `boolean`  | ระบุว่าฟิลด์นี้เป็นฟิลด์ขั้นสูง         |
| `sensitive`   | `boolean`  | ระบุว่าฟิลด์นี้เป็นความลับหรือมีความอ่อนไหว |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตในฟอร์ม |

## เอกสารอ้างอิง `contracts`

ใช้ `contracts` เฉพาะสำหรับ metadata ความเป็นเจ้าของ capability แบบคงที่ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้องนำเข้ารันไทม์ของ plugin

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

แต่ละรายการเป็นตัวเลือกได้:

| ฟิลด์                            | ประเภท     | ความหมาย                                                              |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id ของ extension factory สำหรับ app-server ของ Codex ซึ่งปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | id ของรันไทม์ที่ plugin แบบ bundled สามารถลงทะเบียน middleware ของผลลัพธ์เครื่องมือได้ |
| `externalAuthProviders`          | `string[]` | id ของ provider ที่ hook โปรไฟล์ external auth เป็นของ plugin นี้       |
| `speechProviders`                | `string[]` | id ของ speech provider ที่ plugin นี้เป็นเจ้าของ                        |
| `realtimeTranscriptionProviders` | `string[]` | id ของ realtime-transcription provider ที่ plugin นี้เป็นเจ้าของ        |
| `realtimeVoiceProviders`         | `string[]` | id ของ realtime-voice provider ที่ plugin นี้เป็นเจ้าของ               |
| `memoryEmbeddingProviders`       | `string[]` | id ของ memory embedding provider ที่ plugin นี้เป็นเจ้าของ             |
| `mediaUnderstandingProviders`    | `string[]` | id ของ media-understanding provider ที่ plugin นี้เป็นเจ้าของ          |
| `imageGenerationProviders`       | `string[]` | id ของ image-generation provider ที่ plugin นี้เป็นเจ้าของ             |
| `videoGenerationProviders`       | `string[]` | id ของ video-generation provider ที่ plugin นี้เป็นเจ้าของ             |
| `webFetchProviders`              | `string[]` | id ของ web-fetch provider ที่ plugin นี้เป็นเจ้าของ                    |
| `webSearchProviders`             | `string[]` | id ของ web-search provider ที่ plugin นี้เป็นเจ้าของ                   |
| `tools`                          | `string[]` | ชื่อเครื่องมือ agent ที่ plugin นี้เป็นเจ้าของสำหรับการตรวจสอบ contract ของแบบ bundled |

`contracts.embeddedExtensionFactories` ยังคงเก็บไว้สำหรับ extension factory
เฉพาะ app-server ของ Codex แบบ bundled เท่านั้น การแปลงผลลัพธ์เครื่องมือของแบบ bundled ควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน Plugin ภายนอกไม่สามารถ
ลงทะเบียน middleware ของผลลัพธ์เครื่องมือได้ เพราะจุดเชื่อมต่อนี้สามารถเขียนผลลัพธ์ของเครื่องมือ
ที่มีความไว้วางใจสูงใหม่ก่อนที่โมเดลจะเห็นได้

provider Plugin ที่ติดตั้ง `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugin ที่ไม่มีการประกาศนี้ยังคงทำงานผ่าน fallback
ความเข้ากันได้แบบเลิกใช้แล้วได้ แต่ fallback นั้นช้ากว่าและจะถูกลบออกหลังหมดช่วงการย้ายระบบ

provider ของ memory embedding แบบ bundled ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับทุก id ของ adapter ที่เปิดเผย รวมถึง
adapter ในตัว เช่น `local` เส้นทาง CLI แบบ standalone ใช้ contract ใน manifest นี้
เพื่อโหลดเฉพาะ plugin ที่เป็นเจ้าของก่อนที่รันไทม์ Gateway แบบเต็มจะลงทะเบียน provider

## เอกสารอ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
โมเดลค่าเริ่มต้น ลำดับความสำคัญ fallback ของ auto-auth หรือการรองรับเอกสารแบบเนทีฟที่
ตัวช่วยแกนระบบทั่วไปจำเป็นต้องรู้ก่อนที่รันไทม์จะโหลด คีย์ต่าง ๆ ต้องถูกประกาศไว้ใน
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

| ฟิลด์                  | ประเภท                              | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | capability ด้านสื่อที่ provider นี้เปิดเผย                               |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นจาก capability ไปยังโมเดลที่ใช้เมื่อการกำหนดค่าไม่ได้ระบุโมเดล |
| `autoPriority`         | `Record<string, number>`            | ค่าที่น้อยกว่าจะถูกจัดเรียงก่อนสำหรับ fallback ของ provider อัตโนมัติตามข้อมูลรับรอง |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบเนทีฟที่ provider รองรับ                                 |

## เอกสารอ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ channel plugin ต้องการ metadata การกำหนดค่าแบบต้นทุนต่ำก่อนที่
รันไทม์จะโหลด การค้นหา setup/สถานะของ channel แบบอ่านอย่างเดียวสามารถใช้ metadata นี้
ได้โดยตรงสำหรับ channel ภายนอกที่กำหนดค่าไว้เมื่อไม่มี setup entry หรือเมื่อ
`setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องมี setup runtime

สำหรับ channel plugin, `configSchema` และ `channelConfigs` อธิบายคนละเส้นทางกัน:

- `configSchema` ตรวจสอบความถูกต้องของ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบความถูกต้องของ `channels.<channel-id>`

Plugin ที่ไม่ใช่แบบ bundled ซึ่งประกาศ `channels[]` ควรประกาศรายการ `channelConfigs`
ที่ตรงกันด้วย หากไม่มี OpenClaw ยังสามารถโหลด plugin ได้ แต่สคีมาการกำหนดค่าใน cold-path,
พื้นผิว setup และ Control UI จะไม่สามารถทราบรูปร่างตัวเลือกที่ channel เป็นเจ้าของได้
จนกว่ารันไทม์ของ plugin จะทำงาน

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
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

แต่ละรายการของ channel สามารถมีได้ดังนี้:

| ฟิลด์         | ประเภท                   | ความหมาย                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการการกำหนดค่า channel ที่ประกาศไว้ |
| `uiHints`     | `Record<string, object>` | ป้ายชื่อ UI/placeholder/คำใบ้ความอ่อนไหวแบบเลือกได้สำหรับส่วนการกำหนดค่า channel นั้น     |
| `label`       | `string`                 | ป้ายชื่อ channel ที่ถูกรวมเข้าไปในพื้นผิว picker และ inspect เมื่อ metadata ของรันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายสั้น ๆ ของ channel สำหรับพื้นผิว inspect และ catalog                            |
| `preferOver`  | `string[]`               | id ของ plugin แบบเดิมหรือมีลำดับความสำคัญต่ำกว่าที่ channel นี้ควรมีอันดับเหนือกว่าในพื้นผิวการเลือก |

## เอกสารอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน provider plugin ของคุณจาก
id โมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่รันไทม์ของ plugin จะโหลด

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญดังนี้:

- การอ้างอิง `provider/model` แบบชัดเจนจะใช้ metadata `providers` ของ manifest ที่เป็นเจ้าของ
- `modelPatterns` มีความสำคัญเหนือ `modelPrefixes`
- หากมีทั้ง plugin ที่ไม่ใช่แบบ bundled และ plugin แบบ bundled ตรงกันอย่างละหนึ่งตัว
  plugin ที่ไม่ใช่แบบ bundled จะชนะ
- ความกำกวมที่เหลือจะถูกละไว้จนกว่าผู้ใช้หรือการกำหนดค่าจะระบุ provider

ฟิลด์ต่าง ๆ:

| ฟิลด์           | ประเภท     | ความหมาย                                                                    |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | คำนำหน้าที่จับคู่ด้วย `startsWith` กับ id โมเดลแบบย่อ                      |
| `modelPatterns` | `string[]` | source ของ regex ที่จับคู่กับ id โมเดลแบบย่อหลังจากลบ suffix ของโปรไฟล์ออก |

## เอกสารอ้างอิง `modelCatalog`

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้ metadata ของโมเดล provider ก่อน
โหลดรันไทม์ของ plugin นี่คือแหล่งข้อมูลที่ manifest เป็นเจ้าของสำหรับแถว catalog แบบคงที่
alias ของ provider กฎการซ่อน และโหมดการค้นหา การรีเฟรชในรันไทม์ยังคงเป็นหน้าที่ของโค้ดรันไทม์ของ provider แต่ manifest จะบอกแกนระบบว่าเมื่อใดจำเป็นต้องใช้รันไทม์

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

| ฟิลด์         | ประเภท                                                   | ความหมาย                                                                                                  |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`   | `Record<string, object>`                                 | แถวใน catalog สำหรับ id ของ provider ที่ plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย |
| `aliases`     | `Record<string, object>`                                 | alias ของ provider ที่ควรถูกแก้ให้เป็น provider ที่เป็นเจ้าของสำหรับการวางแผน catalog หรือ suppression    |
| `suppressions` | `object[]`                                              | แถวของโมเดลจากแหล่งอื่นที่ plugin นี้ซ่อนไว้ด้วยเหตุผลเฉพาะของ provider                                 |
| `discovery`   | `Record<string, "static" \| "refreshable" \| "runtime">` | ระบุว่า catalog ของ provider สามารถอ่านจาก metadata ใน manifest, รีเฟรชลงแคช หรือจำเป็นต้องใช้รันไทม์    |

ฟิลด์ของ provider:

| ฟิลด์     | ประเภท                   | ความหมาย                                                            |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL เริ่มต้นแบบเลือกได้สำหรับโมเดลใน catalog ของ provider นี้   |
| `api`     | `ModelApi`               | adapter API เริ่มต้นแบบเลือกได้สำหรับโมเดลใน catalog ของ provider นี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่ใช้กับ catalog ของ provider นี้แบบเลือกได้          |
| `models`  | `object[]`               | แถวของโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละทิ้ง                   |

ฟิลด์ของโมเดล:

| ฟิลด์           | ประเภท                                                         | ความหมาย                                                                |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `id`            | `string`                                                       | id ของโมเดลภายใน provider โดยไม่มีคำนำหน้า `provider/`                  |
| `name`          | `string`                                                       | ชื่อที่ใช้แสดงผลแบบเลือกได้                                              |
| `api`           | `ModelApi`                                                     | การ override API ต่อโมเดลแบบเลือกได้                                      |
| `baseUrl`       | `string`                                                       | การ override base URL ต่อโมเดลแบบเลือกได้                                 |
| `headers`       | `Record<string, string>`                                       | header แบบคงที่ต่อโมเดลแบบเลือกได้                                        |
| `input`         | `Array<"text" \| "image" \| "document">`                       | modality ที่โมเดลนี้รับได้                                                |
| `reasoning`     | `boolean`                                                      | โมเดลนี้เปิดเผยพฤติกรรมการให้เหตุผลหรือไม่                                 |
| `contextWindow` | `number`                                                       | หน้าต่าง context ดั้งเดิมของ provider                                     |
| `contextTokens` | `number`                                                       | เพดาน context ของรันไทม์ที่มีผลจริงแบบเลือกได้ เมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวนโทเค็นเอาต์พุตสูงสุดเมื่อทราบค่า                                      |
| `cost`          | `object`                                                       | ราคาต่อหนึ่งล้านโทเค็นหน่วย USD แบบเลือกได้ รวมถึง `tieredPricing` แบบเลือกได้ |
| `compat`        | `object`                                                       | แฟล็กความเข้ากันได้แบบเลือกได้ที่สอดคล้องกับความเข้ากันได้ของการกำหนดค่าโมเดล OpenClaw |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะของรายการ ให้ใช้ suppression เฉพาะเมื่อแถวนั้นไม่ควรปรากฏเลยเท่านั้น     |
| `statusReason`  | `string`                                                       | เหตุผลแบบเลือกได้ที่แสดงร่วมกับสถานะที่ไม่พร้อมใช้งาน                        |
| `replaces`      | `string[]`                                                     | id ของโมเดลภายใน provider รุ่นเก่าที่โมเดลนี้มาแทนที่                        |
| `replacedBy`    | `string`                                                       | id ของโมเดลภายใน provider ที่ใช้แทนสำหรับแถวที่เลิกใช้แล้ว                   |
| `tags`          | `string[]`                                                     | แท็กแบบคงที่ที่ใช้โดยตัวเลือกและตัวกรอง                                     |

อย่าใส่ข้อมูลที่ใช้ได้เฉพาะในรันไทม์ลงใน `modelCatalog` หาก provider ต้องใช้
สถานะบัญชี คำขอ API หรือการค้นหา process ภายในเครื่องเพื่อทราบชุดโมเดลที่สมบูรณ์
ให้ประกาศ provider นั้นเป็น `refreshable` หรือ `runtime` ใน `discovery`

คีย์ capability ระดับบนสุดแบบเดิมเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด
manifest แบบปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นความเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

ไฟล์ทั้งสองมีหน้าที่ต่างกัน:

| ไฟล์                  | ใช้สำหรับ                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นหา การตรวจสอบความถูกต้องของการกำหนดค่า metadata ของตัวเลือก auth และคำใบ้ UI ที่ต้องมีอยู่ก่อนที่โค้ด plugin จะรัน      |
| `package.json`         | metadata ของ npm การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, การควบคุมการติดตั้ง, setup หรือ metadata ของ catalog |

หากคุณไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ข้อมูลนั้นก่อนโหลดโค้ด plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเป็นเรื่องของ packaging, ไฟล์ entry หรือพฤติกรรมการติดตั้ง npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ใน `package.json` ที่มีผลต่อการค้นหา

metadata ของ plugin บางส่วนก่อนรันไทม์ตั้งใจให้อยู่ใน `package.json` ภายใต้บล็อก
`openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ประกาศ entrypoint ของ plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                                                               |
| `openclaw.runtimeExtensions`                                      | ประกาศ entrypoint ของรันไทม์ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                        |
| `openclaw.setupEntry`                                             | entrypoint แบบน้ำหนักเบาเฉพาะ setup ที่ใช้ระหว่าง onboarding, การเริ่มต้น channel แบบเลื่อนเวลา และการค้นหาสถานะ channel/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin |
| `openclaw.runtimeSetupEntry`                                      | ประกาศ entrypoint ของ setup JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ plugin                                                         |
| `openclaw.channel`                                                | metadata ของ catalog channel แบบต้นทุนต่ำ เช่น ป้ายชื่อ พาธเอกสาร alias และข้อความสำหรับการเลือก                                                                              |
| `openclaw.channel.configuredState`                                | metadata ของตัวตรวจสอบสถานะที่กำหนดค่าไว้แบบน้ำหนักเบา ที่สามารถตอบว่า "มี setup แบบใช้ env อย่างเดียวอยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์เต็มของ channel                 |
| `openclaw.channel.persistedAuthState`                             | metadata ของตัวตรวจสอบ persisted auth แบบน้ำหนักเบา ที่สามารถตอบว่า "มีการลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์เต็มของ channel                                |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | คำใบ้สำหรับการติดตั้ง/อัปเดตสำหรับ plugin แบบ bundled และ plugin ที่เผยแพร่ภายนอก                                                                                              |
| `openclaw.install.defaultChoice`                                  | เส้นทางการติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้เลือก                                                                                                                |
| `openclaw.install.minHostVersion`                                 | เวอร์ชัน OpenClaw host ขั้นต่ำที่รองรับ โดยใช้ semver ขั้นต่ำ เช่น `>=2026.3.22`                                                                                                |
| `openclaw.install.expectedIntegrity`                              | สตริง npm dist integrity ที่คาดหวัง เช่น `sha512-...`; โฟลว์การติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมาว่าตรงกับค่านี้                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตเส้นทางกู้คืนแบบแคบสำหรับการติดตั้งใหม่ของ plugin แบบ bundled เมื่อการกำหนดค่าไม่ถูกต้อง                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิว channel แบบ setup-only โหลดก่อน plugin ของ channel แบบเต็มระหว่างการเริ่มต้น                                                                                   |

metadata ใน manifest จะเป็นตัวตัดสินว่าตัวเลือก provider/channel/setup ใดจะปรากฏใน
onboarding ก่อนที่รันไทม์จะโหลด ส่วน `package.json#openclaw.install` จะบอก
onboarding ว่าควรดึงหรือต้องเปิดใช้งาน plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งในตัวเลือกเหล่านั้น
อย่าย้ายคำใบ้การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลดรีจิสทรี
manifest ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ใหม่กว่าแต่ยังถูกต้องจะข้าม
plugin นั้นบน host ที่เก่ากว่า

การปักหมุดเวอร์ชัน npm แบบตรงตัวมีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการใน catalog ภายนอกอย่างเป็นทางการ
ควรจับคู่สเปกแบบตรงตัวกับ `expectedIntegrity` เพื่อให้โฟลว์การอัปเดตล้มเหลวแบบปิด
หาก artifact npm ที่ดึงมาไม่ตรงกับรีลีสที่ปักหมุดไว้อีกต่อไป
onboarding แบบโต้ตอบยังคงเสนอสเปก npm จากรีจิสทรีที่เชื่อถือได้ รวมถึงชื่อแพ็กเกจเปล่าและ dist-tag
เพื่อความเข้ากันได้ การวินิจฉัยของ catalog สามารถแยกความแตกต่างระหว่างแหล่งที่มาแบบตรงตัว แบบลอยตัว
แบบปักหมุด integrity แบบไม่มี integrity แบบชื่อแพ็กเกจไม่ตรงกัน และแบบ default-choice ไม่ถูกต้องได้
นอกจากนี้ยังเตือนเมื่อมี `expectedIntegrity` อยู่ แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ปักหมุด
เมื่อมี `expectedIntegrity`
โฟลว์การติดตั้ง/อัปเดตจะบังคับใช้ค่านี้; เมื่อไม่มีค่านี้ การแก้ค่ารีจิสทรีจะถูก
บันทึกไว้โดยไม่มีการปักหมุด integrity

channel Plugin ควรมี `openclaw.setupEntry` เมื่อสถานะ รายการ channel
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าไว้โดยไม่ต้องโหลดรันไทม์เต็ม
setup entry ควรเปิดเผย metadata ของ channel พร้อมกับ adapter สำหรับ config, สถานะ และ secret ที่ปลอดภัยต่อ setup;
ให้คง network client, listener ของ Gateway และรันไทม์ transport ไว้ใน entrypoint ของ extension หลัก

ฟิลด์ entrypoint ของรันไทม์จะไม่แทนที่การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
entrypoint ของ source ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกออกแบบให้แคบโดยเจตนา มัน
ไม่ได้ทำให้ config ที่เสียแบบใดก็ได้ติดตั้งได้ ปัจจุบันมันอนุญาตเฉพาะโฟลว์การติดตั้ง
ให้กู้คืนจากความล้มเหลวบางอย่างของการอัปเกรด plugin แบบ bundled ที่ค้างอยู่ เช่น
พาธ plugin แบบ bundled ที่หายไป หรือรายการ `channels.<id>` ที่ค้างอยู่สำหรับ bundled plugin
ตัวเดียวกันนั้น ข้อผิดพลาดของ config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ดูแล
ไปยัง `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ metadata ของแพ็กเกจสำหรับโมดูลตัวตรวจสอบขนาดเล็ก:

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

ใช้เมื่อโฟลว์ setup, doctor หรือ configured-state ต้องการการตรวจสอบ auth แบบ
ใช่/ไม่ใช่ที่มีต้นทุนต่ำก่อนที่ channel plugin แบบเต็มจะโหลด export เป้าหมายควรเป็นฟังก์ชันขนาดเล็ก
ที่อ่านเฉพาะ persisted state เท่านั้น; อย่าส่งมันผ่าน barrel ของรันไทม์ channel แบบเต็ม

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบการกำหนดค่า
แบบใช้ env อย่างเดียวที่มีต้นทุนต่ำ:

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

ใช้เมื่อ channel สามารถตอบสถานะที่กำหนดค่าไว้ได้จาก env หรืออินพุตขนาดเล็กอื่น ๆ
ที่ไม่ใช่รันไทม์ หากการตรวจสอบต้องใช้การแก้ค่า config แบบเต็มหรือรันไทม์จริงของ
channel ให้เก็บตรรกะนั้นไว้ใน hook `config.hasConfiguredState` ของ plugin แทน

## ลำดับความสำคัญของการค้นหา (id ของ plugin ซ้ำกัน)

OpenClaw ค้นหา plugin จากหลายราก (bundled, การติดตั้งแบบ global, workspace, พาธที่เลือกอย่างชัดเจนใน config) หากการค้นหาสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด**; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดอยู่ข้างกัน

ลำดับความสำคัญจากสูงไปต่ำ:

1. **Config-selected** — พาธที่ปักหมุดไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — plugin ที่มาพร้อมกับ OpenClaw
3. **Global install** — plugin ที่ติดตั้งในราก plugin แบบ global ของ OpenClaw
4. **Workspace** — plugin ที่ค้นพบโดยอ้างอิงจาก workspace ปัจจุบัน

สิ่งที่ตามมา:

- สำเนาของ bundled plugin ที่ถูก fork หรือค้างเก่าอยู่ใน workspace จะไม่สามารถแทน bundled build ได้
- หากต้องการแทน bundled plugin ด้วยตัวในเครื่องจริง ๆ ให้ปักหมุดผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่งการค้นหาใน workspace
- การทิ้งรายการซ้ำจะถูกบันทึกใน log เพื่อให้ Doctor และการวินิจฉัยระหว่างการเริ่มต้นสามารถชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนดของ JSON Schema

- **ทุก plugin ต้องมี JSON Schema** แม้ว่าจะไม่รับ config เลยก็ตาม
- อนุญาตให้ใช้ schema ว่างได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema จะถูกตรวจสอบความถูกต้องตอนอ่าน/เขียน config ไม่ใช่ในรันไทม์

## พฤติกรรมการตรวจสอบความถูกต้อง

- คีย์ `channels.*` ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด** เว้นแต่ id ของ channel จะถูกประกาศโดย
  manifest ของ plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id ของ plugin ที่ **สามารถค้นพบได้** id ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด**
- หาก plugin ถูกติดตั้งแต่มี manifest หรือ schema ที่เสียหายหรือหายไป
  การตรวจสอบความถูกต้องจะล้มเหลว และ Doctor จะรายงานข้อผิดพลาดของ plugin
- หากมี config ของ plugin อยู่แต่ plugin นั้น **ถูกปิดใช้งาน** config จะยังคงอยู่ และ
  จะมี **คำเตือน** ปรากฏใน Doctor + logs

ดู [Configuration reference](/th/gateway/configuration) สำหรับสคีมา `plugins.*` แบบเต็ม

## หมายเหตุ

- manifest เป็นสิ่ง **จำเป็นสำหรับ Plugin OpenClaw แบบเนทีฟ** รวมถึงการโหลดจากระบบไฟล์ในเครื่องด้วย รันไทม์ยังคงโหลดโมดูลของ plugin แยกต่างหาก; manifest มีไว้เฉพาะสำหรับการค้นหา + การตรวจสอบความถูกต้อง
- manifest แบบเนทีฟจะถูก parse ด้วย JSON5 ดังนั้นจึงยอมรับ comment, trailing comma และคีย์ที่ไม่ใส่เครื่องหมายคำพูดได้ ตราบใดที่ค่าสุดท้ายยังคงเป็น object
- ตัวโหลด manifest จะอ่านเฉพาะฟิลด์ manifest ที่มีการจัดทำเอกสารไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- สามารถละเว้น `channels`, `providers`, `cliBackends` และ `skills` ได้ทั้งหมดเมื่อ plugin ไม่จำเป็นต้องใช้
- `providerDiscoveryEntry` ต้องมีน้ำหนักเบาและไม่ควรนำเข้าโค้ดรันไทม์วงกว้าง; ใช้สำหรับ metadata ของ catalog provider แบบคงที่หรือตัวอธิบายการค้นหาแบบแคบ ไม่ใช่การทำงานในเวลาคำขอ
- ชนิด Plugin แบบเอกสิทธิ์จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- metadata ของ env var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว และ `channelEnvVars`) เป็นแบบประกาศเท่านั้น พื้นผิวแบบอ่านอย่างเดียว เช่น สถานะ, audit, การตรวจสอบการส่งมอบ Cron และอื่น ๆ ยังคงใช้ความเชื่อถือของ plugin และนโยบาย activation ที่มีผลจริงก่อนจะถือว่า env var นั้นถูกกำหนดค่าแล้ว
- สำหรับ metadata ของ wizard ในรันไทม์ที่ต้องใช้โค้ดของ provider โปรดดู [Provider runtime hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก plugin ของคุณพึ่งพา native module ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนด allowlist ของ package manager ที่เกี่ยวข้อง (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน plugin
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดล capability
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    เอกสารอ้างอิง Plugin SDK และการนำเข้า subpath
  </Card>
</CardGroup>
