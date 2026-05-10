---
read_when:
    - คุณกำลังสร้าง Plugin สำหรับ OpenClaw
    - คุณต้องเผยแพร่สคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดในการตรวจสอบความถูกต้องของ Plugin
summary: ข้อกำหนดสำหรับแมนิเฟสต์ Plugin + สคีมา JSON (การตรวจสอบการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้มีไว้สำหรับ **native OpenClaw plugin manifest** เท่านั้น

สำหรับรูปแบบ bundle ที่เข้ากันได้ โปรดดู [Plugin bundles](/th/plugins/bundles)

รูปแบบ bundle ที่เข้ากันได้ใช้ไฟล์ manifest คนละแบบ:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` หรือรูปแบบองค์ประกอบ Claude เริ่มต้น
  ที่ไม่มี manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw ตรวจพบรูปแบบ bundle เหล่านั้นโดยอัตโนมัติด้วย แต่รูปแบบเหล่านั้นไม่ได้ถูกตรวจสอบ
กับ schema `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับ bundle ที่เข้ากันได้ ปัจจุบัน OpenClaw อ่าน metadata ของ bundle พร้อมกับ
skill roots ที่ประกาศไว้, Claude command roots, ค่าเริ่มต้น `settings.json` ของ Claude bundle,
ค่าเริ่มต้น LSP ของ Claude bundle และ hook packs ที่รองรับ เมื่อรูปแบบตรงกับ
ความคาดหวังของ runtime ของ OpenClaw

Plugin แบบ native ของ OpenClaw ทุกตัว **ต้อง** จัดส่งไฟล์ `openclaw.plugin.json` ไว้ใน
**plugin root** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบ configuration
**โดยไม่ต้องเรียกใช้โค้ด plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถูกถือเป็น
ข้อผิดพลาดของ plugin และบล็อกการตรวจสอบ config

ดูคู่มือระบบ plugin ฉบับเต็ม: [Plugins](/th/tools/plugin)
สำหรับ capability model แบบ native และแนวทางความเข้ากันได้ภายนอกในปัจจุบัน:
[Capability model](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือ metadata ที่ OpenClaw อ่าน **ก่อนที่จะโหลด
โค้ด plugin ของคุณ** ทุกอย่างด้านล่างต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูต
plugin runtime

**ใช้สำหรับ:**

- ตัวตนของ plugin, การตรวจสอบ config และคำใบ้ UI ของ config
- metadata สำหรับ auth, onboarding และ setup (alias, auto-enable, provider env vars, ตัวเลือก auth)
- คำใบ้ activation สำหรับพื้นผิว control-plane
- ความเป็นเจ้าของ model-family แบบย่อ
- snapshots ความเป็นเจ้าของ capability แบบ static (`contracts`)
- metadata ของ QA runner ที่โฮสต์ `openclaw qa` ร่วมกันสามารถตรวจสอบได้
- metadata config เฉพาะ channel ที่ถูกรวมเข้าใน catalog และพื้นผิว validation

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรม runtime, การประกาศ code entrypoints,
หรือ metadata การติดตั้ง npm สิ่งเหล่านั้นอยู่ในโค้ด plugin และ `package.json` ของคุณ

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

## อ้างอิง field ระดับบนสุด

| ฟิลด์                                | จำเป็น | ประเภท                             | ความหมาย                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | รหัส Plugin แบบ canonical นี่คือรหัสที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                 |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบอินไลน์สำหรับการกำหนดค่าของ Plugin นี้                                                                                                                                                                                        |
| `enabledByDefault`                   | ไม่       | `true`                           | ทำเครื่องหมาย Plugin ที่รวมมาให้เปิดใช้งานโดยค่าเริ่มต้น ละไว้ หรือตั้งค่าเป็นค่าใดก็ตามที่ไม่ใช่ `true` เพื่อให้ Plugin ปิดใช้งานโดยค่าเริ่มต้น                                                                                                        |
| `enabledByDefaultOnPlatforms`        | ไม่       | `string[]`                       | ทำเครื่องหมาย Plugin ที่รวมมาให้เปิดใช้งานโดยค่าเริ่มต้นเฉพาะบนแพลตฟอร์ม Node.js ที่ระบุไว้ เช่น `["darwin"]` การกำหนดค่าแบบชัดเจนยังคงมีสิทธิ์เหนือกว่า                                                                                            |
| `legacyPluginIds`                    | ไม่       | `string[]`                       | รหัสดั้งเดิมที่ normalize เป็นรหัส Plugin แบบ canonical นี้                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | ไม่       | `string[]`                       | รหัสผู้ให้บริการที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อ auth, config หรือ model refs กล่าวถึงรหัสเหล่านั้น                                                                                                                                     |
| `kind`                               | ไม่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบ exclusive ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                        |
| `channels`                           | ไม่       | `string[]`                       | รหัสช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบความถูกต้องของการกำหนดค่า                                                                                                                                                         |
| `providers`                          | ไม่       | `string[]`                       | รหัสผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                  |
| `providerCatalogEntry`               | ไม่       | `string`                         | พาธโมดูลแค็ตตาล็อกผู้ให้บริการแบบเบา ซึ่งสัมพันธ์กับรากของ Plugin สำหรับเมตาดาต้าแค็ตตาล็อกผู้ให้บริการในขอบเขตแมนิเฟสต์ที่โหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์ Plugin แบบเต็ม                                                 |
| `modelSupport`                       | ไม่       | `object`                         | เมตาดาต้า family ของโมเดลแบบย่อที่แมนิเฟสต์เป็นเจ้าของ ใช้เพื่อโหลด Plugin โดยอัตโนมัติก่อนรันไทม์                                                                                                                                         |
| `modelCatalog`                       | ไม่       | `object`                         | เมตาดาต้าแค็ตตาล็อกโมเดลแบบ declarative สำหรับผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญา control-plane สำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต, onboarding, ตัวเลือกโมเดล, alias และการ suppress โดยไม่โหลดรันไทม์ Plugin         |
| `modelPricing`                       | ไม่       | `object`                         | นโยบายค้นหาราคาภายนอกที่ผู้ให้บริการเป็นเจ้าของ ใช้เพื่อยกเว้นผู้ให้บริการแบบ local/self-hosted ออกจากแค็ตตาล็อกราคาจากระยะไกล หรือ map provider refs ไปยังรหัสแค็ตตาล็อก OpenRouter/LiteLLM โดยไม่ hardcode รหัสผู้ให้บริการใน core             |
| `modelIdNormalization`               | ไม่       | `object`                         | การล้าง alias/prefix ของรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้องทำงานก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                                                           |
| `providerEndpoints`                  | ไม่       | `object[]`                       | เมตาดาต้า host/baseUrl ของ endpoint ที่แมนิเฟสต์เป็นเจ้าของสำหรับ route ของผู้ให้บริการ ซึ่ง core ต้องจัดประเภทก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                            |
| `providerRequest`                    | ไม่       | `object`                         | เมตาดาต้า family ของผู้ให้บริการและความเข้ากันได้ของคำขอแบบประหยัด ซึ่งใช้โดยนโยบายคำขอทั่วไปก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                              |
| `cliBackends`                        | ไม่       | `string[]`                       | รหัส backend สำหรับการอนุมานของ CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติเมื่อเริ่มต้นจาก config refs แบบชัดเจน                                                                                                                         |
| `syntheticAuthRefs`                  | ไม่       | `string[]`                       | refs ของผู้ให้บริการหรือ backend ของ CLI ที่ควรตรวจสอบ hook auth สังเคราะห์ซึ่ง Plugin เป็นเจ้าของ ระหว่างการค้นพบโมเดลแบบ cold ก่อนโหลดรันไทม์                                                                                              |
| `nonSecretAuthMarkers`               | ไม่       | `string[]`                       | ค่า placeholder ของ API key ที่ Plugin ซึ่งรวมมาเป็นเจ้าของ และแสดงสถานะ credential แบบ local, OAuth หรือ ambient ที่ไม่เป็นความลับ                                                                                                                |
| `commandAliases`                     | ไม่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้าง diagnostic ของการกำหนดค่าและ CLI ที่รับรู้ Plugin ก่อนโหลดรันไทม์                                                                                                                |
| `providerAuthEnvVars`                | ไม่       | `Record<string, string[]>`       | เมตาดาต้า env สำหรับความเข้ากันได้ที่เลิกใช้แล้ว สำหรับการค้นหา auth/status ของผู้ให้บริการ แนะนำให้ใช้ `setup.providers[].envVars` สำหรับ Plugin ใหม่; OpenClaw ยังอ่านค่านี้ระหว่างช่วง deprecation                                                 |
| `providerAuthAliases`                | ไม่       | `Record<string, string>`         | รหัสผู้ให้บริการที่ควรใช้รหัสผู้ให้บริการอื่นซ้ำสำหรับการค้นหา auth เช่น ผู้ให้บริการด้าน coding ที่ใช้ API key และ auth profiles ของผู้ให้บริการฐานร่วมกัน                                                                          |
| `channelEnvVars`                     | ไม่       | `Record<string, string[]>`       | เมตาดาต้า env ของช่องทางแบบเบาที่ OpenClaw ตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้สำหรับการตั้งค่าช่องทางหรือพื้นผิว auth ที่ขับเคลื่อนด้วย env ซึ่งตัวช่วย startup/config ทั่วไปควรมองเห็น                                            |
| `providerAuthChoices`                | ไม่       | `object[]`                       | เมตาดาต้า auth-choice แบบเบาสำหรับตัวเลือก onboarding, การ resolve preferred-provider และการเชื่อมต่อ flag ของ CLI แบบง่าย                                                                                                                       |
| `activation`                         | ไม่       | `object`                         | เมตาดาต้าตัววางแผนการเปิดใช้งานแบบเบาสำหรับ startup, ผู้ให้บริการ, คำสั่ง, ช่องทาง, route และการโหลดที่ trigger ด้วย capability เป็นเมตาดาต้าเท่านั้น; รันไทม์ Plugin ยังเป็นเจ้าของพฤติกรรมจริง                                                       |
| `setup`                              | ไม่       | `object`                         | ตัวอธิบาย setup/onboarding แบบเบาที่พื้นผิว discovery และ setup ตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ Plugin                                                                                                                    |
| `qaRunners`                          | ไม่       | `object[]`                       | ตัวอธิบายตัวรัน QA แบบเบาที่โฮสต์ `openclaw qa` ร่วมใช้ก่อนโหลดรันไทม์ Plugin                                                                                                                                      |
| `contracts`                          | ไม่       | `object`                         | snapshot ความเป็นเจ้าของ capability แบบ static สำหรับ hook auth ภายนอก, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search และความเป็นเจ้าของ tool |
| `mediaUnderstandingProviderMetadata` | ไม่       | `Record<string, object>`         | ค่าเริ่มต้น media-understanding แบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                            |
| `imageGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมตาดาต้า auth ของ image-generation แบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.imageGenerationProviders` รวมถึง alias ของ auth และ guard ของ base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `videoGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมตาดาต้า auth ของ video-generation แบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.videoGenerationProviders` รวมถึง alias ของ auth และ guard ของ base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `musicGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมตาดาต้า auth ของ music-generation แบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.musicGenerationProviders` รวมถึง alias ของ auth และ guard ของ base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `toolMetadata`                       | ไม่       | `Record<string, object>`         | เมตาดาต้าความพร้อมใช้งานแบบเบาสำหรับเครื่องมือที่ Plugin เป็นเจ้าของซึ่งประกาศใน `contracts.tools` ใช้เมื่อต้องการให้เครื่องมือไม่โหลดรันไทม์เว้นแต่จะมีหลักฐานจาก config, env หรือ auth                                                           |
| `channelConfigs`                     | ไม่       | `Record<string, object>`         | เมตาดาต้าการกำหนดค่าช่องทางที่แมนิเฟสต์เป็นเจ้าของ ซึ่ง merge เข้ากับพื้นผิว discovery และ validation ก่อนโหลดรันไทม์                                                                                                                          |
| `skills`                             | ไม่       | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด โดยสัมพันธ์กับรากของ Plugin                                                                                                                                                                             |
| `name`                               | ไม่       | `string`                         | ชื่อ Plugin ที่อ่านเข้าใจได้สำหรับมนุษย์                                                                                                                                                                                                         |
| `description`                        | ไม่       | `string`                         | สรุปสั้น ๆ ที่แสดงในพื้นผิวการใช้งานของ Plugin                                                                                                                                                                                             |
| `version`                            | ไม่       | `string`                         | เวอร์ชัน Plugin สำหรับเป็นข้อมูล                                                                                                                                                                                                       |
| `uiHints`                            | ไม่       | `Record<string, object>`         | ป้ายกำกับ UI, placeholder และคำใบ้เกี่ยวกับความละเอียดอ่อนสำหรับฟิลด์ config                                                                                                                                                                   |

## อ้างอิงเมทาดาทาของผู้ให้บริการการสร้าง

ฟิลด์เมทาดาทาของผู้ให้บริการการสร้างอธิบายสัญญาณการยืนยันตัวตนแบบคงที่สำหรับ
ผู้ให้บริการที่ประกาศไว้ในรายการ `contracts.*GenerationProviders` ที่ตรงกัน
OpenClaw อ่านฟิลด์เหล่านี้ก่อนที่รันไทม์ของ Plugin ผู้ให้บริการจะโหลด เพื่อให้เครื่องมือแกนหลักสามารถ
ตัดสินใจได้ว่าผู้ให้บริการการสร้างพร้อมใช้งานหรือไม่โดยไม่ต้องนำเข้า
Plugin ผู้ให้บริการทุกตัว

ใช้ฟิลด์เหล่านี้เฉพาะกับข้อเท็จจริงเชิงประกาศที่มีต้นทุนต่ำเท่านั้น การขนส่ง การแปลงคำขอ
การรีเฟรชโทเค็น การตรวจสอบข้อมูลประจำตัว และพฤติกรรมการสร้างจริง
ยังคงอยู่ในรันไทม์ของ Plugin

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

| ฟิลด์           | จำเป็น | ประเภท       | ความหมาย                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | ไม่       | `string[]` | รหัสผู้ให้บริการเพิ่มเติมที่ควรนับเป็นนามแฝงการยืนยันตัวตนแบบคงที่สำหรับผู้ให้บริการการสร้าง                                       |
| `authProviders` | ไม่       | `string[]` | รหัสผู้ให้บริการที่โปรไฟล์การยืนยันตัวตนซึ่งกำหนดค่าไว้ควรนับเป็นการยืนยันตัวตนสำหรับผู้ให้บริการการสร้างนี้                                      |
| `configSignals` | ไม่       | `object[]` | สัญญาณความพร้อมใช้งานที่ใช้เฉพาะการกำหนดค่าและมีต้นทุนต่ำ สำหรับผู้ให้บริการภายในเครื่องหรือโฮสต์เองที่กำหนดค่าได้โดยไม่ต้องใช้โปรไฟล์การยืนยันตัวตนหรือตัวแปรสภาพแวดล้อม |
| `authSignals`   | ไม่       | `object[]` | สัญญาณการยืนยันตัวตนแบบระบุชัดเจน เมื่อมีอยู่ สัญญาณเหล่านี้จะแทนที่ชุดสัญญาณเริ่มต้นจากรหัสผู้ให้บริการ, `aliases` และ `authProviders`     |

แต่ละรายการ `configSignals` รองรับ:

| ฟิลด์         | จำเป็น | ประเภท       | ความหมาย                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | ใช่      | `string`   | พาธแบบจุดไปยังออบเจ็กต์การกำหนดค่าที่ Plugin เป็นเจ้าของเพื่อตรวจสอบ เช่น `plugins.entries.example.config`                                                                                    |
| `overlayPath` | ไม่       | `string`   | พาธแบบจุดภายในการกำหนดค่าราก ซึ่งออบเจ็กต์ของพาธนั้นควรวางทับออบเจ็กต์รากก่อนประเมินสัญญาณ ใช้สำหรับการกำหนดค่าเฉพาะความสามารถ เช่น `image`, `video` หรือ `music` |
| `required`    | ไม่       | `string[]` | พาธแบบจุดภายในการกำหนดค่าที่มีผล ซึ่งต้องมีค่าที่กำหนดค่าไว้ สตริงต้องไม่ว่างเปล่า ส่วนออบเจ็กต์และอาร์เรย์ต้องไม่ว่างเปล่า                                                |
| `requiredAny` | ไม่       | `string[]` | พาธแบบจุดภายในการกำหนดค่าที่มีผล โดยต้องมีอย่างน้อยหนึ่งพาธที่มีค่าที่กำหนดค่าไว้                                                                                                  |
| `mode`        | ไม่       | `object`   | ตัวคุมโหมดแบบสตริงที่ไม่บังคับภายในการกำหนดค่าที่มีผล ใช้เมื่อความพร้อมใช้งานจากการกำหนดค่าเท่านั้นใช้ได้กับโหมดเดียวเท่านั้น                                                                |

แต่ละตัวคุม `mode` รองรับ:

| ฟิลด์        | จำเป็น | ประเภท       | ความหมาย                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | ไม่       | `string`   | พาธแบบจุดภายในการกำหนดค่าที่มีผล ค่าเริ่มต้นคือ `mode`                          |
| `default`    | ไม่       | `string`   | ค่าโหมดที่จะใช้เมื่อการกำหนดค่าละเว้นพาธ                                  |
| `allowed`    | ไม่       | `string[]` | หากมีอยู่ สัญญาณจะผ่านเฉพาะเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้ |
| `disallowed` | ไม่       | `string[]` | หากมีอยู่ สัญญาณจะล้มเหลวเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้       |

แต่ละรายการ `authSignals` รองรับ:

| ฟิลด์             | จำเป็น | ประเภท     | ความหมาย                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string` | รหัสผู้ให้บริการที่จะตรวจสอบในโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้                                                                                                                             |
| `providerBaseUrl` | ไม่       | `object` | ตัวคุมที่ไม่บังคับซึ่งทำให้สัญญาณนับเฉพาะเมื่อผู้ให้บริการที่กำหนดค่าไว้ซึ่งอ้างอิงใช้ URL ฐานที่อนุญาต ใช้เมื่อชื่อนามแฝงการยืนยันตัวตนใช้ได้เฉพาะกับ API บางรายการ |

แต่ละตัวคุม `providerBaseUrl` รองรับ:

| ฟิลด์             | จำเป็น | ประเภท       | ความหมาย                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string`   | รหัสการกำหนดค่าผู้ให้บริการที่ควรตรวจสอบ `baseUrl`                                                                                                |
| `defaultBaseUrl`  | ไม่       | `string`   | URL ฐานที่จะสมมติใช้เมื่อการกำหนดค่าผู้ให้บริการละเว้น `baseUrl`                                                                                         |
| `allowedBaseUrls` | ใช่      | `string[]` | URL ฐานที่อนุญาตสำหรับสัญญาณการยืนยันตัวตนนี้ สัญญาณจะถูกละเว้นเมื่อ URL ฐานที่กำหนดค่าไว้หรือค่าเริ่มต้นไม่ตรงกับหนึ่งในค่าที่ปรับให้อยู่ในรูปแบบมาตรฐานเหล่านี้ |

## อ้างอิงเมทาดาทาของเครื่องมือ

`toolMetadata` ใช้รูปแบบ `configSignals` และ `authSignals` เดียวกับ
เมทาดาทาของผู้ให้บริการการสร้าง โดยจัดคีย์ตามชื่อเครื่องมือ `contracts.tools` ประกาศ
ความเป็นเจ้าของ `toolMetadata` ประกาศหลักฐานความพร้อมใช้งานที่มีต้นทุนต่ำ เพื่อให้ OpenClaw สามารถ
หลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin เพียงเพื่อให้แฟกทอรีของเครื่องมือนั้นส่งคืน `null`

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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

หากเครื่องมือไม่มี `toolMetadata` OpenClaw จะรักษาพฤติกรรมเดิมและ
โหลด Plugin เจ้าของเมื่อสัญญาเครื่องมือตรงกับนโยบาย สำหรับเครื่องมือบนเส้นทางร้อน
ที่แฟกทอรีขึ้นกับการยืนยันตัวตน/การกำหนดค่า ผู้เขียน Plugin ควรประกาศ
`toolMetadata` แทนการทำให้แกนหลักนำเข้ารันไทม์เพื่อถาม

## อ้างอิง providerAuthChoices

แต่ละรายการ `providerAuthChoices` อธิบายตัวเลือกการเริ่มต้นใช้งานหรือการยืนยันตัวตนหนึ่งรายการ
OpenClaw อ่านสิ่งนี้ก่อนที่รันไทม์ของผู้ให้บริการจะโหลด
รายการตั้งค่าผู้ให้บริการใช้ตัวเลือกใน manifest เหล่านี้ ตัวเลือกการตั้งค่าที่ได้จาก descriptor
และเมทาดาทาแค็ตตาล็อกการติดตั้งโดยไม่โหลดรันไทม์ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ประเภท                                            | ความหมาย                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | รหัสผู้ให้บริการที่ตัวเลือกนี้เป็นของ                                                                      |
| `method`              | ใช่      | `string`                                        | รหัสวิธีการยืนยันตัวตนที่จะส่งต่อไป                                                                           |
| `choiceId`            | ใช่      | `string`                                        | รหัสตัวเลือกการยืนยันตัวตนที่คงที่ ซึ่งใช้โดยโฟลว์การเริ่มต้นใช้งานและ CLI                                                  |
| `choiceLabel`         | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละเว้น OpenClaw จะย้อนกลับไปใช้ `choiceId`                                        |
| `choiceHint`          | ไม่       | `string`                                        | ข้อความช่วยเหลือสั้นสำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่       | `number`                                        | ค่าที่ต่ำกว่าจะเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดยผู้ช่วย                                       |
| `assistantVisibility` | ไม่       | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกจากตัวเลือกของผู้ช่วย แต่ยังคงอนุญาตให้เลือกด้วย CLI แบบแมนนวล                        |
| `deprecatedChoiceIds` | ไม่       | `string[]`                                      | รหัสตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้ไปยังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่       | `string`                                        | รหัสกลุ่มที่ไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้อง                                                          |
| `groupLabel`          | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่       | `string`                                        | ข้อความช่วยเหลือสั้นสำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่       | `string`                                        | คีย์ตัวเลือกภายในสำหรับโฟลว์การยืนยันตัวตนแบบแฟล็กเดียวอย่างง่าย                                                      |
| `cliFlag`             | ไม่       | `string`                                        | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่       | `string`                                        | รูปแบบตัวเลือก CLI แบบเต็ม เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่       | `string`                                        | คำอธิบายที่ใช้ในวิธีใช้ CLI                                                                            |
| `onboardingScopes`    | ไม่       | `Array<"text-inference" \| "image-generation">` | พื้นผิวการเริ่มต้นใช้งานที่ตัวเลือกนี้ควรปรากฏ หากละเว้น ค่าเริ่มต้นคือ `["text-inference"]` |

## อ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามเรียกใช้เป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ต้อง import โค้ดรันไทม์ของ Plugin

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

| ฟิลด์        | จำเป็น | ประเภท              | ความหมาย                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | ใช่      | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                               |
| `kind`       | ไม่       | `"runtime-slash"` | ระบุ alias ว่าเป็นคำสั่ง slash ในแชต แทนที่จะเป็นคำสั่ง CLI ระดับราก |
| `cliCommand` | ไม่       | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องสำหรับแนะนำให้ใช้กับการดำเนินการ CLI หากมี  |

## ข้อมูลอ้างอิง activation

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผน activation/load

บล็อกนี้เป็น metadata สำหรับ planner ไม่ใช่ lifecycle API บล็อกนี้ไม่ลงทะเบียน
พฤติกรรมรันไทม์ ไม่แทนที่ `register(...)` และไม่รับประกันว่า
โค้ด Plugin ได้รันไปแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ผู้สมัครก่อนจะ fallback ไปยัง metadata ความเป็นเจ้าของใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ให้เลือก metadata ที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของอยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, setup descriptors หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์นั้นได้ ใช้ `activation` สำหรับคำใบ้ planner
เพิ่มเติมที่ไม่สามารถแทนด้วยฟิลด์ความเป็นเจ้าของเหล่านั้นได้
ใช้ `cliBackends` ระดับบนสุดสำหรับ CLI runtime aliases เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้เฉพาะสำหรับ
id ของ agent harness แบบฝังที่ยังไม่มีฟิลด์ความเป็นเจ้าของอยู่แล้ว

บล็อกนี้เป็น metadata เท่านั้น บล็อกนี้ไม่ลงทะเบียนพฤติกรรมรันไทม์ และไม่
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint รันไทม์/Plugin อื่น ๆ
consumer ปัจจุบันใช้บล็อกนี้เป็นคำใบ้สำหรับจำกัดขอบเขตก่อนโหลด Plugin แบบกว้างกว่า ดังนั้น
metadata activation ที่ไม่ใช่ช่วง startup ที่ขาดหายไปมักมีผลแค่ด้านประสิทธิภาพเท่านั้น
และไม่ควรเปลี่ยนความถูกต้องตราบใดที่ fallback ความเป็นเจ้าของใน manifest ยังมีอยู่

ทุก Plugin ควรตั้งค่า `activation.onStartup` อย่างตั้งใจ ตั้งเป็น `true`
เฉพาะเมื่อ Plugin ต้องรันระหว่างการ startup ของ Gateway ตั้งเป็น `false` เมื่อ
Plugin ไม่ทำงานตอน startup และควรโหลดจาก trigger ที่แคบกว่าเท่านั้น
การละ `onStartup` จะไม่ทำให้ Plugin ถูกโหลดตอน startup โดยนัยอีกต่อไป ใช้
metadata activation แบบชัดเจนสำหรับ trigger activation ที่เป็น startup, channel, config, agent-harness, memory หรือ
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

| ฟิลด์              | จำเป็น | ประเภท                                                 | ความหมาย                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | ไม่       | `boolean`                                            | การ activation ตอน startup ของ Gateway แบบชัดเจน ทุก Plugin ควรตั้งค่านี้ `true` จะ import Plugin ระหว่าง startup; `false` จะทำให้ Plugin lazy ตอน startup เว้นแต่ trigger อื่นที่ตรงกันต้องโหลด |
| `onProviders`      | ไม่       | `string[]`                                           | id ของ Provider ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                      |
| `onAgentHarnesses` | ไม่       | `string[]`                                           | id รันไทม์ของ agent harness แบบฝังที่ควรรวม Plugin นี้ไว้ในแผน activation/load ใช้ `cliBackends` ระดับบนสุดสำหรับ CLI backend aliases                                           |
| `onCommands`       | ไม่       | `string[]`                                           | id ของคำสั่งที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onChannels`       | ไม่       | `string[]`                                           | id ของ channel ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onRoutes`         | ไม่       | `string[]`                                           | ชนิดของ route ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onConfigPaths`    | ไม่       | `string[]`                                           | path config แบบอิงจากรากที่ควรรวม Plugin นี้ไว้ในแผน startup/load เมื่อมี path นั้นอยู่และไม่ได้ถูกปิดใช้งานอย่างชัดเจน                                                      |
| `onCapabilities`   | ไม่       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ให้เลือกใช้ฟิลด์ที่แคบกว่าเมื่อเป็นไปได้                                                                                     |

consumer ที่ใช้งานจริงในปัจจุบัน:

- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับการ import ตอน startup
  แบบชัดเจน
- การวางแผน CLI ที่ถูก trigger ด้วยคำสั่งจะ fallback ไปยัง
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- การวางแผน startup ของ agent-runtime ใช้ `activation.onAgentHarnesses` สำหรับ
  harness แบบฝัง และใช้ `cliBackends[]` ระดับบนสุดสำหรับ CLI runtime aliases
- การวางแผน setup/channel ที่ถูก trigger ด้วย channel จะ fallback ไปยังความเป็นเจ้าของ
  `channels[]` แบบเดิมเมื่อ metadata activation ของ channel แบบชัดเจนขาดหายไป
- การวางแผน Plugin ตอน startup ใช้ `activation.onConfigPaths` สำหรับพื้นผิว config ระดับราก
  ที่ไม่ใช่ channel เช่นบล็อก `browser` ของ Plugin browser ที่ bundled มา
- การวางแผน setup/runtime ที่ถูก trigger ด้วย provider จะ fallback ไปยังความเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบเดิม เมื่อ metadata activation ของ provider
  แบบชัดเจนขาดหายไป

การวินิจฉัยของ planner สามารถแยกคำใบ้ activation แบบชัดเจนออกจาก
fallback ความเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายถึง
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายถึง
planner ใช้ความเป็นเจ้าของ `commandAliases` แทน ป้ายเหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยของ host และการทดสอบ ผู้เขียน Plugin ควรประกาศ metadata
ที่อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง qaRunners

ใช้ `qaRunners` เมื่อ Plugin เพิ่ม transport runner หนึ่งรายการหรือมากกว่าไว้ใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน ให้ metadata นี้ประหยัดและเป็น static; รันไทม์ของ Plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
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

| ฟิลด์         | จำเป็น | ประเภท     | ความหมาย                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | ใช่      | `string` | Subcommand ที่ mount อยู่ใต้ `openclaw qa` เช่น `matrix`    |
| `description` | ไม่       | `string` | ข้อความช่วยเหลือ fallback ที่ใช้เมื่อ host ที่ใช้ร่วมกันต้องการคำสั่ง stub |

## ข้อมูลอ้างอิง setup

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการ metadata ราคาถูกที่ Plugin เป็นเจ้าของ
ก่อนโหลดรันไทม์

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

`cliBackends` ระดับบนสุดยังคงถูกต้องและยังอธิบาย CLI inference
backend ต่อไป `setup.cliBackends` คือพื้นผิว descriptor เฉพาะ setup สำหรับ
โฟลว์ control-plane/setup ที่ควรคงเป็น metadata-only

เมื่อมี `setup.providers` และ `setup.cliBackends` อยู่ ทั้งสองจะเป็น
พื้นผิว lookup แบบ descriptor-first ที่ต้องการสำหรับการค้นพบ setup หาก descriptor เพียงแค่
จำกัด Plugin ผู้สมัครและ setup ยังต้องการ hook รันไทม์ช่วง setup ที่สมบูรณ์กว่า
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็น
เส้นทางดำเนินการ fallback

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหา provider auth และ
env-var ทั่วไปด้วย `providerAuthEnvVars` ยังรองรับผ่าน compatibility
adapter ระหว่างช่วง deprecation แต่ Plugin ที่ไม่ bundled ซึ่งยังใช้ฟิลด์นี้
จะได้รับการวินิจฉัย manifest Plugin ใหม่ควรใส่ metadata env ของ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup แบบเรียบง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มี setup entry หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้รันไทม์ setup รายการ `providerAuthChoices` แบบชัดเจนยังคง
เป็นตัวเลือกที่ต้องการสำหรับ label แบบกำหนดเอง, CLI flags, scope ของ onboarding และ metadata ของ assistant

ตั้ง `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw ถือว่า `false` แบบชัดเจนเป็นสัญญา descriptor-only
และจะไม่เรียกใช้ `setup-api` หรือ `openclaw.setupEntry` สำหรับการ lookup setup หาก
Plugin แบบ descriptor-only ยังส่งหนึ่งใน entry รันไทม์ setup เหล่านั้นมาด้วย
OpenClaw จะรายงานการวินิจฉัยแบบ additive และยังคงเพิกเฉยต่อมันต่อไป การละ
`requiresRuntime` จะคงพฤติกรรม fallback แบบเดิมไว้ เพื่อไม่ให้ Plugin ที่มีอยู่ซึ่งเพิ่ม
descriptor โดยไม่มี flag นั้นเสียหาย

เนื่องจากการ lookup setup สามารถรันโค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้ ค่า
`setup.providers[].id` และ `setup.cliBackends[]` ที่ normalize แล้วต้องไม่ซ้ำกันทั่วทั้ง
Plugin ที่ค้นพบ ความเป็นเจ้าของที่คลุมเครือจะ fail closed แทนการเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อรันไทม์ setup ถูกเรียกใช้จริง การวินิจฉัยของ setup registry จะรายงาน descriptor
drift หาก `setup-api` ลงทะเบียน provider หรือ CLI backend ที่ manifest
descriptor ไม่ได้ประกาศไว้ หรือหาก descriptor ไม่มี runtime
registration ที่ตรงกัน การวินิจฉัยเหล่านี้เป็นแบบ additive และไม่ปฏิเสธ Plugin แบบเดิม

### ข้อมูลอ้างอิง setup.providers

| ฟิลด์          | จำเป็น | ประเภท       | ความหมาย                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่      | `string`   | id ของ Provider ที่แสดงระหว่าง setup หรือ onboarding รักษา id ที่ normalize แล้วให้ไม่ซ้ำกันทั่วระบบ             |
| `authMethods`  | ไม่       | `string[]` | id ของวิธี setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลดรันไทม์เต็ม                       |
| `envVars`      | ไม่       | `string[]` | Env vars ที่พื้นผิว setup/status ทั่วไปสามารถตรวจสอบได้ก่อนโหลดรันไทม์ของ Plugin               |
| `authEvidence` | ไม่       | `object[]` | การตรวจสอบหลักฐาน auth ในเครื่องราคาถูกสำหรับ provider ที่สามารถ authenticate ผ่าน marker ที่ไม่ใช่ secret |

`authEvidence` ใช้สำหรับมาร์กเกอร์ข้อมูลประจำตัวแบบโลคัลที่ผู้ให้บริการเป็นเจ้าของ ซึ่งสามารถ
ตรวจสอบได้โดยไม่ต้องโหลดโค้ดรันไทม์ การตรวจสอบเหล่านี้ต้องยังคงประหยัดและเป็นโลคัล:
ไม่มีการเรียกเครือข่าย ไม่มีการอ่าน keychain หรือ secret-manager ไม่มีคำสั่ง shell และไม่มี
การ probe API ของผู้ให้บริการ

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ชนิด       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่       | `string`   | ตัวแปรสภาพแวดล้อมที่มีพาธไฟล์ข้อมูลประจำตัวอย่างชัดเจน                                                           |
| `fallbackPaths`    | ไม่       | `string[]` | พาธไฟล์ข้อมูลประจำตัวแบบโลคัลที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีหรือว่าง รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่       | `string[]` | ต้องมีตัวแปรสภาพแวดล้อมอย่างน้อยหนึ่งรายการในลิสต์ที่ไม่ว่าง ก่อนที่หลักฐานจะถือว่า valid                                    |
| `requiresAllEnv`   | ไม่       | `string[]` | ตัวแปรสภาพแวดล้อมทุกรายการในลิสต์ต้องไม่ว่าง ก่อนที่หลักฐานจะถือว่า valid                                           |
| `credentialMarker` | ใช่      | `string`   | มาร์กเกอร์ที่ไม่ใช่ความลับซึ่งส่งคืนเมื่อมีหลักฐานอยู่                                                       |
| `source`           | ไม่       | `string`   | ป้ายแหล่งที่มาที่แสดงต่อผู้ใช้สำหรับเอาต์พุต auth/status                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ชนิด       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่       | `object[]` | descriptor การตั้งค่าผู้ให้บริการที่เปิดเผยระหว่างการตั้งค่าและการเริ่มต้นใช้งาน                                     |
| `cliBackends`      | ไม่       | `string[]` | id แบ็กเอนด์ช่วงตั้งค่าที่ใช้สำหรับการค้นหาการตั้งค่าแบบ descriptor-first ให้ id ที่ normalized ไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่       | `string[]` | id การย้าย config ที่เป็นของ surface การตั้งค่าของ Plugin นี้                                          |
| `requiresRuntime`  | ไม่       | `boolean`  | การตั้งค่ายังต้องรัน `setup-api` หลังการค้นหา descriptor หรือไม่                            |

## อ้างอิง `uiHints`

`uiHints` คือ map จากชื่อฟิลด์ config ไปยังคำใบ้การเรนเดอร์ขนาดเล็ก

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

| ฟิลด์         | ชนิด       | ความหมาย                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ป้ายฟิลด์ที่แสดงต่อผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือแบบสั้น                      |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นความลับหรือละเอียดอ่อน |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตฟอร์ม       |

## อ้างอิง `contracts`

ใช้ `contracts` เฉพาะสำหรับเมทาดาทาความเป็นเจ้าของ capability แบบ static ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้องนำเข้า runtime ของ Plugin

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

แต่ละลิสต์เป็นแบบไม่บังคับ:

| ฟิลด์                            | ชนิด       | ความหมาย                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id factory ส่วนขยายของ app-server ของ Codex ปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | id runtime ที่ Plugin แบบ bundled อาจลงทะเบียน middleware ผลลัพธ์เครื่องมือให้ได้ |
| `externalAuthProviders`          | `string[]` | id ผู้ให้บริการที่ hook โปรไฟล์ auth ภายนอกเป็นของ Plugin นี้       |
| `speechProviders`                | `string[]` | id ผู้ให้บริการเสียงพูดที่เป็นของ Plugin นี้                                 |
| `realtimeTranscriptionProviders` | `string[]` | id ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่เป็นของ Plugin นี้                 |
| `realtimeVoiceProviders`         | `string[]` | id ผู้ให้บริการเสียงแบบเรียลไทม์ที่เป็นของ Plugin นี้                         |
| `memoryEmbeddingProviders`       | `string[]` | id ผู้ให้บริการ memory embedding ที่เป็นของ Plugin นี้                       |
| `mediaUnderstandingProviders`    | `string[]` | id ผู้ให้บริการ media-understanding ที่เป็นของ Plugin นี้                    |
| `imageGenerationProviders`       | `string[]` | id ผู้ให้บริการ image-generation ที่เป็นของ Plugin นี้                       |
| `videoGenerationProviders`       | `string[]` | id ผู้ให้บริการ video-generation ที่เป็นของ Plugin นี้                       |
| `webFetchProviders`              | `string[]` | id ผู้ให้บริการ web-fetch ที่เป็นของ Plugin นี้                              |
| `webSearchProviders`             | `string[]` | id ผู้ให้บริการ web-search ที่เป็นของ Plugin นี้                             |
| `migrationProviders`             | `string[]` | id ผู้ให้บริการนำเข้าที่เป็นของ Plugin นี้สำหรับ `openclaw migrate`          |
| `tools`                          | `string[]` | ชื่อเครื่องมือ agent ที่เป็นของ Plugin นี้                                    |

`contracts.embeddedExtensionFactories` ยังคงไว้สำหรับ factory ส่วนขยายเฉพาะ
app-server ของ Codex แบบ bundled การแปลงผลลัพธ์เครื่องมือแบบ bundled ควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน Plugin ภายนอกไม่สามารถ
ลงทะเบียน middleware ผลลัพธ์เครื่องมือได้ เพราะ seam นี้สามารถเขียนเอาต์พุตเครื่องมือที่มีความน่าเชื่อถือสูงใหม่
ก่อนที่โมเดลจะเห็น

การลงทะเบียน runtime `api.registerTool(...)` ต้องตรงกับ `contracts.tools`
การค้นพบเครื่องมือใช้ลิสต์นี้เพื่อโหลดเฉพาะ runtime ของ Plugin ที่สามารถเป็นเจ้าของ
เครื่องมือที่ร้องขอได้

Provider Plugin ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugin ที่ไม่มีการประกาศยังคงรัน
ผ่าน fallback ความเข้ากันได้ที่เลิกใช้แล้ว แต่ fallback นั้นช้ากว่าและ
จะถูกนำออกหลังช่วง migration

ผู้ให้บริการ memory embedding แบบ bundled ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับทุก id adapter ที่เปิดเผย รวมถึง
adapter ในตัว เช่น `local` พาธ CLI แบบ standalone ใช้ contract ใน manifest นี้
เพื่อโหลดเฉพาะ Plugin เจ้าของ ก่อนที่ runtime ของ Gateway แบบเต็มจะ
ลงทะเบียนผู้ให้บริการ

## อ้างอิง `mediaUnderstandingProviderMetadata`

ใช้ `mediaUnderstandingProviderMetadata` เมื่อผู้ให้บริการ media-understanding มี
โมเดล default, ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสาร native ที่
helper ของ core แบบทั่วไปต้องใช้ก่อน runtime โหลด คีย์ต้องถูกประกาศใน
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

แต่ละรายการผู้ให้บริการสามารถมีได้:

| ฟิลด์                  | ชนิด                                | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | capability สื่อที่ผู้ให้บริการนี้เปิดเผย                                 |
| `defaultModels`        | `Record<string, string>`            | default จาก capability ไปยังโมเดลที่ใช้เมื่อ config ไม่ได้ระบุโมเดล      |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะถูกจัดเรียงก่อนสำหรับ fallback ผู้ให้บริการอัตโนมัติตามข้อมูลประจำตัว |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสาร native ที่ผู้ให้บริการรองรับ                            |

## อ้างอิง `channelConfigs`

ใช้ `channelConfigs` เมื่อ Plugin ช่องทางต้องการเมทาดาทา config ที่ประหยัดก่อนที่
runtime จะโหลด การค้นพบการตั้งค่า/status ของช่องทางแบบอ่านอย่างเดียวสามารถใช้เมทาดาทานี้
โดยตรงสำหรับช่องทางภายนอกที่กำหนดค่าไว้เมื่อไม่มีรายการ setup ให้ใช้ หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้ runtime ของ setup

`channelConfigs` คือเมทาดาทา manifest ของ Plugin ไม่ใช่ section config ระดับบนสุดใหม่
สำหรับผู้ใช้ ผู้ใช้ยังคงกำหนดค่าอินสแตนซ์ช่องทางใต้ `channels.<channel-id>`
OpenClaw อ่านเมทาดาทา manifest เพื่อตัดสินว่า Plugin ใดเป็นเจ้าของช่องทางที่กำหนดค่าไว้
ก่อนที่โค้ด runtime ของ Plugin จะทำงาน

สำหรับ Plugin ช่องทาง `configSchema` และ `channelConfigs` อธิบายพาธที่ต่างกัน:

- `configSchema` ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบ `channels.<channel-id>`

Plugin ที่ไม่ใช่ bundled ซึ่งประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มี OpenClaw ยังสามารถโหลด Plugin ได้ แต่
surface ของ schema config ใน cold-path, setup และ Control UI จะไม่รู้
รูปแบบตัวเลือกที่ช่องทางเป็นเจ้าของจนกว่า runtime ของ Plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศ default แบบ static ของ `auto` สำหรับการตรวจสอบ config คำสั่ง
ที่รันก่อน runtime ของช่องทางจะโหลด ช่องทางแบบ bundled ยังสามารถเผยแพร่
default เดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
เมทาดาทา catalog ช่องทางอื่นที่ package เป็นเจ้าของ

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

แต่ละรายการช่องทางสามารถมีได้:

| ฟิลด์         | ประเภท                     | ความหมาย                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | สคีมา JSON สำหรับ `channels.<id>` จำเป็นสำหรับรายการการกำหนดค่าแชนเนลที่ประกาศแต่ละรายการ         |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ UI/ข้อความตัวอย่าง/คำใบ้ข้อมูลอ่อนไหวที่ไม่บังคับสำหรับส่วนการกำหนดค่าแชนเนลนั้น          |
| `label`       | `string`                 | ป้ายกำกับแชนเนลที่ผสานเข้ากับตัวเลือกและพื้นผิวการตรวจสอบเมื่อเมตาดาตารันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายแชนเนลแบบสั้นสำหรับพื้นผิวการตรวจสอบและแค็ตตาล็อก                               |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติของคำสั่งเนทีฟแบบคงที่และ Skills เนทีฟสำหรับการตรวจสอบการกำหนดค่าก่อนรันไทม์       |
| `preferOver`  | `string[]`               | id ของ Plugin แบบเดิมหรือที่มีลำดับความสำคัญต่ำกว่าซึ่งแชนเนลนี้ควรอยู่เหนือกว่าในพื้นผิวการเลือก    |

### การแทนที่ Plugin แชนเนลอื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับ id แชนเนลที่
Plugin อื่นก็สามารถจัดหาได้เช่นกัน กรณีที่พบบ่อยคือ id ของ Plugin ที่เปลี่ยนชื่อ,
Plugin แบบสแตนด์อโลนที่แทนที่ Plugin ที่รวมมาในชุด, หรือฟอร์กที่ดูแลต่อซึ่ง
คง id แชนเนลเดิมไว้เพื่อความเข้ากันได้ของการกำหนดค่า

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

เมื่อกำหนดค่า `channels.chat` แล้ว OpenClaw จะพิจารณาทั้ง id แชนเนลและ
id ของ Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
รวมมาในชุดหรือเปิดใช้ตามค่าเริ่มต้น OpenClaw จะปิดใช้งาน Plugin นั้นในการกำหนดค่า
รันไทม์ที่มีผล เพื่อให้ Plugin เดียวเป็นเจ้าของแชนเนลและเครื่องมือของแชนเนลนั้น การเลือกของผู้ใช้
แบบชัดเจนยังคงมีสิทธิ์เหนือกว่า: หากผู้ใช้เปิดใช้ Plugin ทั้งสองอย่างชัดเจน OpenClaw
จะคงตัวเลือกนั้นไว้และรายงานการวินิจฉัยแชนเนล/เครื่องมือซ้ำ แทนที่จะ
เปลี่ยนชุด Plugin ที่ร้องขออย่างเงียบ ๆ

จำกัดขอบเขต `preferOver` ไว้เฉพาะ id ของ Plugin ที่สามารถจัดหาแชนเนลเดียวกันได้จริง
นี่ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อคีย์การกำหนดค่าของผู้ใช้

## ข้อมูลอ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin ผู้ให้บริการของคุณจาก
id โมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนโหลดรันไทม์
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

- การอ้างอิง `provider/model` แบบชัดเจนใช้เมตาดาตาแมนิเฟสต์ `providers` ของเจ้าของ
- `modelPatterns` มีสิทธิ์เหนือกว่า `modelPrefixes`
- หาก Plugin ที่ไม่ได้รวมมาในชุดหนึ่งรายการและ Plugin ที่รวมมาในชุดหนึ่งรายการตรงกันทั้งคู่ Plugin
  ที่ไม่ได้รวมมาในชุดจะมีสิทธิ์เหนือกว่า
- ความกำกวมที่เหลือจะถูกละเว้นจนกว่าผู้ใช้หรือการกำหนดค่าจะระบุผู้ให้บริการ

ฟิลด์:

| ฟิลด์           | ประเภท       | ความหมาย                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | คำนำหน้าที่จับคู่ด้วย `startsWith` กับ id โมเดลแบบย่อ                 |
| `modelPatterns` | `string[]` | แหล่งที่มาของนิพจน์ปกติที่จับคู่กับ id โมเดลแบบย่อหลังจากนำส่วนต่อท้ายของโปรไฟล์ออก |

## ข้อมูลอ้างอิง `modelCatalog`

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้เมตาดาตาโมเดลของผู้ให้บริการก่อน
โหลดรันไทม์ของ Plugin นี่คือแหล่งที่แมนิเฟสต์เป็นเจ้าของสำหรับแถวแค็ตตาล็อกแบบคงที่,
นามแฝงของผู้ให้บริการ, กฎการระงับ, และโหมดการค้นพบ การรีเฟรชรันไทม์
ยังคงอยู่ในโค้ดรันไทม์ของผู้ให้บริการ แต่แมนิเฟสต์จะบอกแกนหลักเมื่อจำเป็นต้องใช้รันไทม์

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

| ฟิลด์          | ประเภท                                                     | ความหมาย                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | แถวแค็ตตาล็อกสำหรับ id ผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย       |
| `aliases`      | `Record<string, object>`                                 | นามแฝงของผู้ให้บริการที่ควรแก้ไขไปยังผู้ให้บริการที่เป็นเจ้าของสำหรับการวางแผนแค็ตตาล็อกหรือการระงับ              |
| `suppressions` | `object[]`                                               | แถวโมเดลจากแหล่งอื่นที่ Plugin นี้ระงับด้วยเหตุผลเฉพาะของผู้ให้บริการ                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | แค็ตตาล็อกผู้ให้บริการสามารถอ่านจากเมตาดาตาแมนิเฟสต์ รีเฟรชเข้าแคช หรือต้องใช้รันไทม์หรือไม่ |

`aliases` มีส่วนร่วมในการค้นหาความเป็นเจ้าของผู้ให้บริการสำหรับการวางแผนแค็ตตาล็อกโมเดล
เป้าหมายของนามแฝงต้องเป็นผู้ให้บริการระดับบนสุดที่ Plugin เดียวกันเป็นเจ้าของ เมื่อรายการ
ที่กรองตามผู้ให้บริการใช้นามแฝง OpenClaw สามารถอ่านแมนิเฟสต์ของเจ้าของและ
ใช้การแทนที่ API/URL ฐานของนามแฝงได้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ
นามแฝงจะไม่ขยายรายการแค็ตตาล็อกที่ไม่กรอง; รายการแบบกว้างจะแสดงเฉพาะ
แถวของผู้ให้บริการตามรูปแบบมาตรฐานที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ฮุก `suppressBuiltInModel` ของรันไทม์ผู้ให้บริการเดิม
รายการการระงับจะมีผลเฉพาะเมื่อผู้ให้บริการเป็นของ Plugin หรือ
ประกาศเป็นคีย์ `modelCatalog.aliases` ที่ชี้ไปยังผู้ให้บริการที่เป็นเจ้าของ ฮุกการระงับ
ของรันไทม์จะไม่ถูกเรียกระหว่างการแก้ไขโมเดลอีกต่อไป

ฟิลด์ผู้ให้บริการ:

| ฟิลด์     | ประเภท                     | ความหมาย                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL ฐานเริ่มต้นที่ไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้    |
| `api`     | `ModelApi`               | อะแดปเตอร์ API เริ่มต้นที่ไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้ |
| `headers` | `Record<string, string>` | ส่วนหัวแบบคงที่ที่ไม่บังคับซึ่งใช้กับแค็ตตาล็อกผู้ให้บริการนี้      |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละเว้น            |

ฟิลด์โมเดล:

| ฟิลด์           | ประเภท                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | id โมเดลภายในผู้ให้บริการ โดยไม่มีคำนำหน้า `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่ใช้แสดงผลที่ไม่บังคับ                                                      |
| `api`           | `ModelApi`                                                     | การแทนที่ API ต่อโมเดลที่ไม่บังคับ                                            |
| `baseUrl`       | `string`                                                       | การแทนที่ URL ฐานต่อโมเดลที่ไม่บังคับ                                       |
| `headers`       | `Record<string, string>`                                       | ส่วนหัวแบบคงที่ต่อโมเดลที่ไม่บังคับ                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | รูปแบบข้อมูลที่โมเดลยอมรับ                                               |
| `reasoning`     | `boolean`                                                      | โมเดลเปิดเผยพฤติกรรมการใช้เหตุผลหรือไม่                               |
| `contextWindow` | `number`                                                       | หน้าต่างบริบทดั้งเดิมของผู้ให้บริการ                                             |
| `contextTokens` | `number`                                                       | ขีดจำกัดบริบทรันไทม์ที่มีผลซึ่งไม่บังคับ เมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวนโทเค็นเอาต์พุตสูงสุดเมื่อทราบ                                           |
| `cost`          | `object`                                                       | ราคาต่อหนึ่งล้านโทเค็นเป็นดอลลาร์สหรัฐที่ไม่บังคับ รวมถึง `tieredPricing` ที่ไม่บังคับ |
| `compat`        | `object`                                                       | แฟล็กความเข้ากันได้ที่ไม่บังคับ ซึ่งตรงกับความเข้ากันได้ของการกำหนดค่าโมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะรายการ ระงับเฉพาะเมื่อแถวนั้นต้องไม่ปรากฏเลย          |
| `statusReason`  | `string`                                                       | เหตุผลที่ไม่บังคับซึ่งแสดงกับสถานะที่ไม่พร้อมใช้งาน                            |
| `replaces`      | `string[]`                                                     | id โมเดลภายในผู้ให้บริการรุ่นเก่าที่โมเดลนี้แทนที่                       |
| `replacedBy`    | `string`                                                       | id โมเดลภายในผู้ให้บริการที่ใช้แทนสำหรับแถวที่เลิกใช้แล้ว                    |
| `tags`          | `string[]`                                                     | แท็กที่เสถียรซึ่งใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์การระงับ:

| ฟิลด์                      | ประเภท       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | id ผู้ให้บริการสำหรับแถวต้นทางที่จะระงับ ต้องเป็นของ Plugin นี้หรือประกาศเป็นนามแฝงที่เป็นเจ้าของ |
| `model`                    | `string`   | id โมเดลภายในผู้ให้บริการที่จะระงับ                                                                      |
| `reason`                   | `string`   | ข้อความที่ไม่บังคับซึ่งแสดงเมื่อมีการร้องขอแถวที่ถูกระงับโดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายการโฮสต์ URL ฐานของผู้ให้บริการที่มีผลซึ่งไม่บังคับ และต้องมีอยู่ก่อนที่การระงับจะมีผล               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของการกำหนดค่าผู้ให้บริการแบบตรงกันทุกประการที่ไม่บังคับ และต้องมีอยู่ก่อนที่การระงับจะมีผล              |

อย่าใส่ข้อมูลที่ใช้เฉพาะตอนรันไทม์ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อแถวใน manifest สมบูรณ์พอให้พื้นผิวรายการและตัวเลือกที่กรองตาม provider ข้ามการค้นหา registry/runtime ได้ ใช้ `refreshable` เมื่อแถวใน manifest มีประโยชน์ในฐานะ seed หรือข้อมูลเสริมที่แสดงเป็นรายการได้ แต่การ refresh/cache สามารถเพิ่มแถวเพิ่มเติมในภายหลังได้ แถวแบบ refreshable ไม่ถือเป็นแหล่งอ้างอิงที่มีอำนาจโดยตัวเอง ใช้ `runtime` เมื่อ OpenClaw ต้องโหลด runtime ของ provider เพื่อให้รู้รายการ

## ข้อมูลอ้างอิง modelIdNormalization

ใช้ `modelIdNormalization` สำหรับการล้าง model-id ราคาถูกที่ provider เป็นเจ้าของ ซึ่งต้องเกิดขึ้นก่อน runtime ของ provider โหลด วิธีนี้ทำให้นามแฝง เช่น ชื่อโมเดลแบบสั้น, id เดิมเฉพาะ provider และกฎ prefix ของ proxy อยู่ใน manifest ของ Plugin ที่เป็นเจ้าของ แทนที่จะอยู่ในตารางเลือกโมเดลของ core

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

| ฟิลด์                               | ประเภท                 | ความหมาย                                                                                  |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | นามแฝง model-id แบบตรงตัวที่ไม่สนตัวพิมพ์เล็กใหญ่ ค่าจะถูกส่งคืนตามที่เขียนไว้          |
| `stripPrefixes`                      | `string[]`              | Prefix ที่จะลบออกก่อนค้นหานามแฝง มีประโยชน์สำหรับการซ้ำซ้อนแบบ provider/model รุ่นเก่า |
| `prefixWhenBare`                     | `string`                | Prefix ที่จะเพิ่มเมื่อ model id ที่ normalize แล้ว ยังไม่มี `/` อยู่                     |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎ prefix ของ bare-id แบบมีเงื่อนไขหลังค้นหานามแฝง โดยอิงจาก `modelPrefix` และ `prefix` |

## ข้อมูลอ้างอิง providerEndpoints

ใช้ `providerEndpoints` สำหรับการจัดประเภท endpoint ที่นโยบายคำขอทั่วไปต้องรู้ก่อน runtime ของ provider โหลด Core ยังคงเป็นเจ้าของความหมายของแต่ละ `endpointClass`; manifest ของ Plugin เป็นเจ้าของ metadata ของ host และ base URL

ฟิลด์ของ endpoint:

| ฟิลด์                         | ประเภท     | ความหมาย                                                                                          |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาส endpoint ที่ core รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`           |
| `hosts`                        | `string[]` | ชื่อ host แบบตรงตัวที่ map ไปยังคลาส endpoint                                                     |
| `hostSuffixes`                 | `string[]` | Suffix ของ host ที่ map ไปยังคลาส endpoint ใส่ `.` นำหน้าเพื่อให้ตรงเฉพาะ domain suffix เท่านั้น |
| `baseUrls`                     | `string[]` | HTTP(S) base URL ที่ normalize แล้วแบบตรงตัว ซึ่ง map ไปยังคลาส endpoint                         |
| `googleVertexRegion`           | `string`   | Region ของ Google Vertex แบบ static สำหรับ global host แบบตรงตัว                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffix ที่จะตัดออกจาก host ที่ตรงกัน เพื่อเปิดเผย prefix ของ region Google Vertex                 |

## ข้อมูลอ้างอิง providerRequest

ใช้ `providerRequest` สำหรับ metadata ความเข้ากันได้ของคำขอแบบราคาถูกที่นโยบายคำขอทั่วไปต้องใช้โดยไม่ต้องโหลด runtime ของ provider เก็บการเขียน payload ใหม่ที่เฉพาะต่อพฤติกรรมไว้ใน hook ของ runtime provider หรือตัวช่วยตระกูล provider ที่ใช้ร่วมกัน

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

ฟิลด์ของ provider:

| ฟิลด์                | ประเภท       | ความหมาย                                                                           |
| --------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายกำกับตระกูล provider ที่ใช้ในการตัดสินใจความเข้ากันได้ของคำขอทั่วไปและการวินิจฉัย |
| `compatibilityFamily` | `"moonshot"` | กลุ่มความเข้ากันได้ของตระกูล provider แบบไม่บังคับ สำหรับตัวช่วยคำขอที่ใช้ร่วมกัน |
| `openAICompletions`   | `object`     | flag ของคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage` |

## ข้อมูลอ้างอิง modelPricing

ใช้ `modelPricing` เมื่อ provider ต้องควบคุมพฤติกรรม pricing ฝั่ง control-plane ก่อน runtime โหลด pricing cache ของ Gateway อ่าน metadata นี้โดยไม่ import โค้ด runtime ของ provider

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

ฟิลด์ของ provider:

| ฟิลด์       | ประเภท            | ความหมาย                                                                                                  |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | ตั้งเป็น `false` สำหรับ provider แบบ local/self-hosted ที่ไม่ควรดึงราคา OpenRouter หรือ LiteLLM เลย       |
| `openRouter` | `false \| object` | mapping การค้นหาราคา OpenRouter ค่า `false` จะปิดการค้นหา OpenRouter สำหรับ provider นี้                  |
| `liteLLM`    | `false \| object` | mapping การค้นหาราคา LiteLLM ค่า `false` จะปิดการค้นหา LiteLLM สำหรับ provider นี้                       |

ฟิลด์ของ source:

| ฟิลด์                     | ประเภท             | ความหมาย                                                                                                      |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | id ของ provider ใน catalog ภายนอกเมื่อแตกต่างจาก id provider ของ OpenClaw เช่น `z-ai` สำหรับ provider `zai` |
| `passthroughProviderModel` | `boolean`          | ปฏิบัติต่อ model id ที่มี slash เป็น ref provider/model ซ้อนกัน มีประโยชน์สำหรับ proxy provider เช่น OpenRouter |
| `modelIdTransforms`        | `"version-dots"[]` | variant ของ model-id ใน catalog ภายนอกเพิ่มเติม `version-dots` จะลอง id เวอร์ชันแบบมีจุด เช่น `claude-opus-4.6` |

### ดัชนี Provider ของ OpenClaw

ดัชนี Provider ของ OpenClaw คือ metadata แบบ preview ที่ OpenClaw เป็นเจ้าของสำหรับ provider ที่ Plugin อาจยังไม่ได้ติดตั้ง ยังไม่ถือเป็นส่วนหนึ่งของ manifest ของ Plugin manifest ของ Plugin ยังคงเป็นแหล่งอ้างอิงที่มีอำนาจของ Plugin ที่ติดตั้งแล้ว ดัชนี Provider คือ contract สำรองภายในที่พื้นผิวตัวเลือก provider ที่ติดตั้งได้ในอนาคตและตัวเลือกโมเดลก่อนติดตั้งจะใช้เมื่อยังไม่ได้ติดตั้ง Plugin ของ provider

ลำดับอำนาจของ catalog:

1. config ของผู้ใช้
2. manifest ของ Plugin ที่ติดตั้งแล้ว `modelCatalog`
3. cache ของ catalog โมเดลจากการ refresh อย่างชัดเจน
4. แถว preview ของดัชนี Provider ของ OpenClaw

ดัชนี Provider ต้องไม่มี secret, สถานะเปิดใช้งาน, hook runtime หรือข้อมูลโมเดลสดที่เฉพาะบัญชี catalog แบบ preview ใช้รูปแบบแถว provider ของ `modelCatalog` แบบเดียวกับ manifest ของ Plugin แต่ควรจำกัดอยู่ที่ metadata การแสดงผลที่เสถียร เว้นแต่ฟิลด์ adapter runtime เช่น `api`, `baseUrl`, pricing หรือ flag ความเข้ากันได้ จะถูกตั้งใจให้สอดคล้องกับ manifest ของ Plugin ที่ติดตั้งแล้ว provider ที่มีการค้นหา `/models` แบบสดควรเขียนแถวที่ refresh แล้วผ่านเส้นทาง cache ของ catalog โมเดลแบบชัดเจน แทนที่จะให้การแสดงรายการปกติหรือ onboarding เรียก API ของ provider

รายการในดัชนี Provider อาจมี metadata ของ Plugin ที่ติดตั้งได้สำหรับ provider ที่ Plugin ถูกย้ายออกจาก core หรือยังไม่ได้ติดตั้งอยู่ด้วย metadata นี้สะท้อนรูปแบบ catalog ของช่องทาง: ชื่อ package, spec การติดตั้ง npm, integrity ที่คาดหวัง และป้ายกำกับตัวเลือก auth แบบราคาถูก เพียงพอสำหรับแสดงตัวเลือกการตั้งค่าที่ติดตั้งได้ เมื่อติดตั้ง Plugin แล้ว manifest ของ Plugin จะชนะ และรายการในดัชนี Provider จะถูกละเว้นสำหรับ provider นั้น

คีย์ capability ระดับบนสุดแบบ legacy ถูกเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อย้าย `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นเจ้าของ capability อีกต่อไป

## Manifest เทียบกับ package.json

ไฟล์ทั้งสองทำหน้าที่ต่างกัน:

| ไฟล์                  | ใช้สำหรับ                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | การค้นพบ, การตรวจสอบ config, metadata ตัวเลือก auth และ hint ของ UI ที่ต้องมีอยู่ก่อนโค้ด Plugin รัน                  |
| `package.json`         | metadata ของ npm, การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, install gating, setup หรือ catalog metadata |

หากคุณไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- ถ้า OpenClaw ต้องรู้ก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- ถ้าเกี่ยวกับ packaging, entry file หรือพฤติกรรมการติดตั้ง npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่มีผลต่อการค้นพบ

metadata ของ Plugin บางส่วนที่อยู่ก่อน runtime ตั้งใจให้อยู่ใน `package.json` ภายใต้บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`
`openclaw.bundle` และ `openclaw.bundle.json` ไม่ใช่ contract ของ Plugin OpenClaw; Plugin แบบ native ต้องใช้ `openclaw.plugin.json` ร่วมกับฟิลด์ `package.json#openclaw` ที่รองรับด้านล่าง

ตัวอย่างสำคัญ:

| ฟิลด์                                                                                      | ความหมาย                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ประกาศ entrypoint ของ Plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | ประกาศ entrypoint runtime ของ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น                                                                 |
| `openclaw.setupEntry`                                                                      | entrypoint สำหรับ setup เท่านั้นแบบเบา ใช้ระหว่าง onboarding, การเริ่ม channel แบบหน่วงเวลา, และการค้นหาสถานะ channel/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น |
| `openclaw.runtimeSetupEntry`                                                               | ประกาศ entrypoint setup ของ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องมี `setupEntry`, ต้องมีอยู่จริง, และต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin                         |
| `openclaw.channel`                                                                         | metadata catalog ของ channel แบบเบา เช่น ป้ายกำกับ, เส้นทาง docs, alias, และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                                                | metadata แบบคงที่ของคำสั่งเนทีฟและค่าเริ่มต้นอัตโนมัติของ native skill ที่ใช้โดยพื้นผิว config, audit, และรายการคำสั่งก่อน runtime ของ channel จะโหลด                                          |
| `openclaw.channel.configuredState`                                                         | metadata ตัวตรวจสอบ configured-state แบบเบาที่สามารถตอบว่า "setup แบบ env-only มีอยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ของ channel ทั้งหมด                                         |
| `openclaw.channel.persistedAuthState`                                                      | metadata ตัวตรวจสอบ persisted-auth แบบเบาที่สามารถตอบว่า "มีอะไรที่ลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลด runtime ของ channel ทั้งหมด                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | คำใบ้สำหรับติดตั้ง/อัปเดต Plugin ที่ bundled และ Plugin ที่เผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | เส้นทางติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้ใช้                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | เวอร์ชันโฮสต์ OpenClaw ขั้นต่ำที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22` หรือ `>=2026.5.1-beta.1`                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | สตริง npm dist integrity ที่คาดไว้ เช่น `sha512-...`; โฟลว์ install และ update จะตรวจสอบ artifact ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | อนุญาตเส้นทางกู้คืนการติดตั้ง Plugin ที่ bundled แบบจำกัดเมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | อนุญาตให้พื้นผิว channel แบบ setup-only โหลดก่อน Plugin channel แบบเต็มระหว่าง startup                                                                                                 |

metadata ของ manifest จะตัดสินใจว่า provider/channel/setup ตัวเลือกใดจะปรากฏใน
onboarding ก่อน runtime โหลด `package.json#openclaw.install` บอก
onboarding ว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้ายคำใบ้การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` จะถูกบังคับใช้ระหว่าง install และการโหลด
registry ของ manifest สำหรับแหล่ง Plugin ที่ไม่ใช่ bundled ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ;
ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม Plugin ภายนอกบนโฮสต์เก่า แหล่ง Plugin แบบ bundled
จะถือว่า co-versioned กับ checkout ของโฮสต์

metadata install-on-demand อย่างเป็นทางการควรใช้ `clawhubSpec` เมื่อ Plugin
เผยแพร่บน ClawHub; onboarding จะถือว่านี่เป็นแหล่งรีโมตที่ต้องการและ
บันทึกข้อเท็จจริงของ artifact ClawHub หลัง install `npmSpec` ยังคงเป็น fallback
เพื่อความเข้ากันได้สำหรับแพ็กเกจที่ยังไม่ได้ย้ายไป ClawHub

การ pin เวอร์ชัน npm แบบ exact อยู่ใน `npmSpec` อยู่แล้ว ตัวอย่างเช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการ catalog ภายนอก
อย่างเป็นทางการควรจับคู่ spec แบบ exact กับ `expectedIntegrity` เพื่อให้โฟลว์ update ล้มเหลวแบบปิด
หาก artifact npm ที่ดึงมาไม่ตรงกับ release ที่ pin ไว้อีกต่อไป
onboarding แบบ interactive ยังคงเสนอ npm spec จาก registry ที่เชื่อถือได้ รวมถึงชื่อ
แพ็กเกจเปล่าและ dist-tag เพื่อความเข้ากันได้ การวินิจฉัย catalog สามารถ
แยกแยะแหล่งที่เป็น exact, floating, integrity-pinned, missing-integrity, package-name
mismatch, และ invalid default-choice ได้ นอกจากนี้ยังเตือนเมื่อ
`expectedIntegrity` มีอยู่แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ pin ได้
เมื่อมี `expectedIntegrity`
โฟลว์ install/update จะบังคับใช้ค่านี้; เมื่อไม่มีค่านี้ การ resolve registry จะถูก
บันทึกโดยไม่มี integrity pin

Plugin channel ควรให้ `openclaw.setupEntry` เมื่อ status, รายการ channel,
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่ configured โดยไม่โหลด runtime
ทั้งหมด entry setup ควรเปิดเผย metadata ของ channel รวมถึง adapter สำหรับ config,
status, และ secrets ที่ปลอดภัยต่อ setup; ให้เก็บ network clients, gateway listeners, และ
transport runtimes ไว้ใน entrypoint หลักของ extension

ฟิลด์ entrypoint ของ runtime ไม่ได้ override การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
entrypoint ของ source ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
path `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกตั้งใจให้แคบโดยเฉพาะ มันไม่ได้
ทำให้ config ที่เสียหายตามอำเภอใจติดตั้งได้ ปัจจุบันมันอนุญาตเฉพาะโฟลว์ install
ให้กู้คืนจากความล้มเหลวเฉพาะของการอัปเกรด Plugin bundled ที่ค้างอยู่ เช่น
path ของ Plugin bundled ที่หายไป หรือ entry `channels.<id>` ที่ค้างอยู่สำหรับ
Plugin bundled เดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อก install และส่ง operator
ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ metadata ของแพ็กเกจสำหรับโมดูลตัวตรวจสอบ
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

ใช้เมื่อ setup, doctor, status, หรือโฟลว์ presence แบบอ่านอย่างเดียวต้องการ probe auth
แบบ yes/no ที่เบาก่อน Plugin channel แบบเต็มจะโหลด สถานะ persisted auth ไม่ใช่
สถานะ channel ที่ configured: อย่าใช้ metadata นี้เพื่อเปิดใช้ Plugin อัตโนมัติ,
ซ่อมแซม dependency ของ runtime, หรือตัดสินใจว่า runtime ของ channel ควรโหลดหรือไม่
target export ควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะ persisted state; อย่า
ส่งผ่าน barrel ของ runtime channel แบบเต็ม

`openclaw.channel.configuredState` ใช้รูปร่างเดียวกันสำหรับการตรวจสอบ configured
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

ใช้เมื่อ channel สามารถตอบ configured-state จาก env หรือ input ขนาดเล็กอื่นๆ
ที่ไม่ใช่ runtime หากการตรวจสอบต้องใช้การ resolve config แบบเต็มหรือ runtime
channel จริง ให้เก็บ logic นั้นไว้ใน hook `config.hasConfiguredState`
ของ Plugin แทน

## ลำดับความสำคัญในการค้นพบ (id ของ Plugin ซ้ำกัน)

OpenClaw ค้นพบ Plugin จาก root หลายแหล่ง (bundled, global install, workspace, path ที่เลือกอย่างชัดเจนด้วย config) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด** เท่านั้น; duplicate ที่มีลำดับความสำคัญต่ำกว่าจะถูกทิ้งแทนที่จะโหลดเคียงข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **เลือกด้วย config** — path ที่ pin ไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อมกับ OpenClaw
3. **Global install** — Plugin ที่ติดตั้งลงใน root ของ Plugin OpenClaw แบบ global
4. **Workspace** — Plugin ที่ค้นพบโดยสัมพันธ์กับ workspace ปัจจุบัน

ผลกระทบ:

- สำเนา fork หรือสำเนาเก่าของ Plugin bundled ที่อยู่ใน workspace จะไม่ shadow build ที่ bundled
- หากต้องการ override Plugin bundled ด้วย Plugin local จริงๆ ให้ pin ผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญแทนการพึ่งพาการค้นพบใน workspace
- การทิ้ง duplicate จะถูก log เพื่อให้ Doctor และการวินิจฉัย startup ชี้ไปยังสำเนาที่ถูกทิ้งได้
- duplicate override ที่เลือกด้วย config จะถูกเขียนใน diagnostics ว่าเป็น override อย่างชัดเจน แต่ยังคงเตือนเพื่อให้ fork เก่าและ shadow โดยไม่ตั้งใจยังมองเห็นได้

## ข้อกำหนดของ JSON Schema

- **Plugin ทุกตัวต้องมาพร้อม JSON Schema** แม้ว่าจะไม่รับ config ก็ตาม
- schema ว่างเป็นที่ยอมรับได้ (ตัวอย่างเช่น `{ "type": "object", "additionalProperties": false }`)
- schema จะถูก validate ตอนอ่าน/เขียน config ไม่ใช่ตอน runtime
- เมื่อขยายหรือ fork Plugin bundled ด้วยคีย์ config ใหม่ ให้ update `configSchema` ใน `openclaw.plugin.json` ของ Plugin นั้นพร้อมกัน schema ของ Plugin bundled เป็นแบบ strict ดังนั้นการเพิ่ม `plugins.entries.<id>.config.myNewKey` ใน user config โดยไม่เพิ่ม `myNewKey` ไปยัง `configSchema.properties` จะถูกปฏิเสธก่อน runtime ของ Plugin จะโหลด

ตัวอย่างการขยาย schema:

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

## พฤติกรรมการตรวจสอบ

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ว่า id ของ channel จะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, และ `plugins.slots.*`
  ต้องอ้างอิง id ของ Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักเป็น **ข้อผิดพลาด**
- หาก Plugin ถูกติดตั้งแล้วแต่ manifest หรือ schema เสียหรือหายไป
  การ validation จะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin อยู่แต่ Plugin ถูก **ปิดใช้งาน** config จะถูกเก็บไว้และ
  **คำเตือน** จะแสดงใน Doctor + logs

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema `plugins.*` ทั้งหมด

## หมายเหตุ

- แมนิเฟสต์เป็นสิ่งที่**จำเป็นสำหรับ Plugin OpenClaw แบบเนทีฟ** รวมถึงการโหลดจากระบบไฟล์ภายในเครื่องด้วย Runtime ยังคงโหลดโมดูล Plugin แยกต่างหาก; แมนิเฟสต์ใช้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น
- แมนิเฟสต์แบบเนทีฟถูกแยกวิเคราะห์ด้วย JSON5 ดังนั้นคอมเมนต์ คอมมาต่อท้าย และคีย์ที่ไม่ใส่เครื่องหมายคำพูดจึงใช้ได้ ตราบใดที่ค่าสุดท้ายยังเป็นออบเจ็กต์
- ตัวโหลดแมนิเฟสต์จะอ่านเฉพาะฟิลด์ของแมนิเฟสต์ที่มีเอกสารระบุไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดที่กำหนดเอง
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ทั้งหมดได้เมื่อ Plugin ไม่ต้องใช้
- `providerCatalogEntry` ต้องมีน้ำหนักเบาและไม่ควรนำเข้าโค้ด Runtime แบบกว้าง; ใช้สำหรับเมตาดาต้าแค็ตตาล็อก provider แบบสแตติกหรือตัวอธิบายการค้นพบแบบแคบ ไม่ใช่การดำเนินการระหว่างคำขอ `providerDiscoveryEntry` เป็นการสะกดแบบเก่าและยังคงใช้งานได้กับ Plugin ที่มีอยู่
- ชนิด Plugin แบบเอกสิทธิ์ถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- ประกาศชนิด Plugin แบบเอกสิทธิ์ในแมนิเฟสต์นี้ `OpenClawPluginDefinition.kind` ใน runtime entry เลิกใช้แล้วและคงอยู่เพียงเป็นทางถอยกลับเพื่อความเข้ากันได้สำหรับ Plugin รุ่นเก่า
- เมตาดาต้า env var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว และ `channelEnvVars`) เป็นแบบประกาศเท่านั้น สถานะ การตรวจสอบ การตรวจสอบความถูกต้องของการส่ง Cron และพื้นผิวแบบอ่านอย่างเดียวอื่นๆ ยังคงใช้นโยบายความน่าเชื่อถือของ Plugin และการเปิดใช้งานที่มีผลจริงก่อนถือว่า env var ถูกกำหนดค่าแล้ว
- สำหรับเมตาดาต้า wizard ของ Runtime ที่ต้องใช้โค้ด provider โปรดดู [ฮุก Runtime ของ provider](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณขึ้นกับโมดูลเนทีฟ ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนด allowlist ของตัวจัดการแพ็กเกจใดๆ (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    เอกสารอ้างอิง SDK ของ Plugin และการนำเข้าผ่าน subpath
  </Card>
</CardGroup>
