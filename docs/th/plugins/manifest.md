---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณจำเป็นต้องเผยแพร่สคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดในการตรวจสอบความถูกต้องของ Plugin
summary: แมนิเฟสต์ของ Plugin + ข้อกำหนดสคีมา JSON (การตรวจสอบการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ Plugin
x-i18n:
    generated_at: "2026-04-30T10:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้มีไว้สำหรับ **manifest ของ Plugin OpenClaw แบบเนทีฟ** เท่านั้น

สำหรับเลย์เอาต์บันเดิลที่เข้ากันได้ โปรดดู [บันเดิล Plugin](/th/plugins/bundles)

รูปแบบบันเดิลที่เข้ากันได้ใช้ไฟล์ manifest คนละแบบกัน:

- บันเดิล Codex: `.codex-plugin/plugin.json`
- บันเดิล Claude: `.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude
  เริ่มต้นที่ไม่มี manifest
- บันเดิล Cursor: `.cursor-plugin/plugin.json`

OpenClaw ตรวจพบเลย์เอาต์บันเดิลเหล่านั้นโดยอัตโนมัติด้วย แต่จะไม่ตรวจสอบความถูกต้อง
เทียบกับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับบันเดิลที่เข้ากันได้ ปัจจุบัน OpenClaw อ่าน metadata ของบันเดิล รวมถึง root ของ
skill ที่ประกาศไว้, root ของคำสั่ง Claude, ค่าเริ่มต้น `settings.json` ของบันเดิล Claude,
ค่าเริ่มต้น LSP ของบันเดิล Claude และชุด hook pack ที่รองรับเมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของ runtime ของ OpenClaw

Plugin OpenClaw แบบเนทีฟทุกตัว **ต้อง** มาพร้อมไฟล์ `openclaw.plugin.json` ใน
**root ของ Plugin** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบความถูกต้องของการกำหนดค่า
**โดยไม่รันโค้ด Plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถือเป็นข้อผิดพลาดของ
Plugin และจะบล็อกการตรวจสอบความถูกต้องของ config

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugins](/th/tools/plugin)
สำหรับโมเดล capability แบบเนทีฟและคำแนะนำด้านความเข้ากันได้ภายนอกในปัจจุบัน:
[โมเดล capability](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่าน **ก่อนโหลดโค้ด
Plugin ของคุณ** ทุกอย่างด้านล่างต้องเบาพอให้ตรวจสอบได้โดยไม่ต้องเริ่ม
runtime ของ Plugin

**ใช้สำหรับ:**

- identity ของ Plugin, การตรวจสอบความถูกต้องของ config และคำใบ้ UI สำหรับ config
- metadata สำหรับ auth, onboarding และ setup (alias, auto-enable, provider env vars, ตัวเลือก auth)
- คำใบ้ activation สำหรับพื้นผิว control-plane
- ความเป็นเจ้าของ model-family แบบย่อ
- snapshot ความเป็นเจ้าของ capability แบบ static (`contracts`)
- metadata ของ QA runner ที่ host `openclaw qa` แบบ shared สามารถตรวจสอบได้
- metadata config เฉพาะ channel ที่รวมเข้ากับ catalog และพื้นผิว validation

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรม runtime, การประกาศ code entrypoints,
หรือ metadata สำหรับ npm install สิ่งเหล่านั้นอยู่ในโค้ด Plugin ของคุณและ `package.json`

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

## ตัวอย่างแบบละเอียด

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

## อ้างอิงฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น | ประเภท                             | ความหมาย                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | id ของ Plugin ตามรูปแบบบัญญัติ นี่คือ id ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                               |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบอินไลน์สำหรับ config ของ Plugin นี้                                                                                                                                                                                      |
| `enabledByDefault`                   | ไม่ใช่       | `true`                           | ทำเครื่องหมาย Plugin ที่บันเดิลมาว่าเปิดใช้งานตามค่าเริ่มต้น ละเว้น หรือกำหนดค่าใดๆ ที่ไม่ใช่ `true` เพื่อให้ Plugin ปิดใช้งานตามค่าเริ่มต้นต่อไป                                                                                                      |
| `legacyPluginIds`                    | ไม่ใช่       | `string[]`                       | id เดิมที่ปรับให้เป็น id ของ Plugin ตามรูปแบบบัญญัตินี้                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | ไม่ใช่       | `string[]`                       | id ของผู้ให้บริการที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อ auth, config หรือการอ้างอิงโมเดลกล่าวถึงผู้ให้บริการเหล่านั้น                                                                                                                                   |
| `kind`                               | ไม่ใช่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบเอกเทศที่ใช้โดย `plugins.slots.*`                                                                                                                                                                      |
| `channels`                           | ไม่ใช่       | `string[]`                       | id ของช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบ config                                                                                                                                                       |
| `providers`                          | ไม่ใช่       | `string[]`                       | id ของผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | ไม่ใช่       | `string`                         | พาธโมดูลค้นพบผู้ให้บริการแบบเบา ซึ่งสัมพันธ์กับรากของ Plugin สำหรับเมทาดาทาแค็ตตาล็อกผู้ให้บริการในขอบเขตของแมนิเฟสต์ที่โหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์ของ Plugin ทั้งหมด                                             |
| `modelSupport`                       | ไม่ใช่       | `object`                         | เมทาดาทาแบบย่อของตระกูลโมเดลที่แมนิเฟสต์เป็นเจ้าของ ใช้เพื่อโหลด Plugin อัตโนมัติก่อนรันไทม์                                                                                                                                       |
| `modelCatalog`                       | ไม่ใช่       | `object`                         | เมทาดาทาแค็ตตาล็อกโมเดลแบบประกาศสำหรับผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญา control-plane สำหรับการแสดงรายการแบบอ่านอย่างเดียว การเริ่มใช้งาน ตัวเลือกโมเดล นามแฝง และการระงับในอนาคตโดยไม่ต้องโหลดรันไทม์ของ Plugin       |
| `modelPricing`                       | ไม่ใช่       | `object`                         | นโยบายค้นหาราคาภายนอกที่ผู้ให้บริการเป็นเจ้าของ ใช้เพื่อเลือกไม่ให้ผู้ให้บริการแบบ local/โฮสต์เองอยู่ในแค็ตตาล็อกราคาระยะไกล หรือแมปการอ้างอิงผู้ให้บริการไปยัง id แค็ตตาล็อก OpenRouter/LiteLLM โดยไม่ฮาร์ดโค้ด id ผู้ให้บริการใน core           |
| `modelIdNormalization`               | ไม่ใช่       | `object`                         | การล้างนามแฝง/คำนำหน้า model-id ที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้องทำงานก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                                                         |
| `providerEndpoints`                  | ไม่ใช่       | `object[]`                       | เมทาดาทาโฮสต์/baseUrl ของ endpoint ที่แมนิเฟสต์เป็นเจ้าของสำหรับเส้นทางผู้ให้บริการที่ core ต้องจัดประเภทก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                          |
| `providerRequest`                    | ไม่ใช่       | `object`                         | เมทาดาทาตระกูลผู้ให้บริการและความเข้ากันได้ของคำขอแบบประหยัดที่ใช้โดยนโยบายคำขอทั่วไปก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                            |
| `cliBackends`                        | ไม่ใช่       | `string[]`                       | id ของแบ็กเอนด์การอนุมาน CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติเมื่อเริ่มต้นจากการอ้างอิง config ที่ระบุชัดเจน                                                                                                                       |
| `syntheticAuthRefs`                  | ไม่ใช่       | `string[]`                       | การอ้างอิงผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ควรตรวจสอบฮุก synthetic auth ที่ Plugin เป็นเจ้าของระหว่างการค้นพบโมเดลแบบ cold ก่อนโหลดรันไทม์                                                                                            |
| `nonSecretAuthMarkers`               | ไม่ใช่       | `string[]`                       | ค่า API key แบบ placeholder ที่ Plugin ที่บันเดิลมาเป็นเจ้าของ ซึ่งแทนสถานะข้อมูลประจำตัวแบบไม่เป็นความลับ, local, OAuth หรือ ambient                                                                                                              |
| `commandAliases`                     | ไม่ใช่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการวินิจฉัย config และ CLI ที่รับรู้ Plugin ก่อนโหลดรันไทม์                                                                                                              |
| `providerAuthEnvVars`                | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env เพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับการค้นหา auth/status ของผู้ให้บริการ แนะนำให้ใช้ `setup.providers[].envVars` สำหรับ Plugin ใหม่; OpenClaw ยังอ่านค่านี้ระหว่างช่วงเลิกใช้                                               |
| `providerAuthAliases`                | ไม่ใช่       | `Record<string, string>`         | id ของผู้ให้บริการที่ควรใช้ id ของผู้ให้บริการอื่นซ้ำสำหรับการค้นหา auth เช่น ผู้ให้บริการสำหรับการเขียนโค้ดที่ใช้ API key และโปรไฟล์ auth ของผู้ให้บริการพื้นฐานร่วมกัน                                                                        |
| `channelEnvVars`                     | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env ของช่องทางแบบประหยัดที่ OpenClaw ตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้ค่านี้สำหรับการตั้งค่าช่องทางหรือพื้นผิว auth ที่ขับเคลื่อนด้วย env ซึ่งตัวช่วยเริ่มต้น/config ทั่วไปควรมองเห็น                                          |
| `providerAuthChoices`                | ไม่ใช่       | `object[]`                       | เมทาดาทาตัวเลือก auth แบบประหยัดสำหรับตัวเลือกการเริ่มใช้งาน การแก้ไขผู้ให้บริการที่ต้องการ และการเชื่อมสายแฟล็ก CLI แบบง่าย                                                                                                                     |
| `activation`                         | ไม่ใช่       | `object`                         | เมทาดาทาแผนการเปิดใช้งานแบบประหยัดสำหรับการโหลดที่ทริกเกอร์โดยการเริ่มต้น ผู้ให้บริการ คำสั่ง ช่องทาง เส้นทาง และ capability เป็นเพียงเมทาดาทาเท่านั้น; รันไทม์ของ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                                                     |
| `setup`                              | ไม่ใช่       | `object`                         | ตัวบรรยายการตั้งค่า/การเริ่มใช้งานแบบประหยัดที่พื้นผิวการค้นพบและการตั้งค่าสามารถตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ของ Plugin                                                                                                                  |
| `qaRunners`                          | ไม่ใช่       | `object[]`                       | ตัวบรรยาย QA runner แบบประหยัดที่ใช้โดยโฮสต์ `openclaw qa` ร่วมก่อนโหลดรันไทม์ของ Plugin                                                                                                                                    |
| `contracts`                          | ไม่ใช่       | `object`                         | สแนปช็อต capability แบบคงที่ที่บันเดิลมาสำหรับฮุก auth ภายนอก, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่ใช่       | `Record<string, object>`         | ค่าเริ่มต้น media-understanding แบบประหยัดสำหรับ id ผู้ให้บริการที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                          |
| `channelConfigs`                     | ไม่ใช่       | `Record<string, object>`         | เมทาดาทา config ของช่องทางที่แมนิเฟสต์เป็นเจ้าของ ซึ่งรวมเข้าในพื้นผิวการค้นพบและการตรวจสอบก่อนโหลดรันไทม์                                                                                                                        |
| `skills`                             | ไม่ใช่       | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด ซึ่งสัมพันธ์กับรากของ Plugin                                                                                                                                                                           |
| `name`                               | ไม่ใช่       | `string`                         | ชื่อ Plugin ที่มนุษย์อ่านได้                                                                                                                                                                                                       |
| `description`                        | ไม่ใช่       | `string`                         | สรุปสั้นๆ ที่แสดงในพื้นผิว Plugin                                                                                                                                                                                           |
| `version`                            | ไม่ใช่       | `string`                         | เวอร์ชัน Plugin เพื่อให้ข้อมูล                                                                                                                                                                                                     |
| `uiHints`                            | ไม่ใช่       | `Record<string, object>`         | ป้ายกำกับ UI, placeholder และคำใบ้ความอ่อนไหวสำหรับฟิลด์ config                                                                                                                                                                 |

## เอกสารอ้างอิง providerAuthChoices

แต่ละรายการ `providerAuthChoices` อธิบายตัวเลือกการเริ่มใช้งานหรือ auth หนึ่งรายการ
OpenClaw อ่านค่านี้ก่อนโหลดรันไทม์ของผู้ให้บริการ
รายการการตั้งค่าผู้ให้บริการใช้ตัวเลือกจากแมนิเฟสต์เหล่านี้ ตัวเลือกการตั้งค่าที่ได้จากตัวบรรยาย
และเมทาดาทาแค็ตตาล็อกการติดตั้งโดยไม่โหลดรันไทม์ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ชนิด                                            | ความหมาย                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | รหัสผู้ให้บริการที่ตัวเลือกนี้สังกัดอยู่                                                                      |
| `method`              | ใช่      | `string`                                        | รหัสวิธีการตรวจสอบสิทธิ์ที่จะส่งต่อไปให้                                                                           |
| `choiceId`            | ใช่      | `string`                                        | รหัสตัวเลือกการตรวจสอบสิทธิ์แบบคงที่ที่ใช้โดยขั้นตอนเริ่มต้นใช้งานและโฟลว์ CLI                                                  |
| `choiceLabel`         | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละไว้ OpenClaw จะใช้ `choiceId` แทน                                        |
| `choiceHint`          | ไม่       | `string`                                        | ข้อความช่วยเหลือแบบสั้นสำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่       | `number`                                        | ค่าที่ต่ำกว่าจะถูกเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดยผู้ช่วย                                       |
| `assistantVisibility` | ไม่       | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกจากตัวเลือกของผู้ช่วย แต่ยังอนุญาตให้เลือกด้วย CLI แบบแมนนวลได้                        |
| `deprecatedChoiceIds` | ไม่       | `string[]`                                      | รหัสตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้ไปยังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่       | `string`                                        | รหัสกลุ่มแบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                                          |
| `groupLabel`          | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่       | `string`                                        | ข้อความช่วยเหลือแบบสั้นสำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่       | `string`                                        | คีย์ตัวเลือกภายในสำหรับโฟลว์การตรวจสอบสิทธิ์แบบแฟล็กเดียวอย่างง่าย                                                      |
| `cliFlag`             | ไม่       | `string`                                        | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่       | `string`                                        | รูปแบบตัวเลือก CLI แบบเต็ม เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่       | `string`                                        | คำอธิบายที่ใช้ในข้อความช่วยเหลือของ CLI                                                                            |
| `onboardingScopes`    | ไม่       | `Array<"text-inference" \| "image-generation">` | พื้นผิวขั้นตอนเริ่มต้นใช้งานที่ตัวเลือกนี้ควรปรากฏ หากละไว้ ค่าเริ่มต้นคือ `["text-inference"]` |

## ข้อมูลอ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ใน `plugins.allow` โดยเข้าใจผิด หรือพยายามเรียกใช้เป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้เมทาดาทานี้สำหรับการวินิจฉัยโดยไม่ต้องนำเข้าโค้ดรันไทม์ของ Plugin

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

| ฟิลด์        | จำเป็น | ชนิด              | ความหมาย                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | ใช่      | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                               |
| `kind`       | ไม่       | `"runtime-slash"` | ทำเครื่องหมายนามแฝงว่าเป็นคำสั่งสแลชในแชต ไม่ใช่คำสั่ง CLI ระดับราก |
| `cliCommand` | ไม่       | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องเพื่อแนะนำสำหรับการดำเนินการ CLI หากมี  |

## ข้อมูลอ้างอิง activation

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด

บล็อกนี้เป็นเมทาดาทาสำหรับตัววางแผน ไม่ใช่ API วงจรชีวิต บล็อกนี้ไม่ลงทะเบียน
พฤติกรรมรันไทม์ ไม่แทนที่ `register(...)` และไม่รับประกันว่า
โค้ด Plugin ได้ทำงานแล้ว ตัววางแผนการเปิดใช้งานใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ที่เป็นตัวเลือก ก่อนถอยกลับไปใช้เมทาดาทาความเป็นเจ้าของใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

เลือกใช้เมทาดาทาที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของอยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, ตัวอธิบายการตั้งค่า หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์ได้ ใช้ `activation` สำหรับคำใบ้ตัววางแผนเพิ่มเติม
ที่ไม่สามารถแทนด้วยฟิลด์ความเป็นเจ้าของเหล่านั้นได้
ใช้ `cliBackends` ระดับบนสุดสำหรับนามแฝงรันไทม์ CLI เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้เฉพาะสำหรับ
รหัส agent harness แบบฝังตัวที่ยังไม่มีฟิลด์ความเป็นเจ้าของอยู่แล้ว

บล็อกนี้เป็นเมทาดาทาเท่านั้น บล็อกนี้ไม่ลงทะเบียนพฤติกรรมรันไทม์ และไม่
แทนที่ `register(...)`, `setupEntry` หรือจุดเริ่มต้นรันไทม์/Plugin อื่น ๆ
ผู้ใช้ปัจจุบันใช้เป็นคำใบ้เพื่อจำกัดขอบเขตก่อนโหลด Plugin ในวงกว้างขึ้น ดังนั้น
เมทาดาทาการเปิดใช้งานที่ขาดไปโดยปกติมักมีผลต่อประสิทธิภาพเท่านั้น ไม่ควร
เปลี่ยนความถูกต้องตราบใดที่ fallback ความเป็นเจ้าของ manifest แบบเดิมยังมีอยู่

ทุก Plugin ควรตั้งค่า `activation.onStartup` อย่างตั้งใจเมื่อ OpenClaw กำลังย้ายออก
จากการนำเข้าเมื่อเริ่มต้นโดยนัย ตั้งค่าเป็น `true` เฉพาะเมื่อ Plugin ต้อง
ทำงานระหว่างการเริ่มต้น Gateway ตั้งค่าเป็น `false` เมื่อ Plugin ไม่ทำงานในช่วง
เริ่มต้นและควรโหลดจากตัวกระตุ้นที่แคบกว่าเท่านั้น การละ `onStartup` ไว้จะคง
fallback sidecar การเริ่มต้นโดยนัยแบบเดิมที่เลิกใช้แล้วสำหรับ Plugin ที่ไม่มี
เมทาดาทาความสามารถแบบคงที่ เวอร์ชันในอนาคตอาจหยุดโหลด Plugin เหล่านั้นตอนเริ่มต้น
เว้นแต่จะประกาศ `activation.onStartup: true` รายงานสถานะและความเข้ากันได้ของ
Plugin จะเตือนด้วย `legacy-implicit-startup-sidecar` เมื่อ Plugin ยังพึ่งพา
fallback นั้นอยู่

สำหรับการทดสอบการย้าย ให้ตั้งค่า
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` เพื่อปิดใช้งานเฉพาะ
fallback ที่เลิกใช้แล้วนั้น โหมดเลือกใช้นี้ไม่บล็อก Plugin ที่มี
`activation.onStartup: true` อย่างชัดเจน หรือ Plugin ที่โหลดโดยช่องทาง, คอนฟิก,
agent-harness, หน่วยความจำ หรือตัวกระตุ้นการเปิดใช้งานอื่นที่แคบกว่า

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| ฟิลด์              | จำเป็น | ชนิด                                                 | ความหมาย                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | ไม่       | `boolean`                                            | การเปิดใช้งานตอนเริ่มต้น Gateway แบบชัดเจน ทุก Plugin ควรตั้งค่านี้ `true` จะนำเข้า Plugin ระหว่างการเริ่มต้น; `false` จะไม่ใช้ fallback sidecar การเริ่มต้นโดยนัยที่เลิกใช้แล้ว เว้นแต่ตัวกระตุ้นอื่นที่ตรงกันต้องการให้โหลด |
| `onProviders`      | ไม่       | `string[]`                                           | รหัสผู้ให้บริการที่ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                                                                                                                                             |
| `onAgentHarnesses` | ไม่       | `string[]`                                           | รหัสรันไทม์ agent harness แบบฝังตัวที่ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด ใช้ `cliBackends` ระดับบนสุดสำหรับนามแฝง backend ของ CLI                                                                                  |
| `onCommands`       | ไม่       | `string[]`                                           | รหัสคำสั่งที่ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                                                                                                                                              |
| `onChannels`       | ไม่       | `string[]`                                           | รหัสช่องทางที่ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                                                                                                                                              |
| `onRoutes`         | ไม่       | `string[]`                                           | ชนิดเส้นทางที่ควรรวม Plugin นี้ไว้ในแผนการเปิดใช้งาน/โหลด                                                                                                                                                              |
| `onConfigPaths`    | ไม่       | `string[]`                                           | เส้นทางคอนฟิกแบบสัมพัทธ์กับรากที่ควรรวม Plugin นี้ไว้ในแผนการเริ่มต้น/โหลดเมื่อมีเส้นทางนั้นอยู่และไม่ได้ถูกปิดใช้งานอย่างชัดเจน                                                                                             |
| `onCapabilities`   | ไม่       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ความสามารถแบบกว้างที่ใช้โดยการวางแผนการเปิดใช้งานของ control-plane ควรใช้ฟิลด์ที่แคบกว่าเมื่อเป็นไปได้                                                                                                                            |

ผู้ใช้จริงปัจจุบัน:

- การวางแผนการเริ่มต้น Gateway ใช้ `activation.onStartup` สำหรับการนำเข้าเมื่อเริ่มต้น
  แบบชัดเจนและการเลือกไม่ใช้ fallback sidecar การเริ่มต้นโดยนัยที่เลิกใช้แล้ว
- การวางแผน CLI ที่ถูกกระตุ้นด้วยคำสั่งจะถอยกลับไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- การวางแผนการเริ่มต้น agent-runtime ใช้ `activation.onAgentHarnesses` สำหรับ
  harness แบบฝังตัว และใช้ `cliBackends[]` ระดับบนสุดสำหรับนามแฝงรันไทม์ CLI
- การวางแผนการตั้งค่า/ช่องทางที่ถูกกระตุ้นด้วยช่องทางจะถอยกลับไปใช้ความเป็นเจ้าของ
  `channels[]` แบบเดิมเมื่อเมทาดาทาการเปิดใช้งานช่องทางแบบชัดเจนขาดไป
- การวางแผน Plugin ตอนเริ่มต้นใช้ `activation.onConfigPaths` สำหรับพื้นผิวคอนฟิก
  ระดับรากที่ไม่ใช่ช่องทาง เช่นบล็อก `browser` ของ Plugin เบราว์เซอร์ที่รวมมา
- การวางแผนการตั้งค่า/รันไทม์ที่ถูกกระตุ้นด้วยผู้ให้บริการจะถอยกลับไปใช้ความเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบเดิมเมื่อเมทาดาทาการเปิดใช้งาน
  ผู้ให้บริการแบบชัดเจนขาดไป

การวินิจฉัยของตัววางแผนสามารถแยกคำใบ้การเปิดใช้งานแบบชัดเจนออกจาก fallback
ความเป็นเจ้าของ manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายความว่า
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายความว่า
ตัววางแผนใช้ความเป็นเจ้าของ `commandAliases` แทน ป้ายเหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยของโฮสต์และการทดสอบ ผู้เขียน Plugin ควรประกาศเมทาดาทา
ที่อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง qaRunners

ใช้ `qaRunners` เมื่อ Plugin มีส่วนเพิ่มตัวรันการขนส่งอย่างน้อยหนึ่งรายการใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน รักษาเมทาดาทานี้ให้ประหยัดและเป็นแบบคงที่; รันไทม์ของ Plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว
`runtime-api.ts` แบบเบาที่ส่งออก `qaRunnerCliRegistrations`

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

| ฟิลด์         | จำเป็น | ประเภท     | ความหมาย                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | ใช่      | `string` | คำสั่งย่อยที่เมาต์อยู่ใต้ `openclaw qa` เช่น `matrix`    |
| `description` | ไม่       | `string` | ข้อความช่วยเหลือสำรองที่ใช้เมื่อโฮสต์ที่ใช้ร่วมกันต้องการคำสั่งแบบ stub |

## ข้อมูลอ้างอิง setup

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการเมทาดาทาราคาถูกที่ Plugin เป็นเจ้าของ
ก่อนโหลด runtime

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังอธิบาย backend สำหรับการอนุมานของ CLI ต่อไป
`setup.cliBackends` คือพื้นผิว descriptor เฉพาะ setup สำหรับ
โฟลว์ control-plane/setup ที่ควรคงเป็นเมทาดาทาเท่านั้น

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็นพื้นผิวการค้นหาแบบ
descriptor-first ที่แนะนำสำหรับการค้นพบ setup หาก descriptor แคบลงเฉพาะ
Plugin ผู้สมัครเท่านั้น และ setup ยังต้องการ hook runtime ขณะ setup ที่สมบูรณ์กว่า
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็น
เส้นทางการดำเนินการสำรอง

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหา auth ของ provider และ
env-var ทั่วไปด้วย `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility
adapter ในช่วง deprecation window แต่ Plugin ที่ไม่ใช่ bundled ซึ่งยังใช้สิ่งนี้
จะได้รับ diagnostic ของ manifest Plugin ใหม่ควรวางเมทาดาทา env สำหรับ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup แบบง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มีรายการ setup หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้ runtime ของ setup รายการ `providerAuthChoices` แบบชัดเจนยังคง
เป็นตัวเลือกที่แนะนำสำหรับป้ายกำกับแบบกำหนดเอง, แฟล็ก CLI, ขอบเขต onboarding และเมทาดาทาของ assistant

ตั้ง `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw ถือว่า `false` แบบชัดเจนเป็นสัญญาแบบ descriptor-only
และจะไม่ดำเนินการ `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
Plugin แบบ descriptor-only ยังส่ง runtime entry ของ setup รายการใดรายการหนึ่งเหล่านั้นมาด้วย
OpenClaw จะรายงาน diagnostic แบบเติมเพิ่มและยังคงเพิกเฉยต่อรายการนั้นต่อไป การละ
`requiresRuntime` ไว้จะคงพฤติกรรม fallback แบบ legacy เพื่อไม่ให้ Plugin ที่มีอยู่ซึ่งเพิ่ม
descriptor โดยไม่มีแฟล็กเสียหาย

เนื่องจากการค้นหา setup สามารถดำเนินการโค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้ ค่า
`setup.providers[].id` และ `setup.cliBackends[]` ที่ normalized แล้วต้องไม่ซ้ำกันทั่วทั้ง
Plugin ที่ค้นพบ การเป็นเจ้าของที่กำกวมจะ fail closed แทนที่จะเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อ runtime ของ setup ดำเนินการจริง diagnostic ของ registry setup จะรายงาน descriptor
drift หาก `setup-api` ลงทะเบียน provider หรือ backend ของ CLI ที่ manifest
descriptor ไม่ได้ประกาศไว้ หรือหาก descriptor ไม่มี runtime
registration ที่ตรงกัน diagnostic เหล่านี้เป็นแบบเติมเพิ่มและไม่ปฏิเสธ Plugin แบบ legacy

### ข้อมูลอ้างอิง setup.providers

| ฟิลด์          | จำเป็น | ประเภท       | ความหมาย                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่      | `string`   | id ของ provider ที่เปิดเผยระหว่าง setup หรือ onboarding เก็บ id ที่ normalized ให้ไม่ซ้ำกันทั่วระบบ             |
| `authMethods`  | ไม่       | `string[]` | id ของเมธอด setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลด runtime เต็ม                       |
| `envVars`      | ไม่       | `string[]` | ตัวแปร env ที่พื้นผิว setup/status ทั่วไปสามารถตรวจสอบได้ก่อนโหลด runtime ของ Plugin               |
| `authEvidence` | ไม่       | `object[]` | การตรวจสอบหลักฐาน auth ภายในเครื่องราคาถูกสำหรับ provider ที่สามารถ authenticate ผ่าน marker ที่ไม่ใช่ความลับ |

`authEvidence` ใช้สำหรับ marker ของ credential ภายในเครื่องที่ provider เป็นเจ้าของ ซึ่งสามารถ
ตรวจสอบได้โดยไม่ต้องโหลดโค้ด runtime การตรวจสอบเหล่านี้ต้องยังคงราคาถูกและเป็น local:
ไม่มีการเรียกเครือข่าย, ไม่มีการอ่าน keychain หรือ secret-manager, ไม่มีคำสั่ง shell และไม่มี
การ probe API ของ provider

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่       | `string`   | ตัวแปร env ที่มี path ไฟล์ credential แบบชัดเจน                                                           |
| `fallbackPaths`    | ไม่       | `string[]` | path ไฟล์ credential ภายในเครื่องที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีอยู่หรือว่างเปล่า รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่       | `string[]` | ต้องมีตัวแปร env อย่างน้อยหนึ่งรายการในรายการที่ไม่ว่างเปล่าก่อนที่หลักฐานจะ valid                                    |
| `requiresAllEnv`   | ไม่       | `string[]` | ตัวแปร env ทุกตัวในรายการต้องไม่ว่างเปล่าก่อนที่หลักฐานจะ valid                                           |
| `credentialMarker` | ใช่      | `string`   | marker ที่ไม่ใช่ความลับซึ่งส่งคืนเมื่อมีหลักฐาน                                                       |
| `source`           | ไม่       | `string`   | ป้ายกำกับ source ที่แสดงต่อผู้ใช้สำหรับ output ของ auth/status                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่       | `object[]` | descriptor ของ setup สำหรับ provider ที่เปิดเผยระหว่าง setup และ onboarding                                     |
| `cliBackends`      | ไม่       | `string[]` | id ของ backend ขณะ setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first เก็บ id ที่ normalized ให้ไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่       | `string[]` | id ของการ migration config ที่พื้นผิว setup ของ Plugin นี้เป็นเจ้าของ                                          |
| `requiresRuntime`  | ไม่       | `boolean`  | setup ยังต้องการการดำเนินการ `setup-api` หลังการค้นหา descriptor หรือไม่                            |

## ข้อมูลอ้างอิง uiHints

`uiHints` คือ map จากชื่อฟิลด์ config ไปยัง hint การเรนเดอร์ขนาดเล็ก

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

hint ของแต่ละฟิลด์สามารถมี:

| ฟิลด์         | ประเภท       | ความหมาย                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ป้ายกำกับฟิลด์ที่แสดงต่อผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือสั้นๆ                      |
| `tags`        | `string[]` | แท็ก UI ที่เป็นทางเลือก                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นความลับหรือ sensitive |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับ input ของฟอร์ม       |

## ข้อมูลอ้างอิง contracts

ใช้ `contracts` เฉพาะสำหรับเมทาดาทาการเป็นเจ้าของ capability แบบ static ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้อง import runtime ของ Plugin

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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

แต่ละรายการเป็นทางเลือก:

| ฟิลด์                            | ประเภท       | ความหมาย                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id ของ extension factory ของ app-server ของ Codex ปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | id ของ runtime ที่ Plugin แบบ bundled อาจลงทะเบียน middleware ของ tool-result ให้ |
| `externalAuthProviders`          | `string[]` | id ของ provider ที่ Plugin นี้เป็นเจ้าของ hook ของ external auth profile       |
| `speechProviders`                | `string[]` | id ของ speech provider ที่ Plugin นี้เป็นเจ้าของ                                 |
| `realtimeTranscriptionProviders` | `string[]` | id ของ realtime-transcription provider ที่ Plugin นี้เป็นเจ้าของ                 |
| `realtimeVoiceProviders`         | `string[]` | id ของ realtime-voice provider ที่ Plugin นี้เป็นเจ้าของ                         |
| `memoryEmbeddingProviders`       | `string[]` | id ของ memory embedding provider ที่ Plugin นี้เป็นเจ้าของ                       |
| `mediaUnderstandingProviders`    | `string[]` | id ของ media-understanding provider ที่ Plugin นี้เป็นเจ้าของ                    |
| `imageGenerationProviders`       | `string[]` | id ของ image-generation provider ที่ Plugin นี้เป็นเจ้าของ                       |
| `videoGenerationProviders`       | `string[]` | id ของ video-generation provider ที่ Plugin นี้เป็นเจ้าของ                       |
| `webFetchProviders`              | `string[]` | id ของ Web-fetch provider ที่ Plugin นี้เป็นเจ้าของ                              |
| `webSearchProviders`             | `string[]` | id ของ Web-search provider ที่ Plugin นี้เป็นเจ้าของ                             |
| `migrationProviders`             | `string[]` | id ของ import provider ที่ Plugin นี้เป็นเจ้าของสำหรับ `openclaw migrate`          |
| `tools`                          | `string[]` | ชื่อเครื่องมือ agent ที่ Plugin นี้เป็นเจ้าของสำหรับการตรวจสอบ contract แบบ bundled        |

`contracts.embeddedExtensionFactories` ถูกคงไว้สำหรับ factory ของ extension เฉพาะ app-server
ของ Codex แบบ bundled การแปลง tool-result แบบ bundled ควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน Plugin ภายนอกไม่สามารถ
ลงทะเบียน middleware ของ tool-result ได้ เพราะ seam สามารถเขียน output ของเครื่องมือที่มีความน่าเชื่อถือสูงใหม่ได้
ก่อนที่ model จะเห็น

Plugin ของ provider ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugin ที่ไม่มีการประกาศยังคงทำงาน
ผ่าน compatibility fallback ที่ deprecated แล้ว แต่ fallback นั้นช้ากว่าและ
จะถูกลบออกหลัง migration window

provider สำหรับ memory embedding แบบ bundled ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับ id ของ adapter ทุกตัวที่เปิดเผย รวมถึง
adapter ในตัว เช่น `local` path ของ CLI แบบ standalone ใช้ contract ของ manifest นี้
เพื่อโหลดเฉพาะ Plugin เจ้าของก่อนที่ runtime ของ Gateway เต็มรูปแบบจะ
ลงทะเบียน provider

## ข้อมูลอ้างอิง mediaUnderstandingProviderMetadata

ใช้ `mediaUnderstandingProviderMetadata` เมื่อผู้ให้บริการด้านการทำความเข้าใจสื่อมี
โมเดลเริ่มต้น ลำดับความสำคัญของ fallback สำหรับการยืนยันตัวตนอัตโนมัติ หรือการรองรับเอกสารแบบเนทีฟที่
ตัวช่วย core ทั่วไปต้องใช้ก่อนโหลด runtime คีย์ต้องประกาศไว้ใน
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

แต่ละรายการผู้ให้บริการสามารถมี:

| ฟิลด์                  | ประเภท                              | ความหมาย                                                                     |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | ความสามารถด้านสื่อที่ผู้ให้บริการนี้เปิดเผย                                  |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นของความสามารถต่อโมเดลที่ใช้เมื่อ config ไม่ได้ระบุโมเดล          |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะถูกจัดเรียงก่อนสำหรับ fallback ผู้ให้บริการตามข้อมูลรับรองอัตโนมัติ |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบเนทีฟที่ผู้ให้บริการรองรับ                                   |

## อ้างอิง channelConfigs

ใช้ `channelConfigs` เมื่อ Plugin ช่องทางต้องใช้ metadata ของ config แบบเบาก่อน
โหลด runtime การค้นหาการตั้งค่า/สถานะช่องทางแบบอ่านอย่างเดียวสามารถใช้ metadata นี้
ได้โดยตรงสำหรับช่องทางภายนอกที่ตั้งค่าไว้เมื่อไม่มีรายการตั้งค่าให้ใช้ หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่า runtime สำหรับการตั้งค่าไม่จำเป็น

`channelConfigs` เป็น metadata ของ manifest ของ Plugin ไม่ใช่ส่วน config ผู้ใช้ระดับบนสุด
แบบใหม่ ผู้ใช้ยังคงตั้งค่าอินสแตนซ์ช่องทางใต้ `channels.<channel-id>`
OpenClaw อ่าน metadata ของ manifest เพื่อตัดสินว่า Plugin ใดเป็นเจ้าของช่องทางที่ตั้งค่าไว้
ก่อนโค้ด runtime ของ Plugin ทำงาน

สำหรับ Plugin ช่องทาง `configSchema` และ `channelConfigs` อธิบาย
เส้นทางที่ต่างกัน:

- `configSchema` ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบ `channels.<channel-id>`

Plugin ที่ไม่ได้บันเดิลซึ่งประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มีรายการเหล่านี้ OpenClaw ยังโหลด Plugin ได้ แต่
schema ของ config ใน cold-path, การตั้งค่า และพื้นผิว Control UI จะไม่สามารถรู้
รูปทรงตัวเลือกที่ช่องทางเป็นเจ้าของได้จนกว่า runtime ของ Plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้น `auto` แบบคงที่สำหรับการตรวจสอบ config คำสั่ง
ที่ทำงานก่อนโหลด runtime ของช่องทาง ช่องทางที่บันเดิลยังสามารถเผยแพร่
ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
metadata แค็ตตาล็อกช่องทางอื่นที่แพ็กเกจเป็นเจ้าของ

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

แต่ละรายการช่องทางสามารถมี:

| ฟิลด์         | ประเภท                   | ความหมาย                                                                                  |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการ config ช่องทางที่ประกาศไว้    |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ UI/placeholder/คำใบ้ข้อมูลอ่อนไหวที่ไม่บังคับสำหรับส่วน config ของช่องทางนั้น |
| `label`       | `string`                 | ป้ายกำกับช่องทางที่รวมเข้าในพื้นผิว picker และ inspect เมื่อ metadata runtime ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายช่องทางแบบสั้นสำหรับพื้นผิว inspect และ catalog                                  |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติของคำสั่งเนทีฟและ native skill แบบคงที่สำหรับการตรวจสอบ config ก่อน runtime |
| `preferOver`  | `string[]`               | id ของ Plugin แบบเก่าหรือลำดับความสำคัญต่ำกว่าที่ช่องทางนี้ควรอยู่เหนือกว่าในพื้นผิวการเลือก |

### การแทนที่ Plugin ช่องทางอื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับ id ช่องทางที่
Plugin อื่นก็สามารถให้บริการได้ กรณีทั่วไปคือ id ของ Plugin ที่เปลี่ยนชื่อ,
Plugin แบบสแตนด์อโลนที่แทนที่ Plugin ที่บันเดิล หรือ fork ที่มีผู้ดูแลซึ่ง
คง id ช่องทางเดิมไว้เพื่อความเข้ากันได้ของ config

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

เมื่อมีการตั้งค่า `channels.chat` OpenClaw จะพิจารณาทั้ง id ช่องทางและ
id ของ Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
เป็นแบบบันเดิลหรือเปิดใช้ตามค่าเริ่มต้น OpenClaw จะปิดใช้งาน Plugin นั้นใน config
runtime ที่มีผล เพื่อให้ Plugin หนึ่งตัวเป็นเจ้าของช่องทางและเครื่องมือของช่องทางนั้น การเลือกของผู้ใช้
แบบชัดเจนยังคงมีผลเหนือกว่า: หากผู้ใช้เปิดใช้ทั้งสอง Plugin อย่างชัดเจน OpenClaw
จะรักษาตัวเลือกนั้นไว้และรายงานการวินิจฉัยช่องทาง/เครื่องมือซ้ำแทนการ
เปลี่ยนชุด Plugin ที่ร้องขอแบบเงียบ ๆ

จำกัดขอบเขต `preferOver` ไว้กับ id ของ Plugin ที่สามารถให้บริการช่องทางเดียวกันได้จริง
สิ่งนี้ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อคีย์ config ของผู้ใช้

## อ้างอิง modelSupport

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin ผู้ให้บริการของคุณจาก
id โมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนโหลด runtime
ของ Plugin

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญนี้:

- refs แบบ `provider/model` ที่ชัดเจนจะใช้ metadata ของ manifest `providers` ที่เป็นเจ้าของ
- `modelPatterns` ชนะ `modelPrefixes`
- หาก Plugin ที่ไม่ได้บันเดิลหนึ่งตัวและ Plugin ที่บันเดิลหนึ่งตัวตรงกันทั้งคู่ Plugin ที่ไม่ได้บันเดิล
  จะชนะ
- ความกำกวมที่เหลือจะถูกละไว้จนกว่าผู้ใช้หรือ config จะระบุผู้ให้บริการ

ฟิลด์:

| ฟิลด์           | ประเภท     | ความหมาย                                                                      |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | prefix ที่จับคู่ด้วย `startsWith` กับ id โมเดลแบบย่อ                         |
| `modelPatterns` | `string[]` | source ของ regex ที่จับคู่กับ id โมเดลแบบย่อหลังลบ suffix ของโปรไฟล์ออกแล้ว |

## อ้างอิง modelCatalog

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้ metadata โมเดลของผู้ให้บริการก่อน
โหลด runtime ของ Plugin นี่คือแหล่งที่ manifest เป็นเจ้าของสำหรับแถว catalog
แบบคงที่, alias ของผู้ให้บริการ, กฎการซ่อน และโหมดการค้นพบ การรีเฟรช runtime
ยังคงอยู่ในโค้ด runtime ของผู้ให้บริการ แต่ manifest จะบอก core ว่าเมื่อใดจำเป็นต้องใช้ runtime

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

| ฟิลด์          | ประเภท                                                   | ความหมาย                                                                                                  |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | แถว catalog สำหรับ id ผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย    |
| `aliases`      | `Record<string, object>`                                 | alias ของผู้ให้บริการที่ควร resolve ไปยังผู้ให้บริการที่เป็นเจ้าของเพื่อการวางแผน catalog หรือ suppression |
| `suppressions` | `object[]`                                               | แถวโมเดลจากแหล่งอื่นที่ Plugin นี้ซ่อนไว้ด้วยเหตุผลเฉพาะผู้ให้บริการ                                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ระบุว่า catalog ของผู้ให้บริการอ่านได้จาก metadata ของ manifest, รีเฟรชเข้า cache ได้ หรือต้องใช้ runtime |

`aliases` มีส่วนในการค้นหาความเป็นเจ้าของผู้ให้บริการสำหรับการวางแผน model-catalog
เป้าหมาย alias ต้องเป็นผู้ให้บริการระดับบนสุดที่ Plugin เดียวกันเป็นเจ้าของ เมื่อรายการ
ที่กรองตามผู้ให้บริการใช้ alias OpenClaw สามารถอ่าน manifest เจ้าของและ
นำ API/base URL override ของ alias มาใช้โดยไม่ต้องโหลด runtime ของผู้ให้บริการ
Aliases จะไม่ขยายรายการ catalog ที่ไม่ได้กรอง; รายการแบบกว้างจะแสดงเฉพาะแถว
ผู้ให้บริการ canonical ที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ hook `suppressBuiltInModel` ของ runtime ผู้ให้บริการแบบเก่า
รายการ suppression จะถูกเคารพเฉพาะเมื่อผู้ให้บริการเป็นของ Plugin หรือ
ประกาศเป็นคีย์ `modelCatalog.aliases` ที่ชี้ไปยังผู้ให้บริการที่เป็นเจ้าของ hook
suppression ของ runtime จะไม่ถูกเรียกระหว่างการ resolve โมเดลอีกต่อไป

ฟิลด์ของผู้ให้บริการ:

| ฟิลด์     | ประเภท                   | ความหมาย                                                         |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL เริ่มต้นที่ไม่บังคับสำหรับโมเดลใน catalog ผู้ให้บริการนี้ |
| `api`     | `ModelApi`               | adapter API เริ่มต้นที่ไม่บังคับสำหรับโมเดลใน catalog ผู้ให้บริการนี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่ไม่บังคับซึ่งใช้กับ catalog ผู้ให้บริการนี้    |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละไว้                    |

ฟิลด์ของโมเดล:

| ฟิลด์           | ประเภท                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | รหัสโมเดลภายในผู้ให้บริการ โดยไม่มีคำนำหน้า `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่ใช้แสดงผลแบบไม่บังคับ                                                      |
| `api`           | `ModelApi`                                                     | การแทนที่ API ต่อโมเดลแบบไม่บังคับ                                            |
| `baseUrl`       | `string`                                                       | การแทนที่ URL ฐานต่อโมเดลแบบไม่บังคับ                                       |
| `headers`       | `Record<string, string>`                                       | ส่วนหัวแบบคงที่ต่อโมเดลแบบไม่บังคับ                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | รูปแบบข้อมูลที่โมเดลยอมรับ                                               |
| `reasoning`     | `boolean`                                                      | โมเดลเปิดเผยพฤติกรรมการให้เหตุผลหรือไม่                               |
| `contextWindow` | `number`                                                       | หน้าต่างบริบทดั้งเดิมของผู้ให้บริการ                                             |
| `contextTokens` | `number`                                                       | เพดานบริบทรันไทม์ที่มีผลแบบไม่บังคับ เมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวนโทเค็นเอาต์พุตสูงสุดเมื่อทราบค่า                                           |
| `cost`          | `object`                                                       | ราคาต่อหนึ่งล้านโทเค็นเป็น USD แบบไม่บังคับ รวมถึง `tieredPricing` แบบไม่บังคับ |
| `compat`        | `object`                                                       | แฟล็กความเข้ากันได้แบบไม่บังคับที่ตรงกับความเข้ากันได้ของการกำหนดค่าโมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะรายการ ระงับเฉพาะเมื่อแถวนั้นต้องไม่ปรากฏเลย          |
| `statusReason`  | `string`                                                       | เหตุผลแบบไม่บังคับที่แสดงพร้อมสถานะที่ไม่พร้อมใช้งาน                            |
| `replaces`      | `string[]`                                                     | รหัสโมเดลภายในผู้ให้บริการรุ่นเก่าที่โมเดลนี้เข้ามาแทนที่                       |
| `replacedBy`    | `string`                                                       | รหัสโมเดลภายในผู้ให้บริการที่ใช้แทนสำหรับแถวที่เลิกใช้แล้ว                    |
| `tags`          | `string[]`                                                     | แท็กที่เสถียรซึ่งใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์การระงับ:

| ฟิลด์                      | ประเภท       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | รหัสผู้ให้บริการสำหรับแถวต้นทางที่จะระงับ ต้องเป็นของ Plugin นี้หรือประกาศเป็นนามแฝงที่เป็นเจ้าของ |
| `model`                    | `string`   | รหัสโมเดลภายในผู้ให้บริการที่จะระงับ                                                                      |
| `reason`                   | `string`   | ข้อความแบบไม่บังคับที่แสดงเมื่อมีการร้องขอแถวที่ถูกระงับโดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายการโฮสต์ URL ฐานของผู้ให้บริการที่มีผลแบบไม่บังคับ ซึ่งจำเป็นก่อนที่การระงับจะมีผล               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของการกำหนดค่าผู้ให้บริการแบบตรงตัวที่มีผลแบบไม่บังคับ ซึ่งจำเป็นก่อนที่การระงับจะมีผล              |

อย่าใส่ข้อมูลเฉพาะรันไทม์ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อแถวในแมนิเฟสต์
สมบูรณ์เพียงพอให้พื้นผิวรายการและตัวเลือกที่กรองตามผู้ให้บริการข้าม
การค้นพบผ่านรีจิสทรี/รันไทม์ได้ ใช้ `refreshable` เมื่อแถวในแมนิเฟสต์มีประโยชน์
ในฐานะเมล็ดข้อมูลหรือส่วนเสริมที่แสดงเป็นรายการได้ แต่การรีเฟรช/แคชสามารถเพิ่มแถวเพิ่มเติมภายหลังได้;
แถวที่รีเฟรชได้ไม่ใช่แหล่งอ้างอิงหลักโดยตัวเอง ใช้ `runtime` เมื่อ OpenClaw
ต้องโหลดรันไทม์ของผู้ให้บริการเพื่อรู้รายการ

## ข้อมูลอ้างอิง `modelIdNormalization`

ใช้ `modelIdNormalization` สำหรับการล้างรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของแบบประหยัดซึ่งต้อง
เกิดขึ้นก่อนรันไทม์ของผู้ให้บริการโหลด การดำเนินการนี้เก็บนามแฝง เช่น ชื่อโมเดลแบบสั้น
รหัสเดิมภายในผู้ให้บริการ และกฎคำนำหน้าพร็อกซีไว้ในแมนิเฟสต์ของ Plugin
เจ้าของ แทนที่จะอยู่ในตารางการเลือกโมเดลของแกนหลัก

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

ฟิลด์ผู้ให้บริการ:

| ฟิลด์                                | ประเภท                    | ความหมาย                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | นามแฝงรหัสโมเดลแบบตรงตัวที่ไม่แยกตัวพิมพ์ใหญ่เล็ก ค่าจะถูกส่งคืนตามที่เขียนไว้                  |
| `stripPrefixes`                      | `string[]`              | คำนำหน้าที่จะลบก่อนค้นหานามแฝง มีประโยชน์สำหรับการซ้ำซ้อนของผู้ให้บริการ/โมเดลแบบเดิม     |
| `prefixWhenBare`                     | `string`                | คำนำหน้าที่จะเพิ่มเมื่อรหัสโมเดลที่ทำให้เป็นมาตรฐานแล้วยังไม่มี `/`                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎคำนำหน้าสำหรับรหัสเปลือยแบบมีเงื่อนไขหลังค้นหานามแฝง โดยใช้ `modelPrefix` และ `prefix` เป็นคีย์ |

## ข้อมูลอ้างอิง `providerEndpoints`

ใช้ `providerEndpoints` สำหรับการจัดประเภทปลายทางที่นโยบายคำขอทั่วไป
ต้องรู้ก่อนรันไทม์ของผู้ให้บริการโหลด แกนหลักยังคงเป็นเจ้าของความหมายของแต่ละ
`endpointClass`; แมนิเฟสต์ของ Plugin เป็นเจ้าของเมทาดาทาโฮสต์และ URL ฐาน

ฟิลด์ปลายทาง:

| ฟิลด์                          | ประเภท       | ความหมาย                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาสปลายทางของแกนหลักที่รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`        |
| `hosts`                        | `string[]` | ชื่อโฮสต์แบบตรงตัวที่แมปกับคลาสปลายทาง                                                |
| `hostSuffixes`                 | `string[]` | ส่วนท้ายโฮสต์ที่แมปกับคลาสปลายทาง เติม `.` นำหน้าเพื่อจับคู่เฉพาะส่วนท้ายโดเมน |
| `baseUrls`                     | `string[]` | URL ฐาน HTTP(S) ที่ทำให้เป็นมาตรฐานแล้วแบบตรงตัวซึ่งแมปกับคลาสปลายทาง                             |
| `googleVertexRegion`           | `string`   | ภูมิภาค Google Vertex แบบคงที่สำหรับโฮสต์ส่วนกลางแบบตรงตัว                                            |
| `googleVertexRegionHostSuffix` | `string`   | ส่วนท้ายที่จะตัดออกจากโฮสต์ที่ตรงกันเพื่อเปิดเผยคำนำหน้าภูมิภาค Google Vertex                 |

## ข้อมูลอ้างอิง `providerRequest`

ใช้ `providerRequest` สำหรับเมทาดาทาความเข้ากันได้ของคำขอแบบประหยัดที่นโยบาย
คำขอทั่วไปต้องใช้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ เก็บการเขียนเพย์โหลดใหม่
ที่เฉพาะพฤติกรรมไว้ในฮุกของรันไทม์ผู้ให้บริการหรือตัวช่วยตระกูลผู้ให้บริการที่ใช้ร่วมกัน

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

ฟิลด์ผู้ให้บริการ:

| ฟิลด์                 | ประเภท         | ความหมาย                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายชื่อตระกูลผู้ให้บริการที่ใช้โดยการตัดสินใจและการวินิจฉัยความเข้ากันได้ของคำขอทั่วไป |
| `compatibilityFamily` | `"moonshot"` | บัคเก็ตความเข้ากันได้ของตระกูลผู้ให้บริการแบบไม่บังคับสำหรับตัวช่วยคำขอที่ใช้ร่วมกัน              |
| `openAICompletions`   | `object`     | แฟล็กคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage`       |

## ข้อมูลอ้างอิง `modelPricing`

ใช้ `modelPricing` เมื่อผู้ให้บริการต้องควบคุมพฤติกรรมราคาของ control plane ก่อน
รันไทม์โหลด แคชราคาของ Gateway อ่านเมทาดาทานี้โดยไม่ต้องนำเข้า
โค้ดรันไทม์ของผู้ให้บริการ

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

ฟิลด์ผู้ให้บริการ:

| ฟิลด์        | ประเภท              | ความหมาย                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | ตั้งเป็น `false` สำหรับผู้ให้บริการภายในเครื่อง/โฮสต์เองที่ไม่ควรดึงราคาจาก OpenRouter หรือ LiteLLM เลย |
| `openRouter` | `false \| object` | การแมปการค้นหาราคาของ OpenRouter ค่า `false` ปิดการค้นหาผ่าน OpenRouter สำหรับผู้ให้บริการนี้           |
| `liteLLM`    | `false \| object` | การแมปการค้นหาราคาของ LiteLLM ค่า `false` ปิดการค้นหาผ่าน LiteLLM สำหรับผู้ให้บริการนี้                 |

ฟิลด์แหล่งที่มา:

| ฟิลด์                      | ประเภท               | ความหมาย                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | รหัสผู้ให้บริการในแค็ตตาล็อกภายนอกเมื่อแตกต่างจากรหัสผู้ให้บริการ OpenClaw เช่น `z-ai` สำหรับผู้ให้บริการ `zai` |
| `passthroughProviderModel` | `boolean`          | ถือว่ารหัสโมเดลที่มีสแลชเป็นการอ้างอิงผู้ให้บริการ/โมเดลแบบซ้อน มีประโยชน์สำหรับผู้ให้บริการพร็อกซี เช่น OpenRouter       |
| `modelIdTransforms`        | `"version-dots"[]` | ตัวแปรรหัสโมเดลของแค็ตตาล็อกภายนอกเพิ่มเติม `version-dots` จะลองรหัสเวอร์ชันแบบมีจุด เช่น `claude-opus-4.6`            |

### ดัชนีผู้ให้บริการ OpenClaw

ดัชนีผู้ให้บริการ OpenClaw เป็นเมทาดาทาพรีวิวที่ OpenClaw เป็นเจ้าของสำหรับผู้ให้บริการ
ที่ Plugin ของผู้ให้บริการนั้นอาจยังไม่ได้ติดตั้ง ดัชนีนี้ไม่ใช่ส่วนหนึ่งของแมนิเฟสต์ Plugin
แมนิเฟสต์ Plugin ยังคงเป็นแหล่งอ้างอิงหลักของ Plugin ที่ติดตั้งแล้ว ดัชนีผู้ให้บริการเป็น
สัญญาสำรองภายในที่พื้นผิวตัวเลือกโมเดลสำหรับผู้ให้บริการแบบติดตั้งได้ในอนาคตและก่อนติดตั้ง
จะใช้เมื่อไม่ได้ติดตั้ง Plugin ของผู้ให้บริการ

ลำดับแหล่งอ้างอิงหลักของแค็ตตาล็อก:

1. การกำหนดค่าของผู้ใช้
2. `modelCatalog` ในแมนิเฟสต์ Plugin ที่ติดตั้งแล้ว
3. แคชแค็ตตาล็อกโมเดลจากการรีเฟรชโดยชัดเจน
4. แถวพรีวิวของดัชนีผู้ให้บริการ OpenClaw

ดัชนีผู้ให้บริการต้องไม่มีข้อมูลลับ สถานะเปิดใช้งาน runtime hooks หรือ
ข้อมูลโมเดลเฉพาะบัญชีจริง แคตตาล็อกตัวอย่างใช้รูปแบบแถวผู้ให้บริการ
`modelCatalog` เดียวกับ manifest ของ plugin แต่ควรจำกัดไว้ที่เมทาดาทาสำหรับแสดงผลที่เสถียร
เว้นแต่ว่าฟิลด์ของ runtime adapter เช่น `api`,
`baseUrl`, ราคา หรือแฟล็กความเข้ากันได้ จะถูกตั้งใจให้สอดคล้องกับ
manifest ของ plugin ที่ติดตั้งไว้ ผู้ให้บริการที่มีการค้นพบ `/models` แบบสดควร
เขียนแถวที่รีเฟรชแล้วผ่านพาธแคชแคตตาล็อกโมเดลที่ระบุไว้อย่างชัดเจน แทนการให้
การแสดงรายการปกติหรือ onboarding เรียก API ของผู้ให้บริการ

รายการในดัชนีผู้ให้บริการอาจมีเมทาดาทา plugin ที่ติดตั้งได้สำหรับผู้ให้บริการ
ที่ plugin ถูกย้ายออกจาก core หรือยังไม่ได้ติดตั้งด้วย เมทาดาทานี้
สะท้อนรูปแบบแคตตาล็อกช่องทาง: ชื่อแพ็กเกจ, npm install spec,
expected integrity และป้ายตัวเลือกการยืนยันตัวตนแบบต้นทุนต่ำ ก็เพียงพอสำหรับแสดง
ตัวเลือกการตั้งค่าที่ติดตั้งได้ เมื่อ plugin ถูกติดตั้งแล้ว manifest ของ plugin นั้นจะมีผลเหนือกว่า
และรายการดัชนีผู้ให้บริการจะถูกละเว้นสำหรับผู้ให้บริการนั้น

คีย์ความสามารถระดับบนสุดแบบเดิมเลิกแนะนำให้ใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด
manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นเจ้าของความสามารถอีกต่อไป

## Manifest เทียบกับ package.json

ไฟล์ทั้งสองทำหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ, การตรวจสอบ config, เมทาดาทาตัวเลือกการยืนยันตัวตน และคำใบ้ UI ที่ต้องมีอยู่ก่อนโค้ด plugin ทำงาน                         |
| `package.json`         | เมทาดาทา npm, การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoints, install gating, setup หรือเมทาดาทาแคตตาล็อก |

หากไม่แน่ใจว่าเมทาดาทาส่วนหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ก่อนโหลดโค้ด plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเกี่ยวกับแพ็กเกจจิง, ไฟล์ entry หรือพฤติกรรม npm install ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่มีผลต่อการค้นพบ

เมทาดาทา plugin บางรายการก่อน runtime ถูกตั้งใจให้อยู่ใน `package.json` ภายใต้
บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ประกาศ native plugin entrypoints ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ plugin เท่านั้น                                                                                                   |
| `openclaw.runtimeExtensions`                                      | ประกาศ JavaScript runtime entrypoints ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้งไว้ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ plugin เท่านั้น                                                                 |
| `openclaw.setupEntry`                                             | entrypoint เฉพาะ setup แบบเบา ใช้ระหว่าง onboarding, การเริ่มช่องทางแบบเลื่อนออกไป และสถานะช่องทางแบบอ่านอย่างเดียว/การค้นพบ SecretRef ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ plugin เท่านั้น |
| `openclaw.runtimeSetupEntry`                                      | ประกาศ JavaScript setup entrypoint ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้งไว้ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ plugin เท่านั้น                                                                |
| `openclaw.channel`                                                | เมทาดาทาแคตตาล็อกช่องทางแบบเบา เช่น ป้าย, พาธเอกสาร, alias และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                       | เมทาดาทา auto-default ของคำสั่ง native และ skill native แบบคงที่ ที่ใช้โดยพื้นผิว config, audit และ command-list ก่อนที่ runtime ของช่องทางจะโหลด                                          |
| `openclaw.channel.configuredState`                                | เมทาดาทาตัวตรวจสอบ configured-state แบบเบา ที่ตอบได้ว่า "มีการตั้งค่าแบบ env-only อยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ช่องทางเต็มรูปแบบ                                         |
| `openclaw.channel.persistedAuthState`                             | เมทาดาทาตัวตรวจสอบ persisted-auth แบบเบา ที่ตอบได้ว่า "มีสิ่งใดลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ช่องทางเต็มรูปแบบ                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | คำใบ้ install/update สำหรับ plugin ที่ bundled และเผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | พาธติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้ใช้                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | เวอร์ชันโฮสต์ OpenClaw ขั้นต่ำที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22`                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | สตริง expected npm dist integrity เช่น `sha512-...`; โฟลว์ install และ update จะตรวจสอบ artifact ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตพาธกู้คืนการติดตั้งใหม่ของ bundled-plugin แบบจำกัด เมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | อนุญาตให้พื้นผิวช่องทางเฉพาะ setup โหลดก่อน plugin ช่องทางเต็มรูปแบบระหว่าง startup                                                                                                 |

เมทาดาทา manifest เป็นตัวตัดสินว่าตัวเลือกผู้ให้บริการ/ช่องทาง/setup ใดจะปรากฏใน
onboarding ก่อน runtime โหลด `package.json#openclaw.install` บอก
onboarding ว่าจะดึงหรือเปิดใช้งาน plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้ายคำใบ้การติดตั้งเข้าไปใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด registry
ของ manifest ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ; ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม
plugin บนโฮสต์รุ่นเก่า

การปักหมุดเวอร์ชัน npm แบบแน่นอนมีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการแคตตาล็อกภายนอกอย่างเป็นทางการ
ควรจับคู่ spec แบบแน่นอนกับ `expectedIntegrity` เพื่อให้โฟลว์ update ล้มเหลวแบบปิด
หาก artifact npm ที่ดึงมาไม่ตรงกับ release ที่ปักหมุดไว้อีกต่อไป
Interactive onboarding ยังเสนอ npm specs จาก registry ที่เชื่อถือได้ รวมถึงชื่อแพ็กเกจเปล่า
และ dist-tags เพื่อความเข้ากันได้ การวินิจฉัยแคตตาล็อกสามารถ
แยกแยะแหล่งที่มาแบบ exact, floating, integrity-pinned, missing-integrity, package-name
mismatch และ invalid default-choice ได้ และยังเตือนเมื่อ
`expectedIntegrity` มีอยู่แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ปักหมุดได้
เมื่อมี `expectedIntegrity`,
โฟลว์ install/update จะบังคับใช้ค่านั้น; เมื่อไม่มี ระบบจะบันทึกการ resolve จาก registry
โดยไม่มี integrity pin

plugin ช่องทางควรระบุ `openclaw.setupEntry` เมื่อสถานะ, รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่ตั้งค่าไว้โดยไม่โหลด runtime เต็มรูปแบบ
setup entry ควรเปิดเผยเมทาดาทาช่องทางพร้อมกับ config, status และ secrets adapters
ที่ปลอดภัยสำหรับ setup; ให้เก็บ network clients, gateway listeners และ
transport runtimes ไว้ใน entrypoint หลักของ extension

ฟิลด์ runtime entrypoint ไม่ได้แทนที่การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
source entrypoint ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกตั้งใจให้มีขอบเขตแคบ
มันไม่ได้ทำให้ config ที่เสียหายโดยพลการติดตั้งได้ ปัจจุบันอนุญาตให้โฟลว์ติดตั้ง
กู้คืนจากความล้มเหลวการอัปเกรด bundled-plugin ที่ค้างอยู่เฉพาะกรณี เช่น
พาธ bundled plugin ที่หายไป หรือรายการ `channels.<id>` ที่ค้างสำหรับ
bundled plugin เดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ปฏิบัติงาน
ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` เป็นเมทาดาทาแพ็กเกจสำหรับโมดูลตัวตรวจสอบขนาดเล็ก:

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

ใช้เมื่อโฟลว์ setup, doctor, status หรือ presence แบบอ่านอย่างเดียวต้องการการ probe
การยืนยันตัวตนแบบ yes/no ที่ต้นทุนต่ำก่อน plugin ช่องทางเต็มรูปแบบโหลด Persisted auth state ไม่ใช่
configured channel state: อย่าใช้เมทาดาทานี้เพื่อเปิดใช้งาน plugin โดยอัตโนมัติ,
ซ่อมแซม runtime dependencies หรือตัดสินใจว่าควรโหลด runtime ช่องทางหรือไม่
export เป้าหมายควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะ persisted state เท่านั้น; อย่า
ส่งผ่าน barrel ของ runtime ช่องทางเต็มรูปแบบ

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบ configured
แบบ env-only ที่ต้นทุนต่ำ:

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

ใช้เมื่อช่องทางสามารถตอบ configured-state จาก env หรืออินพุตขนาดเล็กอื่นที่ไม่ใช่ runtime
ได้ หากการตรวจสอบต้องใช้การ resolve config เต็มรูปแบบหรือ runtime ช่องทางจริง
ให้เก็บ logic นั้นไว้ใน hook `config.hasConfiguredState` ของ plugin แทน

## ลำดับความสำคัญของการค้นพบ (id ของ plugin ซ้ำ)

OpenClaw ค้นพบ plugin จาก root หลายแห่ง (bundled, global install, workspace, พาธที่ explicit config-selected) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด** เท่านั้น; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดไว้ข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **Config-selected** — พาธที่ปักหมุดไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — plugin ที่มาพร้อมกับ OpenClaw
3. **Global install** — plugin ที่ติดตั้งไว้ใน root plugin ของ OpenClaw แบบ global
4. **Workspace** — plugin ที่ค้นพบสัมพันธ์กับ workspace ปัจจุบัน

ผลที่ตามมา:

- สำเนาของ bundled plugin ที่ fork หรือค้างอยู่ใน workspace จะไม่บัง build ที่ bundled มา
- หากต้องการ override bundled plugin ด้วยตัว local จริง ๆ ให้ปักหมุดผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่งพาการค้นพบใน workspace
- การทิ้งรายการซ้ำจะถูก log เพื่อให้ Doctor และการวินิจฉัย startup ชี้ไปยังสำเนาที่ถูกทิ้งได้

## ข้อกำหนด JSON Schema

- **ทุก plugin ต้องมาพร้อม JSON Schema** แม้ว่าจะไม่รับ config ก็ตาม
- schema ว่างยอมรับได้ (ตัวอย่างเช่น `{ "type": "object", "additionalProperties": false }`)
- Schemas ถูกตรวจสอบตอนอ่าน/เขียน config ไม่ใช่ตอน runtime

## พฤติกรรมการตรวจสอบความถูกต้อง

- คีย์ `channels.*` ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด** เว้นแต่ว่า id ของช่องจะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id ของ Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักถือเป็น **ข้อผิดพลาด**
- หาก Plugin ถูกติดตั้งแล้วแต่ manifest หรือ schema เสียหายหรือหายไป
  การตรวจสอบความถูกต้องจะล้มเหลว และ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมีการกำหนดค่า Plugin แต่ Plugin ถูก **ปิดใช้งาน** การกำหนดค่าจะถูกเก็บไว้ และ
  **คำเตือน** จะแสดงใน Doctor + logs

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema `plugins.*` ฉบับเต็ม

## หมายเหตุ

- manifest เป็นสิ่งที่ **จำเป็นสำหรับ Plugin แบบ native ของ OpenClaw** รวมถึงการโหลดจากระบบไฟล์ในเครื่อง Runtime ยังคงโหลดโมดูลของ Plugin แยกต่างหาก manifest ใช้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น
- manifest แบบ native ถูกแยกวิเคราะห์ด้วย JSON5 ดังนั้น comments, trailing commas และ unquoted keys จึงใช้ได้ ตราบใดที่ค่าสุดท้ายยังเป็น object
- ตัวโหลด manifest จะอ่านเฉพาะฟิลด์ manifest ที่มีเอกสารกำกับไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ได้ทั้งหมดเมื่อ Plugin ไม่ต้องการใช้งาน
- `providerDiscoveryEntry` ต้องคงความเบาไว้ และไม่ควร import โค้ด runtime จำนวนมาก ใช้สำหรับ metadata แค็ตตาล็อก provider แบบ static หรือ descriptor การค้นพบแบบแคบ ไม่ใช่การดำเนินการขณะรับคำขอ
- ชนิดของ Plugin แบบ exclusive ถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- ประกาศชนิดของ Plugin แบบ exclusive ใน manifest นี้ `OpenClawPluginDefinition.kind` ใน runtime entry เลิกแนะนำให้ใช้แล้ว และยังคงมีอยู่เป็น fallback เพื่อความเข้ากันได้สำหรับ Plugin รุ่นเก่าเท่านั้น
- metadata ของ env-var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกแนะนำให้ใช้แล้ว และ `channelEnvVars`) เป็นเพียงการประกาศเท่านั้น Status, audit, การตรวจสอบความถูกต้องของการส่ง Cron และพื้นผิวแบบอ่านอย่างเดียวอื่น ๆ ยังคงใช้นโยบายความน่าเชื่อถือของ Plugin และการเปิดใช้งานที่มีผลจริง ก่อนจะถือว่า env var ถูกกำหนดค่าแล้ว
- สำหรับ metadata ของ runtime wizard ที่ต้องใช้โค้ด provider ดู [Provider runtime hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณขึ้นอยู่กับ native modules ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนด allowlist ของ package-manager (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    ข้อมูลอ้างอิง Plugin SDK และ subpath imports
  </Card>
</CardGroup>
