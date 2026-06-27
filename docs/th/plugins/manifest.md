---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องเผยแพร่สคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดการตรวจสอบความถูกต้องของ Plugin
summary: ข้อกำหนดแมนิเฟสต์ Plugin + JSON schema (การตรวจสอบการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้มีไว้สำหรับ **แมนิเฟสต์ Plugin แบบเนทีฟของ OpenClaw** เท่านั้น.

สำหรับเลย์เอาต์บันเดิลที่เข้ากันได้ โปรดดู [บันเดิล Plugin](/th/plugins/bundles).

รูปแบบบันเดิลที่เข้ากันได้ใช้ไฟล์แมนิเฟสต์ที่แตกต่างกัน:

- บันเดิล Codex: `.codex-plugin/plugin.json`
- บันเดิล Claude: `.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น
  ที่ไม่มีแมนิเฟสต์
- บันเดิล Cursor: `.cursor-plugin/plugin.json`

OpenClaw ตรวจพบเลย์เอาต์บันเดิลเหล่านั้นโดยอัตโนมัติเช่นกัน แต่จะไม่ตรวจสอบ
กับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่.

สำหรับบันเดิลที่เข้ากันได้ ปัจจุบัน OpenClaw อ่านเมทาดาต้าบันเดิลพร้อมราก Skills
ที่ประกาศไว้ รากคำสั่ง Claude ค่าเริ่มต้น `settings.json` ของบันเดิล Claude,
ค่าเริ่มต้น LSP ของบันเดิล Claude และชุด hook ที่รองรับเมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของรันไทม์ OpenClaw.

Plugin แบบเนทีฟของ OpenClaw ทุกตัว **ต้อง** ส่งไฟล์ `openclaw.plugin.json` ใน
**ราก Plugin**. OpenClaw ใช้แมนิเฟสต์นี้เพื่อตรวจสอบการกำหนดค่า
**โดยไม่เรียกใช้โค้ด Plugin**. แมนิเฟสต์ที่หายไปหรือไม่ถูกต้องจะถูกถือเป็น
ข้อผิดพลาดของ Plugin และบล็อกการตรวจสอบการกำหนดค่า.

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugins](/th/tools/plugin).
สำหรับโมเดลความสามารถแบบเนทีฟและคำแนะนำความเข้ากันได้ภายนอกในปัจจุบัน:
[โมเดลความสามารถ](/th/plugins/architecture#public-capability-model).

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือเมทาดาต้าที่ OpenClaw อ่าน **ก่อนโหลดโค้ด
Plugin ของคุณ**. ทุกอย่างด้านล่างต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูต
รันไทม์ Plugin.

**ใช้สำหรับ:**

- ตัวตนของ Plugin, การตรวจสอบการกำหนดค่า และคำใบ้ UI การกำหนดค่า
- เมทาดาต้า auth, onboarding และ setup (alias, auto-enable, provider env vars, auth choices)
- คำใบ้การเปิดใช้งานสำหรับพื้นผิวระนาบควบคุม
- ความเป็นเจ้าของตระกูลโมเดลแบบย่อ
- สแนปช็อตแบบคงที่ของความเป็นเจ้าของความสามารถ (`contracts`)
- เมทาดาต้า QA runner ที่โฮสต์ `openclaw qa` แบบใช้ร่วมกันสามารถตรวจสอบได้
- เมทาดาต้าการกำหนดค่าเฉพาะช่องทางที่ผสานเข้ากับแค็ตตาล็อกและพื้นผิวการตรวจสอบ

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรมรันไทม์, การประกาศ entrypoints ของโค้ด,
หรือเมทาดาต้า npm install. สิ่งเหล่านั้นอยู่ในโค้ด Plugin ของคุณและ `package.json`.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| ฟิลด์                                | จำเป็น | ชนิด                             | ความหมาย                                                                                                                                                                                                                                   |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | id ของ Plugin แบบมาตรฐาน นี่คือ id ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                             |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบอินไลน์สำหรับ config ของ Plugin นี้                                                                                                                                                                                                    |
| `requiresPlugins`                    | ไม่       | `string[]`                       | id ของ Plugin ที่ต้องติดตั้งด้วยเพื่อให้ Plugin นี้มีผล Discovery จะยังคงทำให้ Plugin โหลดได้ แต่จะแจ้งเตือนเมื่อ Plugin ที่จำเป็นขาดหายไป                                                                                    |
| `enabledByDefault`                   | ไม่       | `true`                           | ทำเครื่องหมาย Plugin ที่ bundled ว่าเปิดใช้งานตามค่าเริ่มต้น ละเว้นค่านี้ หรือตั้งค่าเป็นค่าใดก็ตามที่ไม่ใช่ `true` เพื่อปล่อยให้ Plugin ปิดใช้งานตามค่าเริ่มต้น                                                                                                                    |
| `enabledByDefaultOnPlatforms`        | ไม่       | `string[]`                       | ทำเครื่องหมาย Plugin ที่ bundled ว่าเปิดใช้งานตามค่าเริ่มต้นเฉพาะบนแพลตฟอร์ม Node.js ที่ระบุไว้ เช่น `["darwin"]` config ที่ระบุไว้อย่างชัดเจนยังคงมีผลเหนือกว่า                                                                                                        |
| `legacyPluginIds`                    | ไม่       | `string[]`                       | id เดิมที่ normalize เป็น id ของ Plugin แบบมาตรฐานนี้                                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | ไม่       | `string[]`                       | id ของ provider ที่ควรเปิดใช้ Plugin นี้โดยอัตโนมัติเมื่อ auth, config หรือ model refs กล่าวถึง provider เหล่านั้น                                                                                                                                                 |
| `kind`                               | ไม่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบ exclusive ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                                    |
| `channels`                           | ไม่       | `string[]`                       | id ของ channel ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับ discovery และการตรวจสอบ config                                                                                                                                                                     |
| `providers`                          | ไม่       | `string[]`                       | id ของ provider ที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                              |
| `providerCatalogEntry`               | ไม่       | `string`                         | พาธโมดูล provider-catalog แบบเบา ซึ่งสัมพันธ์กับรากของ Plugin สำหรับ metadata ของ provider catalog ที่อยู่ในขอบเขต manifest ซึ่งโหลดได้โดยไม่ต้องเปิดใช้งาน runtime เต็มของ Plugin                                                             |
| `modelSupport`                       | ไม่       | `object`                         | metadata ตระกูลโมเดลแบบย่อที่ manifest เป็นเจ้าของ ใช้เพื่อโหลด Plugin อัตโนมัติก่อน runtime                                                                                                                                                     |
| `modelCatalog`                       | ไม่       | `object`                         | metadata ของ model catalog แบบ declarative สำหรับ provider ที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญา control-plane สำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต, onboarding, ตัวเลือกโมเดล, aliases และ suppression โดยไม่ต้องโหลด runtime ของ Plugin                     |
| `modelPricing`                       | ไม่       | `object`                         | นโยบาย lookup ราคาภายนอกที่ provider เป็นเจ้าของ ใช้เพื่อยกเว้น provider แบบ local/self-hosted ออกจาก remote pricing catalogs หรือ map provider refs ไปยัง id ของ OpenRouter/LiteLLM catalog โดยไม่ hardcode id ของ provider ใน core                         |
| `modelIdNormalization`               | ไม่       | `object`                         | การล้าง alias/prefix ของ model-id ที่ provider เป็นเจ้าของ ซึ่งต้องทำงานก่อนโหลด runtime ของ provider                                                                                                                                                       |
| `providerEndpoints`                  | ไม่       | `object[]`                       | metadata ของ endpoint host/baseUrl ที่ manifest เป็นเจ้าของ สำหรับ route ของ provider ที่ core ต้องจัดประเภทก่อนโหลด runtime ของ provider                                                                                                                        |
| `providerRequest`                    | ไม่       | `object`                         | metadata ของตระกูล provider และความเข้ากันได้ของคำขอแบบประหยัด ที่ใช้โดยนโยบายคำขอทั่วไปก่อนโหลด runtime ของ provider                                                                                                                          |
| `secretProviderIntegrations`         | ไม่       | `Record<string, object>`         | preset ของ SecretRef exec provider แบบ declarative ที่พื้นผิว setup หรือ install สามารถเสนอได้โดยไม่ต้อง hardcode integration เฉพาะ provider ใน core                                                                                                 |
| `cliBackends`                        | ไม่       | `string[]`                       | id ของ backend การ inference ของ CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติเมื่อเริ่มต้นจาก config refs ที่ระบุไว้อย่างชัดเจน                                                                                                                                     |
| `syntheticAuthRefs`                  | ไม่       | `string[]`                       | refs ของ provider หรือ CLI backend ที่ควร probe hook synthetic auth ซึ่ง Plugin เป็นเจ้าของ ระหว่าง cold model discovery ก่อนโหลด runtime                                                                                                          |
| `nonSecretAuthMarkers`               | ไม่       | `string[]`                       | ค่า placeholder ของ API key ที่ Plugin แบบ bundled เป็นเจ้าของ ซึ่งแทนสถานะ credential แบบ local, OAuth หรือ ambient ที่ไม่ใช่ความลับ                                                                                                                            |
| `commandAliases`                     | ไม่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้าง diagnostics ของ config และ CLI ที่รับรู้ Plugin ก่อนโหลด runtime                                                                                                                            |
| `providerAuthEnvVars`                | ไม่       | `Record<string, string[]>`       | metadata ของ env สำหรับความเข้ากันได้ที่เลิกใช้แล้ว สำหรับการ lookup auth/status ของ provider ควรใช้ `setup.providers[].envVars` สำหรับ Plugin ใหม่ OpenClaw ยังอ่านค่านี้ระหว่างช่วง deprecation                                                             |
| `providerAuthAliases`                | ไม่       | `Record<string, string>`         | id ของ provider ที่ควรใช้ id ของ provider อื่นซ้ำสำหรับการ lookup auth เช่น provider สำหรับ coding ที่แชร์ API key และ auth profiles ของ provider พื้นฐาน                                                                                      |
| `channelEnvVars`                     | ไม่       | `Record<string, string[]>`       | metadata ของ env สำหรับ channel แบบประหยัดที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้สำหรับการตั้งค่า channel ที่ขับเคลื่อนด้วย env หรือพื้นผิว auth ที่ helper ทั่วไปของ startup/config ควรมองเห็น                                                        |
| `providerAuthChoices`                | ไม่       | `object[]`                       | metadata ของตัวเลือก auth แบบประหยัดสำหรับ onboarding pickers, การ resolve preferred-provider และการเชื่อม CLI flag อย่างง่าย                                                                                                                                   |
| `activation`                         | ไม่       | `object`                         | metadata ของ activation planner แบบประหยัดสำหรับการโหลดที่ถูก trigger โดย startup, provider, command, channel, route และ capability เป็นเพียง metadata เท่านั้น; runtime ของ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                                                                   |
| `setup`                              | ไม่       | `object`                         | descriptor ของ setup/onboarding แบบประหยัดที่ discovery และพื้นผิว setup สามารถตรวจสอบได้โดยไม่ต้องโหลด runtime ของ Plugin                                                                                                                                |
| `qaRunners`                          | ไม่       | `object[]`                       | descriptor ของ QA runner แบบประหยัดที่ใช้โดย host `openclaw qa` ที่แชร์ร่วมกัน ก่อนโหลด runtime ของ Plugin                                                                                                                                                  |
| `contracts`                          | ไม่       | `object`                         | snapshot ความเป็นเจ้าของ capability แบบ static สำหรับ external auth hooks, embeddings, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของ tool |
| `mediaUnderstandingProviderMetadata` | ไม่       | `Record<string, object>`         | ค่าเริ่มต้นของ media-understanding แบบประหยัดสำหรับ id ของ provider ที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                                        |
| `imageGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | metadata ของ auth สำหรับ image-generation แบบประหยัดสำหรับ id ของ provider ที่ประกาศใน `contracts.imageGenerationProviders` รวมถึง auth aliases และ base-url guards ที่ provider เป็นเจ้าของ                                                                              |
| `videoGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | metadata ของ auth สำหรับ video-generation แบบประหยัดสำหรับ id ของ provider ที่ประกาศใน `contracts.videoGenerationProviders` รวมถึง auth aliases และ base-url guards ที่ provider เป็นเจ้าของ                                                                              |
| `musicGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | metadata ของ auth สำหรับ music-generation แบบประหยัดสำหรับ id ของ provider ที่ประกาศใน `contracts.musicGenerationProviders` รวมถึง auth aliases และ base-url guards ที่ provider เป็นเจ้าของ                                                                              |
| `toolMetadata`                       | ไม่       | `Record<string, object>`         | เมตาดาต้าความพร้อมใช้งานราคาถูกสำหรับเครื่องมือที่ Plugin เป็นเจ้าของซึ่งประกาศใน `contracts.tools` ใช้เมื่อเครื่องมือไม่ควรโหลดรันไทม์ เว้นแต่จะมีหลักฐานของ config, env หรือ auth อยู่                                                                       |
| `channelConfigs`                     | ไม่       | `Record<string, object>`         | เมตาดาต้า config ของช่องทางที่ manifest เป็นเจ้าของ ซึ่งผสานเข้ากับพื้นผิวการค้นพบและการตรวจสอบก่อนโหลดรันไทม์                                                                                                                                      |
| `skills`                             | ไม่       | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด โดยสัมพันธ์กับรูทของ Plugin                                                                                                                                                                                         |
| `name`                               | ไม่       | `string`                         | ชื่อ Plugin ที่มนุษย์อ่านเข้าใจได้                                                                                                                                                                                                                     |
| `description`                        | ไม่       | `string`                         | สรุปสั้นๆ ที่แสดงในพื้นผิวของ Plugin                                                                                                                                                                                                         |
| `icon`                               | ไม่       | `string`                         | URL รูปภาพ HTTPS สำหรับการ์ด marketplace/catalog ClawHub ยอมรับ URL `https://` ที่ถูกต้องใดๆ และจะย้อนกลับไปใช้ไอคอน Plugin เริ่มต้นเมื่อเว้นค่านี้ไว้หรือค่าไม่ถูกต้อง                                                                              |
| `version`                            | ไม่       | `string`                         | เวอร์ชัน Plugin เพื่อให้ข้อมูล                                                                                                                                                                                                                   |
| `uiHints`                            | ไม่       | `Record<string, object>`         | ป้ายกำกับ UI, placeholder และคำใบ้ความอ่อนไหวสำหรับฟิลด์ config                                                                                                                                                                               |

## ข้อมูลอ้างอิงเมทาดาทาของผู้ให้บริการการสร้าง

ฟิลด์เมทาดาทาของผู้ให้บริการการสร้างอธิบายสัญญาณ auth แบบคงที่สำหรับ
ผู้ให้บริการที่ประกาศในรายการ `contracts.*GenerationProviders` ที่ตรงกัน
OpenClaw อ่านฟิลด์เหล่านี้ก่อนโหลด runtime ของผู้ให้บริการ เพื่อให้เครื่องมือหลักสามารถ
ตัดสินได้ว่าผู้ให้บริการการสร้างพร้อมใช้งานหรือไม่โดยไม่ต้องนำเข้า
Plugin ของผู้ให้บริการทุกตัว

ใช้ฟิลด์เหล่านี้เฉพาะกับข้อเท็จจริงเชิงประกาศที่มีต้นทุนต่ำเท่านั้น Transport, การแปลง request,
การรีเฟรช token, การตรวจสอบ credential และพฤติกรรมการสร้างจริง
ยังคงอยู่ใน runtime ของ Plugin

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

แต่ละรายการเมทาดาทารองรับ:

| ฟิลด์                  | จำเป็น | ชนิด       | ความหมาย                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | ไม่       | `string[]` | id ผู้ให้บริการเพิ่มเติมที่ควรถูกนับเป็นนามแฝง auth แบบคงที่สำหรับผู้ให้บริการการสร้าง                                                       |
| `authProviders`        | ไม่       | `string[]` | id ผู้ให้บริการที่โปรไฟล์ auth ที่กำหนดค่าไว้ควรถูกนับเป็น auth สำหรับผู้ให้บริการการสร้างนี้                                                      |
| `configSignals`        | ไม่       | `object[]` | สัญญาณความพร้อมใช้งานที่อิงเฉพาะ config และมีต้นทุนต่ำ สำหรับผู้ให้บริการแบบ local หรือ self-hosted ที่สามารถกำหนดค่าได้โดยไม่ต้องมีโปรไฟล์ auth หรือ env var                 |
| `authSignals`          | ไม่       | `object[]` | สัญญาณ auth แบบชัดเจน เมื่อมีอยู่ สัญญาณเหล่านี้จะแทนที่ชุดสัญญาณเริ่มต้นจาก id ผู้ให้บริการ, `aliases` และ `authProviders`                     |
| `referenceAudioInputs` | ไม่       | `boolean`  | สำหรับการสร้างวิดีโอเท่านั้น ตั้งเป็น `true` เมื่อผู้ให้บริการยอมรับ assets เสียงอ้างอิง มิฉะนั้น `video_generate` จะซ่อนพารามิเตอร์การอ้างอิงเสียง |

แต่ละรายการ `configSignals` รองรับ:

| ฟิลด์            | จำเป็น | ชนิด       | ความหมาย                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | ใช่      | `string`   | Dot path ไปยังออบเจ็กต์ config ที่ Plugin เป็นเจ้าของเพื่อตรวจสอบ เช่น `plugins.entries.example.config`                                                                                      |
| `overlayPath`    | ไม่       | `string`   | Dot path ภายใน root config ที่ออบเจ็กต์ของมันควร overlay ออบเจ็กต์ root ก่อนประเมินสัญญาณ ใช้สำหรับ config เฉพาะ capability เช่น `image`, `video` หรือ `music`   |
| `overlayMapPath` | ไม่       | `string`   | Dot path ภายใน root config ที่ค่าออบเจ็กต์แต่ละค่าควร overlay ออบเจ็กต์ root ใช้สำหรับแมปบัญชีที่มีชื่อ เช่น `accounts` โดยบัญชีใดก็ตามที่กำหนดค่าไว้ควรผ่านเงื่อนไข |
| `required`       | ไม่       | `string[]` | Dot path ภายใน config ที่มีผลซึ่งต้องมีค่าที่กำหนดค่าไว้ สตริงต้องไม่ว่างเปล่า ออบเจ็กต์และอาร์เรย์ต้องไม่ว่างเปล่า                                                  |
| `requiredAny`    | ไม่       | `string[]` | Dot path ภายใน config ที่มีผลซึ่งอย่างน้อยหนึ่งรายการต้องมีค่าที่กำหนดค่าไว้                                                                                                    |
| `mode`           | ไม่       | `object`   | ตัวป้องกันโหมดสตริงแบบเลือกได้ภายใน config ที่มีผล ใช้เมื่อความพร้อมใช้งานจาก config เท่านั้นมีผลเฉพาะกับโหมดเดียว                                                                  |

แต่ละตัวป้องกัน `mode` รองรับ:

| ฟิลด์        | จำเป็น | ชนิด       | ความหมาย                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | ไม่       | `string`   | Dot path ภายใน config ที่มีผล ค่าเริ่มต้นคือ `mode`                          |
| `default`    | ไม่       | `string`   | ค่าโหมดที่จะใช้เมื่อ config ละเว้น path                                  |
| `allowed`    | ไม่       | `string[]` | หากมี สัญญาณจะผ่านเฉพาะเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้ |
| `disallowed` | ไม่       | `string[]` | หากมี สัญญาณจะล้มเหลวเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้       |

แต่ละรายการ `authSignals` รองรับ:

| ฟิลด์             | จำเป็น | ชนิด     | ความหมาย                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string` | id ผู้ให้บริการที่จะตรวจในโปรไฟล์ auth ที่กำหนดค่าไว้                                                                                                                             |
| `providerBaseUrl` | ไม่       | `object` | ตัวป้องกันแบบเลือกได้ที่ทำให้สัญญาณถูกนับเฉพาะเมื่อผู้ให้บริการที่กำหนดค่าไว้ซึ่งอ้างอิงใช้ base URL ที่อนุญาต ใช้เมื่อ alias ของ auth ใช้ได้เฉพาะกับ API บางรายการ |

แต่ละตัวป้องกัน `providerBaseUrl` รองรับ:

| ฟิลด์             | จำเป็น | ชนิด       | ความหมาย                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string`   | id config ของผู้ให้บริการที่ควรตรวจ `baseUrl`                                                                                                |
| `defaultBaseUrl`  | ไม่       | `string`   | Base URL ที่จะสมมติใช้เมื่อ config ของผู้ให้บริการละเว้น `baseUrl`                                                                                         |
| `allowedBaseUrls` | ใช่      | `string[]` | Base URL ที่อนุญาตสำหรับสัญญาณ auth นี้ สัญญาณจะถูกละเว้นเมื่อ base URL ที่กำหนดค่าไว้หรือค่าเริ่มต้นไม่ตรงกับหนึ่งในค่าที่ normalize แล้วเหล่านี้ |

## ข้อมูลอ้างอิงเมทาดาทาของเครื่องมือ

`toolMetadata` ใช้รูปทรง `configSignals` และ `authSignals` เดียวกับ
เมทาดาทาของผู้ให้บริการการสร้าง โดยใช้ชื่อเครื่องมือเป็นคีย์ `contracts.tools` ประกาศ
ความเป็นเจ้าของ `toolMetadata` ประกาศหลักฐานความพร้อมใช้งานที่มีต้นทุนต่ำ เพื่อให้ OpenClaw สามารถ
หลีกเลี่ยงการนำเข้า runtime ของ Plugin เพียงเพื่อให้ factory ของเครื่องมือนั้นคืนค่า `null`

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

หากเครื่องมือไม่มี `toolMetadata` OpenClaw จะคงพฤติกรรมเดิมไว้และ
โหลด Plugin เจ้าของเมื่อสัญญาเครื่องมือตรงกับ policy สำหรับเครื่องมือใน hot path
ที่ factory ขึ้นอยู่กับ auth/config ผู้เขียน Plugin ควรประกาศ
`toolMetadata` แทนการทำให้ core นำเข้า runtime เพื่อสอบถาม

## ข้อมูลอ้างอิง providerAuthChoices

แต่ละรายการ `providerAuthChoices` อธิบายตัวเลือก onboarding หรือ auth หนึ่งรายการ
OpenClaw อ่านข้อมูลนี้ก่อนโหลด runtime ของผู้ให้บริการ
รายการ setup ของผู้ให้บริการใช้ตัวเลือกใน manifest เหล่านี้, ตัวเลือก setup ที่ได้จาก descriptor
และเมทาดาทา install-catalog โดยไม่โหลด runtime ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ชนิด                                                                  | ความหมาย                                                                                            |
| --------------------- | -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                                              | id ของ Provider ที่ตัวเลือกนี้สังกัดอยู่                                                                      |
| `method`              | ใช่      | `string`                                                              | id ของเมธอดการยืนยันตัวตนที่จะ dispatch ไป                                                                           |
| `choiceId`            | ใช่      | `string`                                                              | id ตัวเลือกการยืนยันตัวตนที่เสถียร ซึ่งใช้โดยโฟลว์ onboarding และ CLI                                                  |
| `choiceLabel`         | ไม่       | `string`                                                              | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละไว้ OpenClaw จะ fallback ไปใช้ `choiceId`                                        |
| `choiceHint`          | ไม่       | `string`                                                              | ข้อความช่วยเหลือสั้นๆ สำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่       | `number`                                                              | ค่าที่ต่ำกว่าจะถูกเรียงก่อนในตัวเลือกแบบโต้ตอบที่ assistant ขับเคลื่อน                                       |
| `assistantVisibility` | ไม่       | `"visible"` \| `"manual-only"`                                        | ซ่อนตัวเลือกจากตัวเลือกของ assistant แต่ยังอนุญาตให้เลือกด้วย CLI แบบแมนนวลได้                        |
| `deprecatedChoiceIds` | ไม่       | `string[]`                                                            | id ตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้มายังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่       | `string`                                                              | id กลุ่มแบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้องกัน                                                          |
| `groupLabel`          | ไม่       | `string`                                                              | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่       | `string`                                                              | ข้อความช่วยเหลือสั้นๆ สำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่       | `string`                                                              | คีย์ตัวเลือกภายในสำหรับโฟลว์การยืนยันตัวตนแบบแฟล็กเดียวที่เรียบง่าย                                                      |
| `cliFlag`             | ไม่       | `string`                                                              | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่       | `string`                                                              | รูปแบบตัวเลือก CLI แบบเต็ม เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่       | `string`                                                              | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                                            |
| `onboardingScopes`    | ไม่       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | พื้นผิว onboarding ที่ตัวเลือกนี้ควรปรากฏ หากละไว้ ค่าเริ่มต้นคือ `["text-inference"]` |

## ข้อมูลอ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่ง runtime ที่ผู้ใช้อาจ
ใส่ใน `plugins.allow` โดยผิดพลาด หรือพยายามรันเป็นคำสั่ง CLI ระดับ root OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ import โค้ด runtime ของ Plugin

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
| `kind`       | ไม่       | `"runtime-slash"` | ระบุว่า alias เป็นคำสั่ง slash ในแชต ไม่ใช่คำสั่ง CLI ระดับ root |
| `cliCommand` | ไม่       | `string`          | คำสั่ง CLI ระดับ root ที่เกี่ยวข้องเพื่อแนะนำสำหรับการดำเนินการ CLI หากมี  |

## ข้อมูลอ้างอิง activation

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผน activation/load

บล็อกนี้เป็น metadata สำหรับ planner ไม่ใช่ lifecycle API บล็อกนี้ไม่ลงทะเบียน
พฤติกรรม runtime ไม่แทนที่ `register(...)` และไม่ให้สัญญาว่า
โค้ด Plugin ได้รันแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ที่เป็นผู้สมัครก่อน fallback ไปยัง metadata ความเป็นเจ้าของใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ควรใช้ metadata ที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของอยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, ตัวอธิบาย setup หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์ได้ ใช้ `activation` สำหรับ hint เพิ่มเติมของ planner
ที่ไม่สามารถแทนด้วยฟิลด์ความเป็นเจ้าของเหล่านั้นได้
ใช้ `cliBackends` ระดับบนสุดสำหรับ alias runtime ของ CLI เช่น `claude-cli`,
`my-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้สำหรับ
id ของ embedded agent harness ที่ยังไม่มีฟิลด์ความเป็นเจ้าของเท่านั้น

บล็อกนี้เป็น metadata เท่านั้น บล็อกนี้ไม่ลงทะเบียนพฤติกรรม runtime และไม่
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint runtime/Plugin อื่นๆ
consumer ปัจจุบันใช้บล็อกนี้เป็น hint สำหรับจำกัดขอบเขตก่อนโหลด Plugin แบบกว้างขึ้น ดังนั้น
metadata activation ที่ไม่ใช่ startup ซึ่งขาดหายไปโดยทั่วไปจึงมีผลแค่ด้านประสิทธิภาพเท่านั้น และ
ไม่ควรเปลี่ยนความถูกต้องตราบใดที่ fallback ความเป็นเจ้าของจาก manifest ยังมีอยู่

ทุก Plugin ควรกำหนด `activation.onStartup` อย่างตั้งใจ ตั้งค่าเป็น `true`
เฉพาะเมื่อ Plugin ต้องรันระหว่างการเริ่มต้น Gateway ตั้งค่าเป็น `false` เมื่อ
Plugin ไม่ทำงานที่ startup และควรโหลดจาก trigger ที่แคบกว่าเท่านั้น
การละ `onStartup` จะไม่ startup-load Plugin โดยปริยายอีกต่อไป ให้ใช้
metadata activation ที่ชัดเจนสำหรับ startup, channel, config, agent-harness, memory หรือ
trigger activation อื่นที่แคบกว่า

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

| ฟิลด์              | จำเป็น | ชนิด                                                 | ความหมาย                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | ไม่       | `boolean`                                            | การ activation เมื่อเริ่มต้น Gateway แบบชัดเจน ทุก Plugin ควรกำหนดค่านี้ `true` จะ import Plugin ระหว่าง startup; `false` ทำให้ยัง lazy ตอน startup เว้นแต่ trigger อื่นที่ตรงกันต้องโหลด |
| `onProviders`      | ไม่       | `string[]`                                           | id ของ Provider ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                      |
| `onAgentHarnesses` | ไม่       | `string[]`                                           | id runtime ของ embedded agent harness ที่ควรรวม Plugin นี้ไว้ในแผน activation/load ใช้ `cliBackends` ระดับบนสุดสำหรับ alias ของ backend CLI                                           |
| `onCommands`       | ไม่       | `string[]`                                           | id คำสั่งที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onChannels`       | ไม่       | `string[]`                                           | id ของ channel ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onRoutes`         | ไม่       | `string[]`                                           | ชนิด route ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onConfigPaths`    | ไม่       | `string[]`                                           | path config ที่สัมพันธ์กับ root ซึ่งควรรวม Plugin นี้ไว้ในแผน startup/load เมื่อมี path นั้นอยู่และไม่ได้ถูกปิดใช้งานอย่างชัดเจน                                                      |
| `onCapabilities`   | ไม่       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | hint ความสามารถแบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ควรใช้ฟิลด์ที่แคบกว่าเมื่อเป็นไปได้                                                                                     |

consumer สดปัจจุบัน:

- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับ startup
  import แบบชัดเจน
- การวางแผน CLI ที่ trigger ด้วยคำสั่ง fallback ไปยัง legacy
  `commandAliases[].cliCommand` หรือ `commandAliases[].name`
- การวางแผน startup ของ agent-runtime ใช้ `activation.onAgentHarnesses` สำหรับ
  embedded harnesses และ `cliBackends[]` ระดับบนสุดสำหรับ alias runtime ของ CLI
- การวางแผน setup/channel ที่ trigger ด้วย channel fallback ไปยังความเป็นเจ้าของ legacy `channels[]`
  เมื่อ metadata activation ของ channel แบบชัดเจนขาดหายไป
- การวางแผน Plugin ตอน startup ใช้ `activation.onConfigPaths` สำหรับพื้นผิว config ระดับ root ที่ไม่ใช่ channel
  เช่นบล็อก `browser` ของ Plugin browser ที่ bundled มา
- การวางแผน setup/runtime ที่ trigger ด้วย Provider fallback ไปยังความเป็นเจ้าของ legacy
  `providers[]` และ `cliBackends[]` ระดับบนสุด เมื่อ metadata activation ของ Provider แบบชัดเจน
  ขาดหายไป

การวินิจฉัยของ planner สามารถแยก hint activation แบบชัดเจนออกจาก fallback
ความเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายถึง
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายถึง
planner ใช้ความเป็นเจ้าของ `commandAliases` แทน ป้ายเหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยและการทดสอบของ host; ผู้เขียน Plugin ควรประกาศ metadata
ที่อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง qaRunners

ใช้ `qaRunners` เมื่อ Plugin เพิ่ม transport runner หนึ่งรายการขึ้นไปไว้ใต้
root `openclaw qa` ที่ใช้ร่วมกัน รักษา metadata นี้ให้ประหยัดและเป็น static; runtime ของ Plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
แบบเบาที่ export `qaRunnerCliRegistrations`

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
| `commandName` | ใช่      | `string` | คำสั่งย่อยที่เมานต์อยู่ใต้ `openclaw qa` เช่น `matrix`    |
| `description` | ไม่       | `string` | ข้อความช่วยเหลือสำรองที่ใช้เมื่อโฮสต์ที่ใช้ร่วมกันต้องมีคำสั่ง stub |

## ข้อมูลอ้างอิง setup

ใช้ `setup` เมื่อพื้นผิวการตั้งค่าและการเริ่มใช้งานต้องการเมทาดาทาราคาถูกที่ Plugin เป็นเจ้าของก่อนที่รันไทม์จะโหลด

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

`cliBackends` ระดับบนสุดยังคงใช้ได้และยังอธิบายแบ็กเอนด์การอนุมานของ CLI ต่อไป `setup.cliBackends` คือพื้นผิวดีสคริปเตอร์เฉพาะการตั้งค่าสำหรับโฟลว์ control-plane/setup ที่ควรคงเป็นเมทาดาทาเท่านั้น

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็นพื้นผิวการค้นหาแบบดีสคริปเตอร์ก่อนที่แนะนำสำหรับการค้นพบการตั้งค่า หากดีสคริปเตอร์เพียงจำกัด Plugin ตัวเลือกให้แคบลง และการตั้งค่ายังต้องใช้ฮุกของรันไทม์ในช่วงตั้งค่าที่สมบูรณ์กว่า ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็นเส้นทางการทำงานสำรอง

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหาการยืนยันตัวตนผู้ให้บริการทั่วไปและการค้นหา env-var ด้วย `providerAuthEnvVars` ยังคงรองรับผ่านอะแดปเตอร์ความเข้ากันได้ระหว่างช่วงเลิกใช้ แต่ Plugin ที่ไม่ถูกบันเดิลซึ่งยังใช้อยู่จะได้รับการวินิจฉัย manifest Plugin ใหม่ควรวางเมทาดาทา env ของการตั้งค่า/สถานะไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือกการตั้งค่าง่าย ๆ จาก `setup.providers[].authMethods` เมื่อไม่มีรายการการตั้งค่า หรือเมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้รันไทม์การตั้งค่า รายการ `providerAuthChoices` แบบชัดเจนยังคงเป็นตัวเลือกที่แนะนำสำหรับป้ายกำกับแบบกำหนดเอง แฟล็ก CLI ขอบเขตการเริ่มใช้งาน และเมทาดาทาของผู้ช่วย

ตั้ง `requiresRuntime: false` เฉพาะเมื่อดีสคริปเตอร์เหล่านั้นเพียงพอสำหรับพื้นผิวการตั้งค่า OpenClaw ถือค่า `false` แบบชัดเจนเป็นสัญญาแบบดีสคริปเตอร์เท่านั้น และจะไม่เรียกใช้ `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหาการตั้งค่า หาก Plugin แบบดีสคริปเตอร์เท่านั้นยังส่งรายการรันไทม์การตั้งค่าอย่างใดอย่างหนึ่งเหล่านั้นมาด้วย OpenClaw จะรายงานการวินิจฉัยแบบเพิ่มเติมและยังคงเพิกเฉยต่อรายการนั้น การละ `requiresRuntime` ไว้จะคงพฤติกรรมสำรองแบบเดิมไว้ เพื่อไม่ให้ Plugin ที่มีอยู่ซึ่งเพิ่มดีสคริปเตอร์โดยไม่มีแฟล็กเสียหาย

เนื่องจากการค้นหาการตั้งค่าสามารถเรียกใช้โค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้ ค่า `setup.providers[].id` และ `setup.cliBackends[]` ที่ทำให้เป็นรูปแบบปกติแล้วต้องไม่ซ้ำกันในทุก Plugin ที่ค้นพบ ความเป็นเจ้าของที่กำกวมจะล้มเหลวแบบปิดแทนที่จะเลือกผู้ชนะจากลำดับการค้นพบ

เมื่อรันไทม์การตั้งค่าถูกเรียกใช้จริง การวินิจฉัยรีจิสทรีการตั้งค่าจะรายงานความคลาดเคลื่อนของดีสคริปเตอร์ หาก `setup-api` ลงทะเบียนผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ดีสคริปเตอร์ manifest ไม่ได้ประกาศ หรือหากดีสคริปเตอร์ไม่มีการลงทะเบียนรันไทม์ที่ตรงกัน การวินิจฉัยเหล่านี้เป็นแบบเพิ่มเติมและไม่ปฏิเสธ Plugin เดิม

### ข้อมูลอ้างอิง setup.providers

| ฟิลด์          | จำเป็น | ประเภท       | ความหมาย                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่      | `string`   | id ผู้ให้บริการที่เปิดเผยระหว่างการตั้งค่าหรือการเริ่มใช้งาน รักษา id ที่ทำให้เป็นรูปแบบปกติแล้วให้ไม่ซ้ำกันทั่วทั้งระบบ             |
| `authMethods`  | ไม่       | `string[]` | id วิธีการตั้งค่า/ยืนยันตัวตนที่ผู้ให้บริการนี้รองรับโดยไม่ต้องโหลดรันไทม์เต็ม                       |
| `envVars`      | ไม่       | `string[]` | Env vars ที่พื้นผิวการตั้งค่า/สถานะทั่วไปสามารถตรวจสอบได้ก่อนที่รันไทม์ของ Plugin จะโหลด               |
| `authEvidence` | ไม่       | `object[]` | การตรวจสอบหลักฐานการยืนยันตัวตนในเครื่องราคาถูกสำหรับผู้ให้บริการที่สามารถยืนยันตัวตนผ่าน marker ที่ไม่ใช่ความลับ |

`authEvidence` มีไว้สำหรับ marker ข้อมูลประจำตัวในเครื่องที่ผู้ให้บริการเป็นเจ้าของ ซึ่งสามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ดรันไทม์ การตรวจสอบเหล่านี้ต้องยังคงราคาถูกและอยู่ในเครื่อง: ไม่มีการเรียกเครือข่าย ไม่มีการอ่าน keychain หรือตัวจัดการความลับ ไม่มีคำสั่ง shell และไม่มีการ probe API ของผู้ให้บริการ

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่       | `string`   | Env var ที่มีพาธไฟล์ข้อมูลประจำตัวแบบชัดเจน                                                           |
| `fallbackPaths`    | ไม่       | `string[]` | พาธไฟล์ข้อมูลประจำตัวในเครื่องที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีอยู่หรือว่าง รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่       | `string[]` | ต้องมี env var อย่างน้อยหนึ่งรายการที่ระบุไว้ไม่ว่างก่อนที่หลักฐานจะใช้ได้                                    |
| `requiresAllEnv`   | ไม่       | `string[]` | env var ทุกตัวที่ระบุไว้ต้องไม่ว่างก่อนที่หลักฐานจะใช้ได้                                           |
| `credentialMarker` | ใช่      | `string`   | marker ที่ไม่ใช่ความลับซึ่งส่งคืนเมื่อมีหลักฐาน                                                       |
| `source`           | ไม่       | `string`   | ป้ายกำกับแหล่งที่มาที่แสดงต่อผู้ใช้สำหรับเอาต์พุตการยืนยันตัวตน/สถานะ                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่       | `object[]` | ดีสคริปเตอร์การตั้งค่าผู้ให้บริการที่เปิดเผยระหว่างการตั้งค่าและการเริ่มใช้งาน                                     |
| `cliBackends`      | ไม่       | `string[]` | id แบ็กเอนด์ช่วงตั้งค่าที่ใช้สำหรับการค้นหาการตั้งค่าแบบดีสคริปเตอร์ก่อน รักษา id ที่ทำให้เป็นรูปแบบปกติแล้วให้ไม่ซ้ำกันทั่วทั้งระบบ |
| `configMigrations` | ไม่       | `string[]` | id การย้าย config ที่พื้นผิวการตั้งค่าของ Plugin นี้เป็นเจ้าของ                                          |
| `requiresRuntime`  | ไม่       | `boolean`  | ระบุว่าการตั้งค่ายังต้องใช้การเรียกใช้ `setup-api` หลังการค้นหาดีสคริปเตอร์หรือไม่                            |

## ข้อมูลอ้างอิง uiHints

`uiHints` คือแผนที่จากชื่อฟิลด์ config ไปยังคำใบ้การเรนเดอร์ขนาดเล็ก

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

คำใบ้ของแต่ละฟิลด์สามารถมี:

| ฟิลด์         | ประเภท       | ความหมาย                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ป้ายกำกับฟิลด์ที่แสดงต่อผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือสั้น ๆ                      |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นความลับหรืออ่อนไหว |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตฟอร์ม       |

## ข้อมูลอ้างอิง contracts

ใช้ `contracts` เฉพาะสำหรับเมทาดาทาความเป็นเจ้าของ capability แบบสแตติกที่ OpenClaw สามารถอ่านได้โดยไม่ต้องนำเข้ารันไทม์ของ Plugin

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

แต่ละรายการเป็นแบบไม่บังคับ:

| ฟิลด์                            | ชนิด       | ความหมาย                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | id ของ extension factory สำหรับ app-server ของ Codex ปัจจุบันคือ `codex-app-server`                                                                |
| `agentToolResultMiddleware`      | `string[]` | id ของรันไทม์ที่ Plugin นี้อาจลงทะเบียนมิดเดิลแวร์ผลลัพธ์เครื่องมือให้ได้                                                                     |
| `trustedToolPolicies`            | `string[]` | id ของนโยบายก่อนใช้เครื่องมือที่เชื่อถือได้แบบโลคัลของ Plugin ซึ่ง Plugin ที่ติดตั้งแล้วอาจลงทะเบียนได้ Plugin ที่บันเดิลมาด้วยอาจลงทะเบียนนโยบายได้โดยไม่ต้องมีฟิลด์นี้ |
| `externalAuthProviders`          | `string[]` | id ของผู้ให้บริการที่ Plugin นี้เป็นเจ้าของฮุกโปรไฟล์การยืนยันตัวตนภายนอก                                                                      |
| `embeddingProviders`             | `string[]` | id ของผู้ให้บริการ embedding ทั่วไปที่ Plugin นี้เป็นเจ้าของสำหรับการใช้ vector embedding ซ้ำได้ รวมถึงหน่วยความจำ                                 |
| `speechProviders`                | `string[]` | id ของผู้ให้บริการเสียงพูดที่ Plugin นี้เป็นเจ้าของ                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | id ของผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่ Plugin นี้เป็นเจ้าของ                                                                                |
| `realtimeVoiceProviders`         | `string[]` | id ของผู้ให้บริการเสียงแบบเรียลไทม์ที่ Plugin นี้เป็นเจ้าของ                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | id ของผู้ให้บริการ embedding เฉพาะหน่วยความจำที่เลิกใช้แล้วซึ่ง Plugin นี้เป็นเจ้าของ                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | id ของผู้ให้บริการทำความเข้าใจสื่อที่ Plugin นี้เป็นเจ้าของ                                                                                   |
| `transcriptSourceProviders`      | `string[]` | id ของผู้ให้บริการแหล่งถอดความที่ Plugin นี้เป็นเจ้าของ                                                                                     |
| `imageGenerationProviders`       | `string[]` | id ของผู้ให้บริการสร้างภาพที่ Plugin นี้เป็นเจ้าของ                                                                                      |
| `videoGenerationProviders`       | `string[]` | id ของผู้ให้บริการสร้างวิดีโอที่ Plugin นี้เป็นเจ้าของ                                                                                      |
| `webFetchProviders`              | `string[]` | id ของผู้ให้บริการดึงข้อมูลเว็บที่ Plugin นี้เป็นเจ้าของ                                                                                             |
| `webSearchProviders`             | `string[]` | id ของผู้ให้บริการค้นหาเว็บที่ Plugin นี้เป็นเจ้าของ                                                                                            |
| `migrationProviders`             | `string[]` | id ของผู้ให้บริการนำเข้าที่ Plugin นี้เป็นเจ้าของสำหรับ `openclaw migrate`                                                                         |
| `gatewayMethodDispatch`          | `string[]` | สิทธิ์ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ที่ผ่านการยืนยันตัวตนซึ่ง dispatch เมธอด Gateway ภายในกระบวนการ                                  |
| `tools`                          | `string[]` | ชื่อเครื่องมือของเอเจนต์ที่ Plugin นี้เป็นเจ้าของ                                                                                                   |

`contracts.embeddedExtensionFactories` ถูกเก็บไว้สำหรับ extension factory
แบบเฉพาะ app-server ของ Codex ที่บันเดิลมาด้วยเท่านั้น การแปลงผลลัพธ์เครื่องมือที่บันเดิลมาด้วยควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน Plugin ที่ติดตั้งแล้วอาจใช้
จุดเชื่อมมิดเดิลแวร์เดียวกันได้เฉพาะเมื่อเปิดใช้อย่างชัดเจน และเฉพาะสำหรับรันไทม์ที่
ประกาศไว้ใน `contracts.agentToolResultMiddleware` เท่านั้น

Plugin ที่ติดตั้งแล้วซึ่งต้องใช้ชั้นนโยบายก่อนใช้เครื่องมือที่โฮสต์เชื่อถือ ต้องประกาศ
id โลคัลแต่ละรายการที่ลงทะเบียนไว้ใน `contracts.trustedToolPolicies` และต้องถูกเปิดใช้อย่างชัดเจน
Plugin ที่บันเดิลมาด้วยยังคงใช้เส้นทาง trusted-policy เดิม แต่ Plugin ที่ติดตั้งแล้ว
ซึ่งมี id นโยบายที่ไม่ได้ประกาศจะถูกปฏิเสธก่อนการลงทะเบียน id ของนโยบาย
ถูกจำกัดขอบเขตไว้กับ Plugin ที่ลงทะเบียน ดังนั้น Plugin สองตัวอาจประกาศและ
ลงทะเบียน `workflow-budget` ได้ทั้งคู่ แต่ Plugin ตัวเดียวกันไม่สามารถลงทะเบียน id โลคัลเดียวกัน
ซ้ำสองครั้งได้

การลงทะเบียน `api.registerTool(...)` ของรันไทม์ต้องตรงกับ `contracts.tools`
การค้นหาเครื่องมือใช้รายการนี้เพื่อโหลดเฉพาะรันไทม์ของ Plugin ที่สามารถเป็นเจ้าของ
เครื่องมือที่ร้องขอได้

Plugin ผู้ให้บริการที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders`; ฮุก external-auth ที่ไม่ได้ประกาศจะถูกละเว้น

ผู้ให้บริการ embedding ทั่วไปควรประกาศ `contracts.embeddingProviders` สำหรับ
แต่ละ adapter ที่ลงทะเบียนด้วย `api.registerEmbeddingProvider(...)` ใช้
สัญญาทั่วไปสำหรับการสร้างเวกเตอร์ที่ใช้ซ้ำได้ รวมถึงผู้ให้บริการที่ถูกใช้โดย
การค้นหาหน่วยความจำ `contracts.memoryEmbeddingProviders` เป็นความเข้ากันได้
เฉพาะหน่วยความจำที่เลิกใช้แล้ว และยังคงอยู่เฉพาะระหว่างที่ผู้ให้บริการเดิมย้าย
ไปยังจุดเชื่อมผู้ให้บริการ embedding แบบทั่วไป

ปัจจุบัน `contracts.gatewayMethodDispatch` รับ
`"authenticated-request"` ได้ เป็นด่านสุขอนามัยของ API สำหรับเส้นทาง HTTP
ของ Plugin แบบเนทีฟที่ตั้งใจ dispatch เมธอด control-plane ของ Gateway ภายในกระบวนการ
ไม่ใช่ sandbox สำหรับป้องกัน Plugin เนทีฟที่เป็นอันตราย ใช้เฉพาะกับพื้นผิว
ที่บันเดิลมาด้วยหรือสำหรับโอเปอเรเตอร์ซึ่งผ่านการตรวจทานอย่างเข้มงวด และต้องใช้การยืนยันตัวตน HTTP ของ Gateway อยู่แล้ว

## อ้างอิง mediaUnderstandingProviderMetadata

ใช้ `mediaUnderstandingProviderMetadata` เมื่อผู้ให้บริการทำความเข้าใจสื่อมี
โมเดลเริ่มต้น ลำดับความสำคัญของ fallback การยืนยันตัวตนอัตโนมัติ หรือการรองรับเอกสารเนทีฟที่
ตัวช่วยทั่วไปของ core ต้องใช้ก่อนโหลดรันไทม์ คีย์ต้องถูกประกาศใน
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

| ฟิลด์                  | ชนิด                                | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | ความสามารถด้านสื่อที่ผู้ให้บริการนี้เปิดเผย                                 |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นของความสามารถต่อโมเดลที่ใช้เมื่อ config ไม่ได้ระบุโมเดล      |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะเรียงก่อนสำหรับ fallback ผู้ให้บริการตามข้อมูลรับรองโดยอัตโนมัติ |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารเนทีฟที่ผู้ให้บริการรองรับ                            |

## อ้างอิง channelConfigs

ใช้ `channelConfigs` เมื่อ Plugin ช่องทางต้องใช้ metadata ของ config ที่มีต้นทุนต่ำก่อน
โหลดรันไทม์ การค้นหาการตั้งค่า/สถานะแบบอ่านอย่างเดียวของช่องทางสามารถใช้ metadata นี้
โดยตรงสำหรับช่องทางภายนอกที่กำหนดค่าไว้เมื่อไม่มีรายการตั้งค่าให้ใช้ หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องมีรันไทม์สำหรับการตั้งค่า

`channelConfigs` เป็น metadata ใน manifest ของ Plugin ไม่ใช่ส่วน config ผู้ใช้ระดับบนสุด
ส่วนใหม่ ผู้ใช้ยังคงกำหนดค่าอินสแตนซ์ช่องทางภายใต้ `channels.<channel-id>`
OpenClaw อ่าน metadata ใน manifest เพื่อตัดสินว่า Plugin ใดเป็นเจ้าของช่องทาง
ที่กำหนดค่าไว้นั้น ก่อนที่โค้ดรันไทม์ของ Plugin จะทำงาน

สำหรับ Plugin ช่องทาง `configSchema` และ `channelConfigs` อธิบายเส้นทางที่ต่างกัน:

- `configSchema` ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบ `channels.<channel-id>`

Plugin ที่ไม่ได้บันเดิลมาด้วยซึ่งประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มี OpenClaw ยังสามารถโหลด Plugin ได้ แต่
schema ของ config ในเส้นทาง cold-path, การตั้งค่า, และพื้นผิว Control UI จะไม่สามารถรู้
รูปร่างตัวเลือกที่ช่องทางเป็นเจ้าของได้จนกว่ารันไทม์ของ Plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้น `auto` แบบสแตติกสำหรับการตรวจสอบ config คำสั่ง
ที่ทำงานก่อนโหลดรันไทม์ของช่องทาง ช่องทางที่บันเดิลมาด้วยยังสามารถเผยแพร่
ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
metadata แค็ตตาล็อกช่องทางอื่น ๆ ที่ package เป็นเจ้าของได้

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

| ฟิลด์         | ชนิด                     | ความหมาย                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับรายการ config ช่องทางแต่ละรายการที่ประกาศไว้         |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ UI/placeholder/คำใบ้ข้อมูลอ่อนไหวที่เป็นตัวเลือกสำหรับส่วนนั้นของ config ช่องทาง          |
| `label`       | `string`                 | ป้ายกำกับช่องทางที่รวมเข้ากับ picker และพื้นผิว inspect เมื่อ metadata ของรันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายช่องทางสั้น ๆ สำหรับพื้นผิว inspect และแค็ตตาล็อก                               |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติแบบสแตติกสำหรับคำสั่งเนทีฟและ Skills เนทีฟสำหรับการตรวจสอบ config ก่อนรันไทม์       |
| `preferOver`  | `string[]`               | id ของ Plugin แบบเดิมหรือมีลำดับความสำคัญต่ำกว่าที่ช่องทางนี้ควรอยู่เหนือกว่าในพื้นผิวการเลือก    |

### การแทนที่ Plugin ช่องทางอื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับ id ช่องทางที่
Plugin อื่นก็สามารถให้ได้เช่นกัน กรณีทั่วไปคือ id ของ Plugin ที่เปลี่ยนชื่อ,
Plugin แบบสแตนด์อโลนที่มาแทน Plugin ที่บันเดิลมาด้วย, หรือ fork ที่มีการดูแลต่อ
ซึ่งคง id ช่องทางเดิมไว้เพื่อความเข้ากันได้ของ config

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

เมื่อกำหนดค่า `channels.chat` แล้ว OpenClaw จะพิจารณาทั้ง id ช่องทางและ
id ของ Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
เป็น Plugin ที่บันเดิลมาด้วยหรือถูกเปิดใช้โดยค่าเริ่มต้น OpenClaw จะปิดใช้งานใน
config รันไทม์ที่มีผล เพื่อให้ Plugin เดียวเป็นเจ้าของช่องทางและเครื่องมือของช่องทางนั้น
การเลือกของผู้ใช้ที่ชัดเจนยังคงมีผลเหนือกว่า: หากผู้ใช้เปิดใช้ Plugin ทั้งสองอย่างชัดเจน
OpenClaw จะรักษาตัวเลือกนั้นไว้และรายงานการวินิจฉัยช่องทาง/เครื่องมือซ้ำ แทนที่จะ
เปลี่ยนชุด Plugin ที่ร้องขอแบบเงียบ ๆ

จำกัดขอบเขต `preferOver` ไว้กับ id ของ Plugin ที่สามารถให้ช่องทางเดียวกันได้จริง
ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อคีย์ config ของผู้ใช้

## อ้างอิง modelSupport

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน provider plugin ของคุณจาก
รหัสโมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่ plugin runtime
จะโหลด

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw ใช้ลำดับความสำคัญนี้:

- การอ้างอิง `provider/model` แบบชัดเจนจะใช้เมทาดาทา manifest ของ `providers` ที่เป็นเจ้าของ
- `modelPatterns` มีลำดับเหนือกว่า `modelPrefixes`
- หาก plugin ที่ไม่ถูกบันเดิลหนึ่งตัวและ plugin ที่ถูกบันเดิลหนึ่งตัวตรงกันทั้งคู่ plugin
  ที่ไม่ถูกบันเดิลจะชนะ
- ความกำกวมที่เหลือจะถูกละเว้นจนกว่าผู้ใช้หรือ config จะระบุ provider

ฟิลด์:

| ฟิลด์           | ชนิด       | ความหมาย                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | คำนำหน้าที่จับคู่ด้วย `startsWith` กับรหัสโมเดลแบบย่อ                 |
| `modelPatterns` | `string[]` | ซอร์สของ Regex ที่จับคู่กับรหัสโมเดลแบบย่อหลังจากลบส่วนต่อท้ายของโปรไฟล์แล้ว |

รายการ `modelPatterns` จะถูกคอมไพล์ผ่าน `compileSafeRegex` ซึ่งปฏิเสธ
แพตเทิร์นที่มีการทำซ้ำแบบซ้อนกัน (เช่น `(a+)+$`) แพตเทิร์นที่ไม่ผ่าน
การตรวจสอบความปลอดภัยจะถูกข้ามอย่างเงียบ ๆ เช่นเดียวกับ regex ที่ไวยากรณ์ไม่ถูกต้อง
ให้ใช้แพตเทิร์นที่เรียบง่ายและหลีกเลี่ยง quantifier แบบซ้อนกัน

## อ้างอิง modelCatalog

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้เมทาดาทาโมเดลของ provider ก่อน
โหลด plugin runtime นี่คือแหล่งที่เป็นของ manifest สำหรับแถวแค็ตตาล็อกแบบคงที่,
นามแฝงของ provider, กฎการระงับ และโหมดการค้นพบ การรีเฟรช runtime
ยังคงเป็นหน้าที่ของโค้ด provider runtime แต่ manifest จะบอก core ว่าเมื่อใดต้องใช้ runtime

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

| ฟิลด์            | ชนิด                                                     | ความหมาย                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | แถวแค็ตตาล็อกสำหรับรหัส provider ที่ plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย       |
| `aliases`        | `Record<string, object>`                                 | นามแฝงของ provider ที่ควร resolve ไปยัง provider ที่เป็นเจ้าของสำหรับการวางแผนแค็ตตาล็อกหรือการระงับ              |
| `suppressions`   | `object[]`                                               | แถวโมเดลจากแหล่งอื่นที่ plugin นี้ระงับด้วยเหตุผลเฉพาะของ provider                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | ระบุว่าแค็ตตาล็อกของ provider สามารถอ่านจากเมทาดาทา manifest, รีเฟรชเข้า cache, หรือต้องใช้ runtime |
| `runtimeAugment` | `boolean`                                                | ตั้งเป็น `true` เฉพาะเมื่อ provider runtime ต้องต่อท้ายแถวแค็ตตาล็อกหลังการวางแผน manifest/config       |

`aliases` มีส่วนร่วมในการค้นหาความเป็นเจ้าของของ provider สำหรับการวางแผน model-catalog
เป้าหมายของนามแฝงต้องเป็น provider ระดับบนสุดที่ plugin เดียวกันเป็นเจ้าของ เมื่อรายการ
ที่กรองด้วย provider ใช้นามแฝง OpenClaw จะอ่าน manifest ของเจ้าของและ
ใช้การ override API/base URL ของนามแฝงได้โดยไม่ต้องโหลด provider runtime
นามแฝงจะไม่ขยายรายการแค็ตตาล็อกที่ไม่ได้กรอง รายการแบบกว้างจะแสดงเฉพาะแถว
ของ provider canonical ที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ hook `suppressBuiltInModel` ของ provider runtime แบบเก่า
รายการการระงับจะมีผลเฉพาะเมื่อ provider เป็นของ plugin หรือ
ประกาศเป็นคีย์ `modelCatalog.aliases` ที่ชี้ไปยัง provider ที่เป็นเจ้าของเท่านั้น hook การระงับ
ของ runtime จะไม่ถูกเรียกอีกต่อไประหว่างการ resolve โมเดล

ฟิลด์ของ provider:

| ฟิลด์     | ชนิด                     | ความหมาย                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL เริ่มต้นแบบไม่บังคับสำหรับโมเดลในแค็ตตาล็อก provider นี้    |
| `api`     | `ModelApi`               | adapter API เริ่มต้นแบบไม่บังคับสำหรับโมเดลในแค็ตตาล็อก provider นี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่ไม่บังคับ ซึ่งใช้กับแค็ตตาล็อก provider นี้      |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละเว้น            |

ฟิลด์ของโมเดล:

| ฟิลด์           | ชนิด                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | รหัสโมเดลภายใน provider โดยไม่มีคำนำหน้า `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่แสดงแบบไม่บังคับ                                                      |
| `api`           | `ModelApi`                                                     | การ override API รายโมเดลแบบไม่บังคับ                                            |
| `baseUrl`       | `string`                                                       | การ override base URL รายโมเดลแบบไม่บังคับ                                       |
| `headers`       | `Record<string, string>`                                       | header แบบคงที่รายโมเดลแบบไม่บังคับ                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | modality ที่โมเดลรับได้                                               |
| `reasoning`     | `boolean`                                                      | ระบุว่าโมเดลเปิดเผยพฤติกรรมการให้เหตุผลหรือไม่                               |
| `contextWindow` | `number`                                                       | หน้าต่าง context ดั้งเดิมของ provider                                             |
| `contextTokens` | `number`                                                       | เพดาน context runtime ที่มีผลแบบไม่บังคับ เมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวน token เอาต์พุตสูงสุดเมื่อทราบ                                           |
| `cost`          | `object`                                                       | ราคา USD ต่อหนึ่งล้าน token แบบไม่บังคับ รวมถึง `tieredPricing` แบบไม่บังคับ |
| `compat`        | `object`                                                       | flag ความเข้ากันได้แบบไม่บังคับที่ตรงกับความเข้ากันได้ของ config โมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะการแสดงรายการ ระงับเฉพาะเมื่อแถวนั้นต้องไม่ปรากฏเลย          |
| `statusReason`  | `string`                                                       | เหตุผลแบบไม่บังคับที่แสดงพร้อมสถานะที่ไม่พร้อมใช้งาน                            |
| `replaces`      | `string[]`                                                     | รหัสโมเดลภายใน provider รุ่นเก่าที่โมเดลนี้แทนที่                       |
| `replacedBy`    | `string`                                                       | รหัสโมเดลภายใน provider ที่มาแทนสำหรับแถวที่ deprecated                    |
| `tags`          | `string[]`                                                     | แท็กที่เสถียรซึ่งใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์การระงับ:

| ฟิลด์                      | ชนิด       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | รหัส provider สำหรับแถว upstream ที่ต้องระงับ ต้องเป็นของ plugin นี้หรือประกาศเป็นนามแฝงที่เป็นเจ้าของ |
| `model`                    | `string`   | รหัสโมเดลภายใน provider ที่ต้องระงับ                                                                      |
| `reason`                   | `string`   | ข้อความแบบไม่บังคับที่แสดงเมื่อมีการร้องขอแถวที่ถูกระงับโดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายการ host ของ base URL ของ provider ที่มีผลแบบไม่บังคับ ซึ่งต้องตรงก่อนจึงจะใช้การระงับ               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของ provider-config แบบตรงตัวที่ไม่บังคับ ซึ่งต้องตรงก่อนจึงจะใช้การระงับ              |

อย่าใส่ข้อมูลที่มีเฉพาะ runtime ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อแถวใน manifest
สมบูรณ์พอให้พื้นผิวรายการที่กรองด้วย provider และตัวเลือกข้าม
การค้นพบ registry/runtime ได้ ใช้ `refreshable` เมื่อแถวใน manifest มีประโยชน์
ในฐานะ seed หรือส่วนเสริมที่แสดงเป็นรายการได้ แต่ refresh/cache สามารถเพิ่มแถวเพิ่มเติมภายหลังได้
แถวแบบ refreshable ไม่ถือเป็นแหล่งอ้างอิงที่เด็ดขาดด้วยตัวเอง ใช้ `runtime` เมื่อ OpenClaw
ต้องโหลด provider runtime เพื่อทราบรายการ

## อ้างอิง modelIdNormalization

ใช้ `modelIdNormalization` สำหรับการทำความสะอาด model-id ที่ provider เป็นเจ้าของแบบต้นทุนต่ำ ซึ่งต้อง
เกิดขึ้นก่อน provider runtime โหลด สิ่งนี้เก็บนามแฝง เช่น ชื่อโมเดลแบบสั้น,
รหัส legacy ภายใน provider และกฎคำนำหน้า proxy ไว้ใน manifest ของ plugin เจ้าของ
แทนที่จะอยู่ในตารางการเลือกโมเดลของ core

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

ฟิลด์ของ provider:

| ฟิลด์                                | ชนิด                    | ความหมาย                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | นามแฝง model-id แบบตรงตัวที่ไม่แยกตัวพิมพ์เล็กใหญ่ ค่าจะถูกส่งคืนตามที่เขียนไว้                  |
| `stripPrefixes`                      | `string[]`              | คำนำหน้าที่ต้องลบก่อนค้นหานามแฝง มีประโยชน์สำหรับ provider/model ซ้ำซ้อนแบบ legacy     |
| `prefixWhenBare`                     | `string`                | คำนำหน้าที่ต้องเพิ่มเมื่อรหัสโมเดลที่ normalize แล้ว ยังไม่มี `/`                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎคำนำหน้า bare-id แบบมีเงื่อนไขหลังค้นหานามแฝง โดยใช้คีย์ `modelPrefix` และ `prefix` |

## อ้างอิง providerEndpoints

ใช้ `providerEndpoints` สำหรับการจำแนก endpoint ที่นโยบายคำขอทั่วไป
ต้องรู้ก่อน provider runtime โหลด Core ยังคงเป็นเจ้าของความหมายของแต่ละ
`endpointClass`; plugin manifest เป็นเจ้าของเมทาดาทา host และ base URL

ฟิลด์ของ Endpoint:

| Field                          | Type       | ความหมาย                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาส endpoint หลักที่รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`        |
| `hosts`                        | `string[]` | ชื่อโฮสต์แบบตรงตัวที่แมปกับคลาส endpoint                                                |
| `hostSuffixes`                 | `string[]` | ส่วนต่อท้ายของโฮสต์ที่แมปกับคลาส endpoint ใส่ `.` นำหน้าเพื่อจับคู่เฉพาะส่วนต่อท้ายโดเมน |
| `baseUrls`                     | `string[]` | URL ฐาน HTTP(S) ที่ปรับรูปแบบแล้วแบบตรงตัวซึ่งแมปกับคลาส endpoint                             |
| `googleVertexRegion`           | `string`   | ภูมิภาค Google Vertex แบบคงที่สำหรับโฮสต์ส่วนกลางแบบตรงตัว                                            |
| `googleVertexRegionHostSuffix` | `string`   | ส่วนต่อท้ายที่จะตัดออกจากโฮสต์ที่ตรงกันเพื่อเปิดเผยคำนำหน้าภูมิภาค Google Vertex                 |

## เอกสารอ้างอิง providerRequest

ใช้ `providerRequest` สำหรับเมตาดาต้าความเข้ากันได้ของคำขอที่มีต้นทุนต่ำ ซึ่งนโยบายคำขอทั่วไปต้องใช้โดยไม่ต้องโหลด runtime ของผู้ให้บริการ เก็บการเขียน payload ใหม่ที่เฉพาะเจาะจงกับพฤติกรรมไว้ใน hook runtime ของผู้ให้บริการหรือ helper ของกลุ่มผู้ให้บริการที่ใช้ร่วมกัน

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

ฟิลด์ของผู้ให้บริการ:

| Field                 | Type         | ความหมาย                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายกำกับกลุ่มผู้ให้บริการที่ใช้โดยการตัดสินใจความเข้ากันได้ของคำขอทั่วไปและการวินิจฉัย |
| `compatibilityFamily` | `"moonshot"` | กลุ่มความเข้ากันได้ของกลุ่มผู้ให้บริการที่เป็นทางเลือกสำหรับ helper คำขอที่ใช้ร่วมกัน              |
| `openAICompletions`   | `object`     | แฟล็กคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage`       |

## เอกสารอ้างอิง secretProviderIntegrations

ใช้ `secretProviderIntegrations` เมื่อ Plugin สามารถเผยแพร่พรีเซ็ตผู้ให้บริการ exec ของ SecretRef ที่นำกลับมาใช้ซ้ำได้ OpenClaw อ่านเมตาดาต้านี้ก่อนที่ runtime ของ Plugin จะโหลด เก็บความเป็นเจ้าของของ Plugin ไว้ใน `secrets.providers.<alias>.pluginIntegration` และปล่อยให้การ resolve secret จริงเป็นหน้าที่ของ runtime ของ SecretRef
พรีเซ็ตจะเปิดเผยเฉพาะสำหรับ Plugin ที่ bundled และ Plugin ที่ติดตั้งซึ่งค้นพบจากรากการติดตั้ง Plugin ที่จัดการไว้ เช่น การติดตั้งจาก git และ ClawHub

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

คีย์ของแมปคือ id ของการผสานรวม หากละ `providerAlias` ไว้ OpenClaw จะใช้ id ของการผสานรวมเป็น alias ของผู้ให้บริการ SecretRef alias ของผู้ให้บริการต้องตรงกับรูปแบบ alias ผู้ให้บริการ SecretRef ปกติ เช่น `team-secrets` หรือ `onepassword-work`

เมื่อ operator เลือกพรีเซ็ต OpenClaw จะเขียนการอ้างอิงผู้ให้บริการเช่น:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

เมื่อเริ่มต้นหรือโหลดซ้ำ OpenClaw จะ resolve ผู้ให้บริการนั้นโดยโหลดเมตาดาต้า manifest ของ Plugin ปัจจุบัน ตรวจสอบว่า Plugin เจ้าของติดตั้งและใช้งานอยู่ แล้วสร้างคำสั่ง exec จาก manifest การปิดใช้งานหรือลบ Plugin จะเพิกถอนผู้ให้บริการสำหรับ SecretRefs ที่ใช้งานอยู่ operator ที่ต้องการการกำหนดค่า exec แบบ standalone ยังสามารถเขียนผู้ให้บริการ `command`/`args` แบบแมนนวลได้โดยตรง

ปัจจุบันรองรับเฉพาะพรีเซ็ต `source: "exec"` เท่านั้น `command` ต้องเป็น `${node}` และ `args[0]` ต้องเป็นสคริปต์ resolver แบบสัมพันธ์กับรากของ Plugin ที่ขึ้นต้นด้วย `./` OpenClaw จะ materialize ในตอนเริ่มต้นหรือโหลดซ้ำให้เป็นไฟล์ปฏิบัติการ Node ปัจจุบันและพาธสคริปต์แบบสัมบูรณ์ภายใน Plugin ตัวเลือก Node เช่น `--require`, `--import`, `--loader`, `--env-file`, `--eval` และ `--print` ไม่ได้เป็นส่วนหนึ่งของสัญญาพรีเซ็ต manifest operator ที่ต้องใช้คำสั่งที่ไม่ใช่ Node สามารถกำหนดค่าผู้ให้บริการ exec แบบแมนนวล standalone ได้โดยตรง

OpenClaw อนุมาน `trustedDirs` สำหรับพรีเซ็ต manifest จากรากของ Plugin และสำหรับพรีเซ็ต `${node}` จะรวมไดเรกทอรีของไฟล์ปฏิบัติการ Node ปัจจุบันด้วย `trustedDirs` ที่เขียนใน manifest จะถูกละเว้น ตัวเลือกผู้ให้บริการ exec อื่น ๆ เช่น `timeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` และ `allowInsecurePath` จะส่งผ่านไปยังการกำหนดค่าผู้ให้บริการ exec ของ SecretRef ปกติ

## เอกสารอ้างอิง modelPricing

ใช้ `modelPricing` เมื่อผู้ให้บริการต้องการพฤติกรรม pricing ของ control-plane ก่อนที่ runtime จะโหลด แคช pricing ของ Gateway อ่านเมตาดาต้านี้โดยไม่ต้อง import โค้ด runtime ของผู้ให้บริการ

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

ฟิลด์ของผู้ให้บริการ:

| Field        | Type              | ความหมาย                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | ตั้งเป็น `false` สำหรับผู้ให้บริการแบบ local/self-hosted ที่ไม่ควรดึง pricing จาก OpenRouter หรือ LiteLLM เลย |
| `openRouter` | `false \| object` | การแมปสำหรับค้นหา pricing ของ OpenRouter `false` ปิดการค้นหา OpenRouter สำหรับผู้ให้บริการนี้           |
| `liteLLM`    | `false \| object` | การแมปสำหรับค้นหา pricing ของ LiteLLM `false` ปิดการค้นหา LiteLLM สำหรับผู้ให้บริการนี้                 |

ฟิลด์ของแหล่งข้อมูล:

| Field                      | Type               | ความหมาย                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | id ผู้ให้บริการใน catalog ภายนอกเมื่อแตกต่างจาก id ผู้ให้บริการของ OpenClaw เช่น `z-ai` สำหรับผู้ให้บริการ `zai` |
| `passthroughProviderModel` | `boolean`          | ถือว่า id โมเดลที่มี slash เป็น ref ผู้ให้บริการ/โมเดลแบบซ้อน มีประโยชน์สำหรับผู้ให้บริการ proxy เช่น OpenRouter       |
| `modelIdTransforms`        | `"version-dots"[]` | variant เพิ่มเติมของ model-id ใน catalog ภายนอก `version-dots` จะลอง id เวอร์ชันแบบมีจุด เช่น `claude-opus-4.6`            |

### OpenClaw Provider Index

OpenClaw Provider Index คือเมตาดาต้า preview ที่ OpenClaw เป็นเจ้าของสำหรับผู้ให้บริการที่ Plugin ของผู้ให้บริการนั้นอาจยังไม่ได้ติดตั้ง ยังไม่ใช่ส่วนหนึ่งของ manifest ของ Plugin
manifest ของ Plugin ยังคงเป็นแหล่งอำนาจของ Plugin ที่ติดตั้งแล้ว Provider Index คือสัญญา fallback ภายในที่พื้นผิวสำหรับผู้ให้บริการที่ติดตั้งได้ในอนาคตและตัวเลือกโมเดลก่อนติดตั้งจะใช้เมื่อ Plugin ของผู้ให้บริการยังไม่ได้ติดตั้ง

ลำดับอำนาจของ catalog:

1. การกำหนดค่าของผู้ใช้
2. `modelCatalog` ใน manifest ของ Plugin ที่ติดตั้งแล้ว
3. แคช catalog โมเดลจากการ refresh อย่างชัดเจน
4. แถว preview ของ OpenClaw Provider Index

Provider Index ต้องไม่มี secret, สถานะ enabled, hook runtime หรือข้อมูลโมเดลที่เฉพาะกับบัญชีแบบ live catalog preview ของมันใช้ shape แถวผู้ให้บริการ `modelCatalog` เดียวกับ manifest ของ Plugin แต่ควรจำกัดไว้ที่เมตาดาต้าการแสดงผลที่เสถียร เว้นแต่ฟิลด์ adapter runtime เช่น `api`, `baseUrl`, pricing หรือแฟล็กความเข้ากันได้จะถูกตั้งใจให้สอดคล้องกับ manifest ของ Plugin ที่ติดตั้งแล้ว ผู้ให้บริการที่มีการค้นพบ `/models` แบบ live ควรเขียนแถวที่ refresh แล้วผ่านพาธแคช catalog โมเดลแบบชัดเจน แทนที่จะให้การ list ปกติหรือ onboarding เรียก API ของผู้ให้บริการ

รายการใน Provider Index อาจมีเมตาดาต้า Plugin ที่ติดตั้งได้สำหรับผู้ให้บริการที่ Plugin ย้ายออกจาก core แล้วหรือยังไม่ได้ติดตั้งด้วย เมตาดาต้านี้สะท้อนรูปแบบ catalog ของ channel: ชื่อแพ็กเกจ, npm install spec, integrity ที่คาดหวัง และป้ายกำกับตัวเลือก auth ที่ต้นทุนต่ำก็เพียงพอสำหรับแสดงตัวเลือก setup ที่ติดตั้งได้ เมื่อ Plugin ติดตั้งแล้ว manifest ของมันจะชนะ และรายการ Provider Index จะถูกละเว้นสำหรับผู้ให้บริการนั้น

คีย์ capability ระดับบนสุดแบบ legacy ถูกเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อย้าย `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด manifest ปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นความเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

สองไฟล์นี้ทำหน้าที่ต่างกัน:

| File                   | ใช้สำหรับ                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ การตรวจสอบความถูกต้องของ config เมตาดาต้าตัวเลือก auth และคำใบ้ UI ที่ต้องมีอยู่ก่อนโค้ด Plugin จะทำงาน                         |
| `package.json`         | เมตาดาต้า npm การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoints, install gating, setup หรือเมตาดาต้า catalog |

หากไม่แน่ใจว่าเมตาดาต้าชิ้นหนึ่งควรอยู่ที่ไหน ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเกี่ยวกับ packaging, ไฟล์ entry หรือพฤติกรรมการติดตั้ง npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ

เมตาดาต้า Plugin บางส่วนก่อน runtime ตั้งใจให้อยู่ใน `package.json` ใต้บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`
`openclaw.bundle` และ `openclaw.bundle.json` ไม่ใช่สัญญา Plugin ของ OpenClaw; Plugin แบบ native ต้องใช้ `openclaw.plugin.json` ร่วมกับฟิลด์ `package.json#openclaw` ที่รองรับด้านล่าง

ตัวอย่างสำคัญ:

| ฟิลด์                                                                                      | ความหมาย                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ประกาศ entrypoint ของ Plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | ประกาศ entrypoint ของรันไทม์ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                 |
| `openclaw.setupEntry`                                                                      | entrypoint แบบเบาสำหรับการตั้งค่าเท่านั้น ใช้ระหว่าง onboarding, การเริ่มต้น channel แบบเลื่อนเวลา และการค้นหาสถานะ channel/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin |
| `openclaw.runtimeSetupEntry`                                                               | ประกาศ entrypoint การตั้งค่า JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องมี `setupEntry`, ต้องมีอยู่จริง และต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                         |
| `openclaw.channel`                                                                         | เมตาดาทาแค็ตตาล็อก channel แบบประหยัด เช่น ป้ายกำกับ, path ของเอกสาร, alias และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                                                | เมตาดาทาคำสั่งเนทีฟแบบคงที่และค่าเริ่มต้นอัตโนมัติของ skill เนทีฟ ใช้โดยพื้นผิว config, audit และรายการคำสั่งก่อนที่รันไทม์ channel จะโหลด                                          |
| `openclaw.channel.configuredState`                                                         | เมตาดาทาตัวตรวจสอบสถานะที่กำหนดค่าแล้วแบบเบา ซึ่งตอบได้ว่า "การตั้งค่าแบบ env-only มีอยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ channel ทั้งหมด                                         |
| `openclaw.channel.persistedAuthState`                                                      | เมตาดาทาตัวตรวจสอบ auth ที่คงไว้แบบเบา ซึ่งตอบได้ว่า "มีสิ่งใดลงชื่อเข้าใช้แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ channel ทั้งหมด                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | คำใบ้สำหรับติดตั้ง/อัปเดต Plugin ที่ bundled และ Plugin ที่เผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | path การติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่ง                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | เวอร์ชันโฮสต์ OpenClaw ขั้นต่ำที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22` หรือ `>=2026.5.1-beta.1`                                                                             |
| `openclaw.compat.pluginApi`                                                                | ช่วง API ของ Plugin OpenClaw ขั้นต่ำที่แพ็กเกจนี้ต้องการ โดยใช้ semver floor เช่น `>=2026.5.27`                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | สตริง integrity ของ npm dist ที่คาดหวัง เช่น `sha512-...`; flow การติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | อนุญาต path การกู้คืนแบบติดตั้ง Plugin ที่ bundled ใหม่ในขอบเขตแคบเมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | alias ของแพ็กเกจ npm ที่ต้อง materialize เมื่อข้อจำกัดแพลตฟอร์มใน lockfile ตรงกับโฮสต์ปัจจุบัน                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | อนุญาตให้พื้นผิว channel ของ setup-runtime โหลดก่อน listen แล้วเลื่อน Plugin channel ที่กำหนดค่าเต็มไว้จนกว่าจะเปิดใช้งานหลัง listen                                                 |

เมตาดาทา manifest ตัดสินว่าตัวเลือก provider/channel/setup ใดจะแสดงใน
onboarding ก่อนที่รันไทม์จะโหลด `package.json#openclaw.install` บอก
onboarding ว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้ายคำใบ้การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด
registry ของ manifest สำหรับแหล่ง Plugin ที่ไม่ใช่ bundled ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ;
ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม Plugin ภายนอกบนโฮสต์รุ่นเก่า Plugin source แบบ bundled
ถือว่า co-versioned กับ checkout ของโฮสต์

`openclaw.install.requiredPlatformPackages` ใช้สำหรับแพ็กเกจ npm ที่เปิดเผย
ไบนารีเนทีฟที่จำเป็นผ่าน alias แบบ optional และเฉพาะแพลตฟอร์ม ระบุชื่อ
แพ็กเกจ npm แบบ bare สำหรับทุก alias แพลตฟอร์มที่รองรับ ระหว่างการติดตั้ง npm,
OpenClaw จะตรวจสอบเฉพาะ alias ที่ประกาศซึ่งข้อจำกัดใน lockfile ตรงกับ
โฮสต์ปัจจุบัน หาก npm รายงานว่าสำเร็จแต่ละเว้น alias นั้น OpenClaw จะลองอีกครั้งหนึ่ง
ด้วย cache ใหม่และ rollback การติดตั้งหาก alias ยังขาดอยู่

`openclaw.compat.pluginApi` ถูกบังคับใช้ระหว่างการติดตั้งแพ็กเกจสำหรับแหล่ง
Plugin ที่ไม่ใช่ bundled ใช้ค่านี้สำหรับ floor ของ API ของ SDK/รันไทม์ Plugin OpenClaw ที่
แพ็กเกจถูก build มาด้วย ค่านี้อาจเข้มงวดกว่า `minHostVersion` ได้เมื่อ
แพ็กเกจ Plugin ต้องการ API ที่ใหม่กว่าแต่ยังคงคำใบ้การติดตั้งที่ต่ำกว่าสำหรับ
flow อื่น การซิงก์ release อย่างเป็นทางการของ OpenClaw จะ bump floor ของ API ของ Plugin อย่างเป็นทางการที่มีอยู่
เป็นเวอร์ชัน release ของ OpenClaw โดยค่าเริ่มต้น แต่ release เฉพาะ Plugin สามารถคง
floor ที่ต่ำกว่าได้เมื่อแพ็กเกจตั้งใจรองรับโฮสต์รุ่นเก่า อย่าใช้
เวอร์ชันแพ็กเกจเพียงอย่างเดียวเป็นสัญญาความเข้ากันได้ `peerDependencies.openclaw`
ยังคงเป็นเมตาดาทาแพ็กเกจ npm; OpenClaw ใช้สัญญา `openclaw.compat.pluginApi`
สำหรับการตัดสินใจความเข้ากันได้ของการติดตั้ง

เมตาดาทา install-on-demand อย่างเป็นทางการควรใช้ `clawhubSpec` เมื่อ Plugin
เผยแพร่บน ClawHub; onboarding จะถือค่านี้เป็นแหล่ง remote ที่ต้องการและ
บันทึกข้อเท็จจริง artifact ของ ClawHub หลังการติดตั้ง `npmSpec` ยังคงเป็น fallback
ด้านความเข้ากันได้สำหรับแพ็กเกจที่ยังไม่ได้ย้ายไป ClawHub

การ pin เวอร์ชัน npm แบบ exact อยู่ใน `npmSpec` แล้ว เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการแค็ตตาล็อกภายนอกอย่างเป็นทางการ
ควรจับคู่ spec แบบ exact กับ `expectedIntegrity` เพื่อให้ flow การอัปเดต fail
closed หาก artifact npm ที่ดึงมาไม่ตรงกับ release ที่ pin ไว้อีกต่อไป
onboarding แบบ interactive ยังคงเสนอ spec ของ npm registry ที่เชื่อถือได้ รวมถึงชื่อ
แพ็กเกจแบบ bare และ dist-tag เพื่อความเข้ากันได้ การวินิจฉัยแค็ตตาล็อกสามารถ
แยกแยะระหว่างแหล่งแบบ exact, floating, integrity-pinned, missing-integrity, package-name
mismatch และ default-choice ที่ไม่ถูกต้องได้ นอกจากนี้ยังเตือนเมื่อ
มี `expectedIntegrity` แต่ไม่มีแหล่ง npm ที่ถูกต้องซึ่งสามารถ pin ค่านั้นได้
เมื่อมี `expectedIntegrity`,
flow การติดตั้ง/อัปเดตจะบังคับใช้ค่านี้; เมื่อไม่มีค่านี้ การ resolve registry จะถูก
บันทึกโดยไม่มี integrity pin

Plugin channel ควรมี `openclaw.setupEntry` เมื่อการสแกนสถานะ, รายการ channel
หรือ SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าแล้วโดยไม่โหลดรันไทม์ทั้งหมด
entry การตั้งค่าควรเปิดเผยเมตาดาทา channel พร้อม adapter สำหรับ config,
สถานะ และ secrets ที่ปลอดภัยสำหรับการตั้งค่า; เก็บ network client, listener ของ Gateway และ
รันไทม์ transport ไว้ใน entrypoint หลักของ extension

ฟิลด์ entrypoint ของรันไทม์ไม่ได้ override การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
entrypoint ของ source ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
path `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` มีขอบเขตแคบโดยเจตนา ค่านี้ไม่ได้
ทำให้ config ที่เสียโดยอำเภอใจติดตั้งได้ ปัจจุบันค่านี้อนุญาตเฉพาะให้ flow การติดตั้ง
กู้คืนจากความล้มเหลวเฉพาะของการอัปเกรด Plugin ที่ bundled ซึ่งล้าสมัย เช่น
path ของ Plugin ที่ bundled หายไป หรือรายการ `channels.<id>` ที่ล้าสมัยสำหรับ
Plugin ที่ bundled เดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ปฏิบัติงาน
ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือเมตาดาทาแพ็กเกจสำหรับโมดูลตัวตรวจสอบ
ขนาดเล็ก:

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

ใช้เมื่อ flow การตั้งค่า, doctor, สถานะ หรือ presence แบบอ่านอย่างเดียวต้องการ probe auth
แบบ yes/no ที่ประหยัดก่อนที่ Plugin channel ทั้งหมดจะโหลด สถานะ auth ที่คงไว้
ไม่ใช่สถานะ channel ที่กำหนดค่าแล้ว: อย่าใช้เมตาดาทานี้เพื่อเปิดใช้ Plugin อัตโนมัติ,
ซ่อมแซม dependency ของรันไทม์ หรือตัดสินว่าควรโหลดรันไทม์ channel หรือไม่
export เป้าหมายควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะสถานะที่คงไว้; อย่า
route ผ่าน barrel รันไทม์ channel ทั้งหมด

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบแบบประหยัดว่า
ตั้งค่า env-only แล้วหรือไม่:

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

ใช้เมื่อ channel สามารถตอบสถานะที่กำหนดค่าแล้วจาก env หรือ input ขนาดเล็กอื่นที่ไม่ใช่รันไทม์
หากการตรวจสอบต้องการการ resolve config ทั้งหมดหรือรันไทม์ channel จริง
ให้เก็บ logic นั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญในการค้นพบ (id ของ Plugin ซ้ำ)

OpenClaw ค้นพบ Plugin จาก root หลายแห่ง สำหรับลำดับการสแกน filesystem แบบ raw
ดูที่ [ลำดับการสแกน Plugin](/th/gateway/configuration-reference#plugin-scan-order)
หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี
**ลำดับความสำคัญสูงสุด** เท่านั้น; duplicate ที่มีลำดับความสำคัญต่ำกว่าจะถูกทิ้งแทนที่จะโหลดเคียงข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **เลือกโดย config** — path ที่ pin อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อมกับ OpenClaw
3. **ติดตั้งแบบ global** — Plugin ที่ติดตั้งลงใน root ของ Plugin OpenClaw แบบ global
4. **Workspace** — Plugin ที่ค้นพบโดยอิงกับ workspace ปัจจุบัน

ผลที่ตามมา:

- สำเนา fork หรือล้าสมัยของ Plugin ที่ bundled ซึ่งอยู่ใน workspace จะไม่ shadow build ที่ bundled
- หากต้องการ override Plugin ที่ bundled ด้วย Plugin local จริง ๆ ให้ pin ผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่งพาการค้นพบจาก workspace
- การทิ้ง duplicate จะถูกบันทึกใน log เพื่อให้ Doctor และการวินิจฉัยการเริ่มต้นชี้ไปยังสำเนาที่ถูกทิ้งได้
- override duplicate ที่เลือกโดย config จะถูกเขียนใน diagnostics ว่าเป็น override อย่างชัดเจน แต่ยังคงเตือนเพื่อให้ fork ที่ล้าสมัยและ shadow โดยไม่ตั้งใจยังมองเห็นได้

## ข้อกำหนด JSON Schema

- **Plugin ทุกตัวต้องมาพร้อม JSON Schema** แม้ว่าจะไม่รับการกำหนดค่าใดๆ ก็ตาม.
- สคีมาเปล่าสามารถใช้ได้ (เช่น `{ "type": "object", "additionalProperties": false }`).
- สคีมาจะถูกตรวจสอบความถูกต้องตอนอ่าน/เขียนการกำหนดค่า ไม่ใช่ตอน runtime.
- เมื่อขยายหรือ fork Plugin ที่ bundled พร้อมคีย์การกำหนดค่าใหม่ ให้อัปเดต `configSchema` ใน `openclaw.plugin.json` ของ Plugin นั้นพร้อมกัน สคีมาของ Plugin ที่ bundled มีความเข้มงวด ดังนั้นการเพิ่ม `plugins.entries.<id>.config.myNewKey` ในการกำหนดค่าของผู้ใช้โดยไม่เพิ่ม `myNewKey` ลงใน `configSchema.properties` จะถูกปฏิเสธก่อนที่ runtime ของ Plugin จะโหลด.

ตัวอย่างการขยายสคีมา:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## พฤติกรรมการตรวจสอบความถูกต้อง

- คีย์ `channels.*` ที่ไม่รู้จักคือ **ข้อผิดพลาด** เว้นแต่ id ของ channel จะถูกประกาศโดย
  manifest ของ Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id ของ Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักคือ **ข้อผิดพลาด**.
- หากติดตั้ง Plugin แล้วแต่ manifest หรือสคีมาเสียหายหรือขาดหาย
  การตรวจสอบความถูกต้องจะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin.
- หากมีการกำหนดค่า Plugin อยู่แต่ Plugin ถูก **ปิดใช้งาน** การกำหนดค่าจะถูกเก็บไว้และ
  จะแสดง **คำเตือน** ใน Doctor + บันทึก.

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับสคีมา `plugins.*` แบบเต็ม.

## หมายเหตุ

- manifest เป็นสิ่งที่ **จำเป็นสำหรับ Plugin แบบ native ของ OpenClaw** รวมถึงการโหลดจากระบบไฟล์ภายในเครื่อง runtime ยังโหลดโมดูล Plugin แยกต่างหาก; manifest ใช้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น.
- manifest แบบ native จะถูก parse ด้วย JSON5 ดังนั้นจึงยอมรับคอมเมนต์ comma ท้ายรายการ และคีย์ที่ไม่ใส่เครื่องหมายคำพูดได้ ตราบใดที่ค่าสุดท้ายยังเป็นออบเจ็กต์.
- loader ของ manifest จะอ่านเฉพาะฟิลด์ manifest ที่มีเอกสารกำกับเท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง.
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ได้ทั้งหมดเมื่อ Plugin ไม่จำเป็นต้องใช้.
- `providerCatalogEntry` ต้องคงความเบาและไม่ควร import โค้ด runtime ขนาดใหญ่; ใช้สำหรับเมตาดาต้าแค็ตตาล็อก provider แบบ static หรือ descriptor การค้นพบแบบแคบ ไม่ใช่การประมวลผลระหว่างคำขอ.
- ชนิด Plugin แบบ exclusive จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`).
- ประกาศชนิด Plugin แบบ exclusive ใน manifest นี้ `OpenClawPluginDefinition.kind` ใน entry ของ runtime เลิกแนะนำให้ใช้แล้ว และยังคงอยู่เพื่อเป็น fallback ด้านความเข้ากันได้สำหรับ Plugin รุ่นเก่าเท่านั้น.
- เมตาดาต้า env-var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกแนะนำให้ใช้แล้ว และ `channelEnvVars`) เป็นแบบ declarative เท่านั้น สถานะ การ audit การตรวจสอบความถูกต้องของการส่งผ่าน Cron และพื้นผิวแบบอ่านอย่างเดียวอื่นๆ ยังคงใช้นโยบายความเชื่อถือของ Plugin และการเปิดใช้งานที่มีผลจริงก่อนจะถือว่า env var ถูกกำหนดค่าแล้ว.
- สำหรับเมตาดาต้า wizard ของ runtime ที่ต้องใช้โค้ด provider ดู [hooks ของ runtime provider](/th/plugins/architecture-internals#provider-runtime-hooks).
- หาก Plugin ของคุณขึ้นกับ native modules ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนด allowlist ของ package-manager (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin.
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ.
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    ข้อมูลอ้างอิง Plugin SDK และการ import subpath.
  </Card>
</CardGroup>
