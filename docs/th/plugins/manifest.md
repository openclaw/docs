---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณต้องเผยแพร่สคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดในการตรวจสอบความถูกต้องของ Plugin
summary: ข้อกำหนดของแมนิเฟสต์ Plugin + สคีมา JSON (การตรวจสอบการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ของ Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้สำหรับ **manifest ของ OpenClaw Plugin แบบเนทีฟ** เท่านั้น

สำหรับเลย์เอาต์บันเดิลที่เข้ากันได้ ดู [บันเดิล Plugin](/th/plugins/bundles)

รูปแบบบันเดิลที่เข้ากันได้ใช้ไฟล์ manifest ที่แตกต่างกัน:

- บันเดิล Codex: `.codex-plugin/plugin.json`
- บันเดิล Claude: `.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น
  ที่ไม่มี manifest
- บันเดิล Cursor: `.cursor-plugin/plugin.json`

OpenClaw ตรวจจับเลย์เอาต์บันเดิลเหล่านั้นโดยอัตโนมัติด้วย แต่เลย์เอาต์เหล่านั้นจะไม่ถูกตรวจสอบความถูกต้อง
กับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับบันเดิลที่เข้ากันได้ ขณะนี้ OpenClaw อ่านเมทาดาทาของบันเดิลพร้อมกับราก Skills ที่ประกาศไว้
รากคำสั่ง Claude ค่าเริ่มต้น `settings.json` ของบันเดิล Claude
ค่าเริ่มต้น LSP ของบันเดิล Claude และชุด hook ที่รองรับเมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของ OpenClaw runtime

OpenClaw Plugin แบบเนทีฟทุกตัว **ต้อง** มาพร้อมไฟล์ `openclaw.plugin.json` ใน
**ราก Plugin** OpenClaw ใช้ manifest นี้เพื่อตรวจสอบความถูกต้องของการกำหนดค่า
**โดยไม่เรียกใช้โค้ด Plugin** manifest ที่หายไปหรือไม่ถูกต้องจะถูกถือเป็น
ข้อผิดพลาดของ Plugin และบล็อกการตรวจสอบความถูกต้องของการกำหนดค่า

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugins](/th/tools/plugin)
สำหรับโมเดลความสามารถแบบเนทีฟและแนวทางความเข้ากันได้ภายนอกในปัจจุบัน:
[โมเดลความสามารถ](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือเมทาดาทาที่ OpenClaw อ่าน **ก่อนโหลดโค้ด
Plugin ของคุณ** ทุกอย่างด้านล่างต้องตรวจสอบได้ง่ายพอโดยไม่ต้องเริ่ม
Plugin runtime

**ใช้สำหรับ:**

- ตัวตนของ Plugin, การตรวจสอบความถูกต้องของการกำหนดค่า และคำใบ้ UI สำหรับการกำหนดค่า
- เมทาดาทา auth, onboarding และ setup (alias, auto-enable, provider env vars, ตัวเลือก auth)
- คำใบ้การเปิดใช้งานสำหรับพื้นผิว control-plane
- ความเป็นเจ้าของ model-family แบบย่อ
- สแนปช็อตความเป็นเจ้าของความสามารถแบบคงที่ (`contracts`)
- เมทาดาทา QA runner ที่โฮสต์ `openclaw qa` แบบ shared สามารถตรวจสอบได้
- เมทาดาทาการกำหนดค่าเฉพาะช่องทางที่รวมเข้ากับพื้นผิว catalog และ validation

**ห้ามใช้สำหรับ:** การลงทะเบียนพฤติกรรม runtime, การประกาศ entrypoint ของโค้ด,
หรือเมทาดาทาการติดตั้ง npm สิ่งเหล่านั้นอยู่ในโค้ด Plugin และ `package.json` ของคุณ

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

| ฟิลด์                                | จำเป็น | ชนิด                             | ความหมาย                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | ID ของ Plugin แบบเป็นทางการ นี่คือ ID ที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                 |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบอินไลน์สำหรับการกำหนดค่าของ Plugin นี้                                                                                                                                                                                        |
| `enabledByDefault`                   | ไม่ใช่       | `true`                           | ทำเครื่องหมายให้ Plugin ที่บันเดิลมาเปิดใช้งานตามค่าเริ่มต้น ละเว้นค่านี้ หรือตั้งค่าเป็นค่าใดๆ ที่ไม่ใช่ `true` เพื่อให้ Plugin ถูกปิดใช้งานตามค่าเริ่มต้น                                                                                                        |
| `legacyPluginIds`                    | ไม่ใช่       | `string[]`                       | ID เดิมที่จะถูกปรับให้เป็น ID ของ Plugin แบบเป็นทางการนี้                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | ไม่ใช่       | `string[]`                       | ID ของผู้ให้บริการที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อการยืนยันตัวตน การกำหนดค่า หรือการอ้างอิงโมเดลกล่าวถึงผู้ให้บริการเหล่านั้น                                                                                                                                     |
| `kind`                               | ไม่ใช่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบผูกขาดที่ใช้โดย `plugins.slots.*`                                                                                                                                                                        |
| `channels`                           | ไม่ใช่       | `string[]`                       | ID ของช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบความถูกต้องของการกำหนดค่า                                                                                                                                                         |
| `providers`                          | ไม่ใช่       | `string[]`                       | ID ของผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | ไม่ใช่       | `string`                         | พาธโมดูลการค้นพบผู้ให้บริการแบบเบา ซึ่งสัมพันธ์กับรากของ Plugin สำหรับเมทาดาทาแค็ตตาล็อกผู้ให้บริการที่อยู่ในขอบเขตของแมนิเฟสต์ ซึ่งสามารถโหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์เต็มของ Plugin                                               |
| `modelSupport`                       | ไม่ใช่       | `object`                         | เมทาดาทาแบบย่อของตระกูลโมเดลที่แมนิเฟสต์เป็นเจ้าของ ซึ่งใช้เพื่อโหลด Plugin โดยอัตโนมัติก่อนรันไทม์                                                                                                                                         |
| `modelCatalog`                       | ไม่ใช่       | `object`                         | เมทาดาทาแค็ตตาล็อกโมเดลแบบประกาศสำหรับผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญาของ control plane สำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต การเริ่มต้นใช้งาน ตัวเลือกโมเดล นามแฝง และการระงับโดยไม่ต้องโหลดรันไทม์ของ Plugin         |
| `modelPricing`                       | ไม่ใช่       | `object`                         | นโยบายค้นหาราคาภายนอกที่ผู้ให้บริการเป็นเจ้าของ ใช้เพื่อยกเว้นผู้ให้บริการภายในเครื่อง/โฮสต์เองออกจากแค็ตตาล็อกราคาระยะไกล หรือแมปการอ้างอิงผู้ให้บริการไปยัง ID แค็ตตาล็อก OpenRouter/LiteLLM โดยไม่ต้องฮาร์ดโค้ด ID ผู้ให้บริการในแกนกลาง             |
| `modelIdNormalization`               | ไม่ใช่       | `object`                         | การล้างนามแฝง/คำนำหน้า ID โมเดลที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้องทำงานก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                                                           |
| `providerEndpoints`                  | ไม่ใช่       | `object[]`                       | เมทาดาทาโฮสต์/baseUrl ของปลายทางที่แมนิเฟสต์เป็นเจ้าของสำหรับเส้นทางผู้ให้บริการ ซึ่งแกนกลางต้องจัดประเภทก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                            |
| `providerRequest`                    | ไม่ใช่       | `object`                         | เมทาดาทาตระกูลผู้ให้บริการและความเข้ากันได้ของคำขอแบบเบา ที่ใช้โดยนโยบายคำขอทั่วไปก่อนโหลดรันไทม์ของผู้ให้บริการ                                                                                                              |
| `cliBackends`                        | ไม่ใช่       | `string[]`                       | ID แบ็กเอนด์การอนุมานของ CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติเมื่อเริ่มต้นจากการอ้างอิงการกำหนดค่าที่ระบุชัดเจน                                                                                                                         |
| `syntheticAuthRefs`                  | ไม่ใช่       | `string[]`                       | การอ้างอิงผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ควรโพรบฮุกการยืนยันตัวตนสังเคราะห์ที่ Plugin เป็นเจ้าของระหว่างการค้นพบโมเดลแบบเย็น ก่อนโหลดรันไทม์                                                                                              |
| `nonSecretAuthMarkers`               | ไม่ใช่       | `string[]`                       | ค่า API key แบบ placeholder ที่ Plugin ที่บันเดิลมาเป็นเจ้าของ ซึ่งแทนสถานะข้อมูลประจำตัวภายในเครื่อง OAuth หรือ ambient ที่ไม่เป็นความลับ                                                                                                                |
| `commandAliases`                     | ไม่ใช่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการกำหนดค่าและการวินิจฉัย CLI ที่รับรู้ Plugin ก่อนโหลดรันไทม์                                                                                                                |
| `providerAuthEnvVars`                | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env ความเข้ากันได้ที่เลิกใช้แล้วสำหรับการค้นหาการยืนยันตัวตน/สถานะของผู้ให้บริการ สำหรับ Plugin ใหม่ ให้ใช้ `setup.providers[].envVars` แทน OpenClaw ยังอ่านค่านี้ระหว่างช่วงเลิกใช้งาน                                                 |
| `providerAuthAliases`                | ไม่ใช่       | `Record<string, string>`         | ID ของผู้ให้บริการที่ควรใช้ ID ผู้ให้บริการอื่นซ้ำสำหรับการค้นหาการยืนยันตัวตน เช่น ผู้ให้บริการงานเขียนโค้ดที่แชร์ API key และโปรไฟล์การยืนยันตัวตนของผู้ให้บริการฐาน                                                                          |
| `channelEnvVars`                     | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env ของช่องทางแบบเบาที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้สำหรับการตั้งค่าช่องทางที่ขับเคลื่อนด้วย env หรือพื้นผิวการยืนยันตัวตนที่ตัวช่วยเริ่มต้น/กำหนดค่าทั่วไปควรเห็น                                            |
| `providerAuthChoices`                | ไม่ใช่       | `object[]`                       | เมทาดาทาตัวเลือกการยืนยันตัวตนแบบเบาสำหรับตัวเลือกในการเริ่มต้นใช้งาน การแก้ชื่อผู้ให้บริการที่ต้องการ และการเชื่อมสายแฟล็ก CLI แบบง่าย                                                                                                                       |
| `activation`                         | ไม่ใช่       | `object`                         | เมทาดาทาตัววางแผนการเปิดใช้งานแบบเบาสำหรับการโหลดที่ทริกเกอร์โดยการเริ่มต้น ผู้ให้บริการ คำสั่ง ช่องทาง เส้นทาง และความสามารถ เป็นเมทาดาทาเท่านั้น รันไทม์ของ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                                                       |
| `setup`                              | ไม่ใช่       | `object`                         | ตัวอธิบายการตั้งค่า/การเริ่มต้นใช้งานแบบเบาที่พื้นผิวการค้นพบและการตั้งค่าสามารถตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ของ Plugin                                                                                                                    |
| `qaRunners`                          | ไม่ใช่       | `object[]`                       | ตัวอธิบาย QA runner แบบเบาที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันใช้ก่อนโหลดรันไทม์ของ Plugin                                                                                                                                      |
| `contracts`                          | ไม่ใช่       | `object`                         | สแนปช็อตความเป็นเจ้าของความสามารถแบบคงที่สำหรับฮุกการยืนยันตัวตนภายนอก คำพูด การถอดเสียงแบบเรียลไทม์ เสียงแบบเรียลไทม์ การเข้าใจสื่อ การสร้างภาพ การสร้างเพลง การสร้างวิดีโอ การดึงเว็บ การค้นหาเว็บ และความเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่ใช่       | `Record<string, object>`         | ค่าเริ่มต้นการเข้าใจสื่อแบบเบาสำหรับ ID ผู้ให้บริการที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                            |
| `imageGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างภาพแบบเบาสำหรับ ID ผู้ให้บริการที่ประกาศใน `contracts.imageGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและตัวป้องกัน base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `videoGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างวิดีโอแบบเบาสำหรับ ID ผู้ให้บริการที่ประกาศใน `contracts.videoGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและตัวป้องกัน base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `musicGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างเพลงแบบเบาสำหรับ ID ผู้ให้บริการที่ประกาศใน `contracts.musicGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและตัวป้องกัน base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `toolMetadata`                       | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาความพร้อมใช้งานแบบเบาสำหรับเครื่องมือที่ Plugin เป็นเจ้าของซึ่งประกาศใน `contracts.tools` ใช้เมื่อเครื่องมือไม่ควรโหลดรันไทม์ เว้นแต่จะมีหลักฐานการกำหนดค่า env หรือการยืนยันตัวตน                                                           |
| `channelConfigs`                     | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการกำหนดค่าช่องทางที่แมนิเฟสต์เป็นเจ้าของ ซึ่งถูกรวมเข้ากับพื้นผิวการค้นพบและการตรวจสอบความถูกต้องก่อนโหลดรันไทม์                                                                                                                          |
| `skills`                             | ไม่ใช่       | `string[]`                       | ไดเรกทอรี Skill ที่จะโหลด ซึ่งสัมพันธ์กับรากของ Plugin                                                                                                                                                                             |
| `name`                               | ไม่ใช่       | `string`                         | ชื่อ Plugin ที่มนุษย์อ่านได้                                                                                                                                                                                                         |
| `description`                        | ไม่       | `string`                         | สรุปสั้น ๆ ที่แสดงในพื้นผิว Plugin                                                                                                                                                                                             |
| `version`                            | ไม่       | `string`                         | เวอร์ชัน Plugin สำหรับให้ข้อมูล                                                                                                                                                                                                       |
| `uiHints`                            | ไม่       | `Record<string, object>`         | ป้ายกำกับ UI, ตัวแทนค่า และคำแนะนำด้านความอ่อนไหวสำหรับฟิลด์การกำหนดค่า                                                                                                                                                                   |

## ข้อมูลอ้างอิงเมทาดาต้าของผู้ให้บริการการสร้าง

ฟิลด์เมทาดาต้าของผู้ให้บริการการสร้างอธิบายสัญญาณการยืนยันตัวตนแบบคงที่สำหรับ
ผู้ให้บริการที่ประกาศในรายการ `contracts.*GenerationProviders` ที่ตรงกัน
OpenClaw อ่านฟิลด์เหล่านี้ก่อนที่ runtime ของผู้ให้บริการจะโหลด เพื่อให้เครื่องมือหลักสามารถ
ตัดสินได้ว่าผู้ให้บริการการสร้างพร้อมใช้งานหรือไม่ โดยไม่ต้องนำเข้า
Plugin ของผู้ให้บริการทุกตัว

ใช้ฟิลด์เหล่านี้เฉพาะกับข้อเท็จจริงราคาถูกและประกาศได้เท่านั้น การขนส่ง คำขอ
การแปลง การรีเฟรชโทเค็น การตรวจสอบข้อมูลรับรอง และพฤติกรรมการสร้างจริง
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

รายการเมทาดาต้าแต่ละรายการรองรับ:

| ฟิลด์           | จำเป็น | ประเภท       | ความหมาย                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | ไม่       | `string[]` | id ผู้ให้บริการเพิ่มเติมที่ควรนับเป็นนามแฝงการยืนยันตัวตนแบบคงที่สำหรับผู้ให้บริการการสร้าง                                       |
| `authProviders` | ไม่       | `string[]` | id ผู้ให้บริการที่โปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้ควรนับเป็นการยืนยันตัวตนสำหรับผู้ให้บริการการสร้างนี้                                      |
| `configSignals` | ไม่       | `object[]` | สัญญาณความพร้อมใช้งานจาก config เท่านั้นที่ราคาถูก สำหรับผู้ให้บริการแบบ local หรือโฮสต์เองที่สามารถกำหนดค่าได้โดยไม่มีโปรไฟล์การยืนยันตัวตนหรือ env vars |
| `authSignals`   | ไม่       | `object[]` | สัญญาณการยืนยันตัวตนแบบระบุชัดเจน เมื่อมีอยู่ สัญญาณเหล่านี้จะแทนที่ชุดสัญญาณเริ่มต้นจาก id ผู้ให้บริการ, `aliases`, และ `authProviders`     |

รายการ `configSignals` แต่ละรายการรองรับ:

| ฟิลด์         | จำเป็น | ประเภท       | ความหมาย                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | ใช่      | `string`   | dot path ไปยังออบเจ็กต์ config ที่ Plugin เป็นเจ้าของเพื่อตรวจสอบ เช่น `plugins.entries.example.config`                                                                                    |
| `overlayPath` | ไม่       | `string`   | dot path ภายใน root config ที่ออบเจ็กต์ของมันควร overlay ออบเจ็กต์ root ก่อนประเมินสัญญาณ ใช้สำหรับ config เฉพาะความสามารถ เช่น `image`, `video`, หรือ `music` |
| `required`    | ไม่       | `string[]` | dot paths ภายใน config ที่มีผล ซึ่งต้องมีค่าที่กำหนดค่าไว้ สตริงต้องไม่ว่าง ออบเจ็กต์และอาร์เรย์ต้องไม่ว่าง                                                |
| `requiredAny` | ไม่       | `string[]` | dot paths ภายใน config ที่มีผล ซึ่งอย่างน้อยหนึ่งรายการต้องมีค่าที่กำหนดค่าไว้                                                                                                  |
| `mode`        | ไม่       | `object`   | ตัวกันโหมดสตริงแบบไม่บังคับภายใน config ที่มีผล ใช้เมื่อความพร้อมใช้งานจาก config เท่านั้นใช้ได้กับเพียงโหมดเดียว                                                                |

ตัวกัน `mode` แต่ละรายการรองรับ:

| ฟิลด์        | จำเป็น | ประเภท       | ความหมาย                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | ไม่       | `string`   | dot path ภายใน config ที่มีผล ค่าเริ่มต้นคือ `mode`                          |
| `default`    | ไม่       | `string`   | ค่าโหมดที่จะใช้เมื่อ config ละเว้น path                                  |
| `allowed`    | ไม่       | `string[]` | หากมีอยู่ สัญญาณจะผ่านเฉพาะเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้ |
| `disallowed` | ไม่       | `string[]` | หากมีอยู่ สัญญาณจะล้มเหลวเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้       |

รายการ `authSignals` แต่ละรายการรองรับ:

| ฟิลด์             | จำเป็น | ประเภท     | ความหมาย                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string` | id ผู้ให้บริการที่จะตรวจสอบในโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้                                                                                                                             |
| `providerBaseUrl` | ไม่       | `object` | ตัวกันแบบไม่บังคับที่ทำให้สัญญาณถูกนับเฉพาะเมื่อผู้ให้บริการที่กำหนดค่าไว้ซึ่งอ้างอิงอยู่ใช้ URL ฐานที่อนุญาต ใช้เมื่อ auth alias ใช้ได้เฉพาะกับ API บางรายการ |

ตัวกัน `providerBaseUrl` แต่ละรายการรองรับ:

| ฟิลด์             | จำเป็น | ประเภท       | ความหมาย                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string`   | id config ของผู้ให้บริการที่ควรตรวจสอบ `baseUrl`                                                                                                |
| `defaultBaseUrl`  | ไม่       | `string`   | URL ฐานที่จะถือว่าใช้เมื่อ config ของผู้ให้บริการละเว้น `baseUrl`                                                                                         |
| `allowedBaseUrls` | ใช่      | `string[]` | URL ฐานที่อนุญาตสำหรับสัญญาณการยืนยันตัวตนนี้ สัญญาณจะถูกละเว้นเมื่อ URL ฐานที่กำหนดค่าไว้หรือค่าเริ่มต้นไม่ตรงกับหนึ่งในค่าที่ normalize แล้วเหล่านี้ |

## ข้อมูลอ้างอิงเมทาดาต้าของเครื่องมือ

`toolMetadata` ใช้รูปแบบ `configSignals` และ `authSignals` เดียวกับ
เมทาดาต้าของผู้ให้บริการการสร้าง โดยใช้ชื่อเครื่องมือเป็นคีย์ `contracts.tools` ประกาศ
ความเป็นเจ้าของ `toolMetadata` ประกาศหลักฐานความพร้อมใช้งานราคาถูก เพื่อให้ OpenClaw สามารถ
หลีกเลี่ยงการนำเข้า runtime ของ Plugin เพียงเพื่อให้ tool factory ของมันคืนค่า `null`

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

หากเครื่องมือไม่มี `toolMetadata` OpenClaw จะคงพฤติกรรมเดิมไว้และ
โหลด Plugin เจ้าของเมื่อสัญญาเครื่องมือตรงกับนโยบาย สำหรับเครื่องมือใน hot path
ที่ factory ขึ้นกับ auth/config ผู้เขียน Plugin ควรประกาศ
`toolMetadata` แทนการทำให้ core นำเข้า runtime เพื่อถาม

## ข้อมูลอ้างอิง providerAuthChoices

รายการ `providerAuthChoices` แต่ละรายการอธิบายตัวเลือก onboarding หรือการยืนยันตัวตนหนึ่งรายการ
OpenClaw อ่านสิ่งนี้ก่อนที่ runtime ของผู้ให้บริการจะโหลด
รายการตั้งค่าผู้ให้บริการใช้ตัวเลือกใน manifest เหล่านี้ ตัวเลือกการตั้งค่าที่ได้จาก descriptor
และเมทาดาต้าแคตตาล็อกการติดตั้ง โดยไม่ต้องโหลด runtime ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ประเภท                                            | ความหมาย                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | id ผู้ให้บริการที่ตัวเลือกนี้เป็นของ                                                                      |
| `method`              | ใช่      | `string`                                        | id วิธีการยืนยันตัวตนที่จะ dispatch ไป                                                                           |
| `choiceId`            | ใช่      | `string`                                        | id ตัวเลือกการยืนยันตัวตนที่เสถียร ซึ่งใช้โดย flow onboarding และ CLI                                                  |
| `choiceLabel`         | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละเว้น OpenClaw จะ fallback เป็น `choiceId`                                        |
| `choiceHint`          | ไม่       | `string`                                        | ข้อความช่วยเหลือสั้นๆ สำหรับ picker                                                                        |
| `assistantPriority`   | ไม่       | `number`                                        | ค่าที่ต่ำกว่าจะเรียงก่อนใน picker แบบโต้ตอบที่ขับเคลื่อนโดย assistant                                       |
| `assistantVisibility` | ไม่       | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกจาก picker ของ assistant แต่ยังคงอนุญาตให้เลือกด้วย CLI แบบ manual                        |
| `deprecatedChoiceIds` | ไม่       | `string[]`                                      | id ตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้ไปยังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่       | `string`                                        | id กลุ่มแบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้อง                                                          |
| `groupLabel`          | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่       | `string`                                        | ข้อความช่วยเหลือสั้นๆ สำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่       | `string`                                        | คีย์ตัวเลือกภายในสำหรับ flow การยืนยันตัวตนแบบ flag เดียวอย่างง่าย                                                      |
| `cliFlag`             | ไม่       | `string`                                        | ชื่อ flag ของ CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่       | `string`                                        | รูปแบบ option ของ CLI แบบเต็ม เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่       | `string`                                        | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                                            |
| `onboardingScopes`    | ไม่       | `Array<"text-inference" \| "image-generation">` | พื้นผิว onboarding ที่ตัวเลือกนี้ควรปรากฏ หากละเว้น ค่าเริ่มต้นคือ `["text-inference"]` |

## ข้อมูลอ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามเรียกใช้เป็นคำสั่ง CLI ระดับรูท OpenClaw
ใช้เมตาดาทานี้สำหรับการวินิจฉัยโดยไม่ต้องนำเข้าโค้ดรันไทม์ของ Plugin

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
| `kind`       | ไม่       | `"runtime-slash"` | ทำเครื่องหมาย alias ว่าเป็นคำสั่ง slash ในแชต ไม่ใช่คำสั่ง CLI ระดับรูท |
| `cliCommand` | ไม่       | `string`          | คำสั่ง CLI ระดับรูทที่เกี่ยวข้องเพื่อแนะนำสำหรับการดำเนินการ CLI หากมี  |

## ข้อมูลอ้างอิง activation

ใช้ `activation` เมื่อ Plugin สามารถประกาศแบบประหยัดได้ว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นั้นไว้ในแผนการเปิดใช้งาน/โหลด

บล็อกนี้เป็นเมตาดาทาสำหรับ planner ไม่ใช่ lifecycle API บล็อกนี้ไม่ได้ลงทะเบียน
พฤติกรรมรันไทม์ ไม่ได้แทนที่ `register(...)` และไม่ได้รับประกันว่า
โค้ดของ Plugin ได้ถูกเรียกใช้แล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ที่เป็นตัวเลือกให้แคบลง ก่อนย้อนกลับไปใช้เมตาดาทาความเป็นเจ้าของใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ควรใช้เมตาดาทาที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของอยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, setup descriptors หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์นั้นได้ ใช้ `activation` สำหรับคำใบ้เพิ่มเติมของ planner
ที่ไม่สามารถแทนด้วยฟิลด์ความเป็นเจ้าของเหล่านั้นได้
ใช้ `cliBackends` ระดับบนสำหรับ alias รันไทม์ CLI เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้เฉพาะสำหรับ
id ของ agent harness แบบฝังที่ยังไม่มีฟิลด์ความเป็นเจ้าของอยู่แล้ว

บล็อกนี้เป็นเมตาดาทาเท่านั้น บล็อกนี้ไม่ได้ลงทะเบียนพฤติกรรมรันไทม์ และไม่ได้
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint รันไทม์/Plugin อื่นๆ
consumer ปัจจุบันใช้บล็อกนี้เป็นคำใบ้เพื่อจำกัดขอบเขตก่อนการโหลด Plugin ที่กว้างขึ้น ดังนั้น
เมตาดาทา activation ที่ไม่ใช่ช่วงเริ่มต้นและขาดหายไปโดยทั่วไปจะกระทบเพียงประสิทธิภาพเท่านั้น และ
ไม่ควรเปลี่ยนความถูกต้องตราบใดที่ fallback ความเป็นเจ้าของจาก manifest ยังมีอยู่

Plugin ทุกตัวควรตั้งค่า `activation.onStartup` อย่างตั้งใจ ตั้งค่าเป็น `true`
เฉพาะเมื่อ Plugin ต้องทำงานระหว่างการเริ่มต้น Gateway ตั้งค่าเป็น `false` เมื่อ
Plugin ไม่ทำงานตอนเริ่มต้นและควรโหลดจาก trigger ที่แคบกว่าเท่านั้น
การละเว้น `onStartup` จะไม่ทำให้ Plugin ถูกโหลดตอนเริ่มต้นโดยอัตโนมัติอีกต่อไป ใช้เมตาดาทา
activation ที่ชัดเจนสำหรับ startup, channel, config, agent-harness, memory หรือ
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
| `onStartup`        | ไม่       | `boolean`                                            | การเปิดใช้งานตอนเริ่มต้น Gateway แบบชัดเจน Plugin ทุกตัวควรตั้งค่านี้ `true` จะนำเข้า Plugin ระหว่าง startup; `false` จะเก็บไว้ให้โหลดแบบ lazy ตอน startup เว้นแต่ trigger อื่นที่ตรงกันต้องโหลด |
| `onProviders`      | ไม่       | `string[]`                                           | id ของ provider ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                      |
| `onAgentHarnesses` | ไม่       | `string[]`                                           | id รันไทม์ของ agent harness แบบฝังที่ควรรวม Plugin นี้ไว้ในแผน activation/load ใช้ `cliBackends` ระดับบนสำหรับ alias ของ backend CLI                                           |
| `onCommands`       | ไม่       | `string[]`                                           | id ของคำสั่งที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onChannels`       | ไม่       | `string[]`                                           | id ของ channel ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onRoutes`         | ไม่       | `string[]`                                           | ชนิดของ route ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onConfigPaths`    | ไม่       | `string[]`                                           | พาธ config แบบสัมพัทธ์จากรูทที่ควรรวม Plugin นี้ไว้ในแผน startup/load เมื่อพาธมีอยู่และไม่ได้ถูกปิดใช้งานอย่างชัดเจน                                                      |
| `onCapabilities`   | ไม่       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ควรใช้ฟิลด์ที่แคบกว่าเมื่อเป็นไปได้                                                                                     |

consumer แบบ live ปัจจุบัน:

- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับการนำเข้า startup
  อย่างชัดเจน
- การวางแผน CLI ที่ถูก trigger ด้วยคำสั่งจะย้อนกลับไปใช้
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบเดิม
- การวางแผน startup ของรันไทม์ agent ใช้ `activation.onAgentHarnesses` สำหรับ
  harness แบบฝัง และใช้ `cliBackends[]` ระดับบนสำหรับ alias รันไทม์ CLI
- การวางแผน setup/channel ที่ถูก trigger ด้วย channel จะย้อนกลับไปใช้ความเป็นเจ้าของ
  `channels[]` แบบเดิมเมื่อเมตาดาทา activation ของ channel แบบชัดเจนขาดหายไป
- การวางแผน Plugin ตอน startup ใช้ `activation.onConfigPaths` สำหรับพื้นผิว config
  รูทที่ไม่ใช่ channel เช่นบล็อก `browser` ของ Plugin เบราว์เซอร์ที่รวมมา
- การวางแผน setup/runtime ที่ถูก trigger ด้วย provider จะย้อนกลับไปใช้ความเป็นเจ้าของ
  `providers[]` และ `cliBackends[]` ระดับบนแบบเดิมเมื่อเมตาดาทา activation ของ provider
  แบบชัดเจนขาดหายไป

การวินิจฉัยของ planner สามารถแยกคำใบ้ activation แบบชัดเจนออกจาก fallback
ความเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายถึง
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายถึง
planner ใช้ความเป็นเจ้าของจาก `commandAliases` แทน ป้ายเหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยของ host และการทดสอบ ผู้เขียน Plugin ควรประกาศเมตาดาทาที่
อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง qaRunners

ใช้ `qaRunners` เมื่อ Plugin เพิ่ม transport runner หนึ่งตัวหรือมากกว่าภายใต้
รูท `openclaw qa` ที่ใช้ร่วมกัน เก็บเมตาดาทานี้ให้ประหยัดและเป็น static; รันไทม์ของ Plugin
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
| `commandName` | ใช่      | `string` | subcommand ที่ mount อยู่ใต้ `openclaw qa` เช่น `matrix`    |
| `description` | ไม่       | `string` | ข้อความช่วยเหลือสำรองที่ใช้เมื่อ host ที่ใช้ร่วมกันต้องการคำสั่ง stub |

## ข้อมูลอ้างอิง setup

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการเมตาดาทาที่ Plugin เป็นเจ้าของ
แบบประหยัดก่อนรันไทม์โหลด

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

`cliBackends` ระดับบนยังคงใช้ได้และยังคงอธิบาย backend สำหรับการอนุมานของ CLI
`setup.cliBackends` คือพื้นผิว descriptor เฉพาะ setup สำหรับ
flow ของ control-plane/setup ที่ควรคงเป็นเมตาดาทาเท่านั้น

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็น
พื้นผิวการค้นหาแบบ descriptor-first ที่แนะนำสำหรับการค้นหา setup หาก descriptor เพียง
จำกัด Plugin ที่เป็นตัวเลือกให้แคบลง และ setup ยังต้องการ hook รันไทม์ช่วง setup
ที่สมบูรณ์กว่า ให้ตั้งค่า `requiresRuntime: true` และคง `setup-api` ไว้เป็น
เส้นทางดำเนินการ fallback

OpenClaw ยังรวม `setup.providers[].envVars` ไว้ในการค้นหา provider auth และ
env-var ทั่วไปด้วย `providerAuthEnvVars` ยังคงรองรับผ่าน adapter ความเข้ากันได้
ระหว่างช่วงเลิกใช้งาน แต่ Plugin ที่ไม่ได้รวมมาและยังใช้อยู่
จะได้รับการวินิจฉัย manifest Plugin ใหม่ควรวางเมตาดาทา env สำหรับ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup อย่างง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มี setup entry ให้ใช้ หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้รันไทม์ setup รายการ `providerAuthChoices` แบบชัดเจนยังคง
เป็นตัวเลือกที่แนะนำสำหรับ label แบบกำหนดเอง, flag ของ CLI, ขอบเขต onboarding และเมตาดาทา assistant

ตั้งค่า `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw ถือว่า `false` แบบชัดเจนเป็นสัญญาแบบ descriptor-only
และจะไม่เรียกใช้ `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
Plugin แบบ descriptor-only ยังส่งมาพร้อมหนึ่งใน entry รันไทม์ setup เหล่านั้น
OpenClaw จะรายงานการวินิจฉัยแบบเพิ่มข้อมูลและยังคงละเว้น entry นั้นต่อไป การละเว้น
`requiresRuntime` จะคงพฤติกรรม fallback แบบเดิมไว้ เพื่อให้ Plugin ที่มีอยู่ซึ่งเพิ่ม
descriptor โดยไม่มี flag ไม่เสียหาย

เนื่องจากการค้นหา setup สามารถเรียกใช้โค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้ ค่า
`setup.providers[].id` และ `setup.cliBackends[]` ที่ normalize แล้วต้องยังคงไม่ซ้ำกันข้าม
Plugin ที่ค้นพบ ความเป็นเจ้าของที่คลุมเครือจะ fail closed แทนการเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อรันไทม์ setup ถูกเรียกใช้จริง การวินิจฉัยของ setup registry จะรายงาน descriptor
drift หาก `setup-api` ลงทะเบียน provider หรือ backend CLI ที่ descriptor ใน manifest
ไม่ได้ประกาศไว้ หรือหาก descriptor ไม่มีการลงทะเบียนรันไทม์ที่ตรงกัน
การวินิจฉัยเหล่านี้เป็นแบบเพิ่มข้อมูลและไม่ปฏิเสธ Plugin แบบเดิม

### ข้อมูลอ้างอิง setup.providers

| ฟิลด์          | จำเป็น | ประเภท       | ความหมาย                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่      | `string`   | id ของ provider ที่เปิดเผยระหว่าง setup หรือ onboarding รักษา id ที่ normalize แล้วให้ไม่ซ้ำกันทั่วระบบ             |
| `authMethods`  | ไม่       | `string[]` | id ของวิธี setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลดรันไทม์เต็ม                       |
| `envVars`      | ไม่       | `string[]` | env var ที่พื้นผิว setup/status ทั่วไปสามารถตรวจสอบได้ก่อนรันไทม์ของ Plugin โหลด               |
| `authEvidence` | ไม่       | `object[]` | การตรวจสอบหลักฐาน auth ภายในเครื่องแบบประหยัดสำหรับ provider ที่สามารถยืนยันตัวตนผ่าน marker ที่ไม่ใช่ secret |

`authEvidence` มีไว้สำหรับเครื่องหมายข้อมูลรับรองในเครื่องที่ provider เป็นเจ้าของ ซึ่งสามารถ
ตรวจสอบได้โดยไม่ต้องโหลดโค้ด runtime การตรวจสอบเหล่านี้ต้องยังคงเบาและเป็น local:
ไม่มีการเรียกเครือข่าย ไม่มีการอ่าน keychain หรือ secret-manager ไม่มี shell commands และไม่มี
การ probe provider API

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่ใช่       | `string`   | Env var ที่มีพาธไฟล์ข้อมูลรับรองแบบชัดเจน                                                           |
| `fallbackPaths`    | ไม่ใช่       | `string[]` | พาธไฟล์ข้อมูลรับรองในเครื่องที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีอยู่หรือว่างเปล่า รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่ใช่       | `string[]` | env var อย่างน้อยหนึ่งรายการที่ระบุไว้ต้องไม่ว่างเปล่าก่อนที่หลักฐานจะถูกต้อง                                    |
| `requiresAllEnv`   | ไม่ใช่       | `string[]` | env var ทุกรายการที่ระบุไว้ต้องไม่ว่างเปล่าก่อนที่หลักฐานจะถูกต้อง                                           |
| `credentialMarker` | ใช่      | `string`   | เครื่องหมายที่ไม่ใช่ secret ซึ่งส่งคืนเมื่อมีหลักฐาน                                                       |
| `source`           | ไม่ใช่       | `string`   | ป้ายกำกับแหล่งที่มาที่แสดงต่อผู้ใช้สำหรับเอาต์พุต auth/status                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่ใช่       | `object[]` | ตัวอธิบายการตั้งค่า provider ที่แสดงระหว่าง setup และ onboarding                                     |
| `cliBackends`      | ไม่ใช่       | `string[]` | backend ids เวลา setup ที่ใช้สำหรับการค้นหา setup แบบ descriptor-first ทำให้ ids ที่ normalize แล้วไม่ซ้ำกันทั่วทั้งระบบ |
| `configMigrations` | ไม่ใช่       | `string[]` | ids ของการย้าย config ที่ surface การ setup ของ Plugin นี้เป็นเจ้าของ                                          |
| `requiresRuntime`  | ไม่ใช่       | `boolean`  | ระบุว่า setup ยังต้องดำเนินการ `setup-api` หลังจากการค้นหา descriptor หรือไม่                            |

## อ้างอิง uiHints

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

คำใบ้ของแต่ละฟิลด์สามารถมีได้ดังนี้:

| ฟิลด์         | ประเภท       | ความหมาย                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ป้ายกำกับฟิลด์ที่แสดงต่อผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือสั้นๆ                      |
| `tags`        | `string[]` | แท็ก UI ทางเลือก                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์ว่าเป็น secret หรือ sensitive |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตแบบฟอร์ม       |

## อ้างอิง contracts

ใช้ `contracts` เฉพาะสำหรับ metadata การเป็นเจ้าของ capability แบบ static ที่ OpenClaw สามารถ
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
| `embeddedExtensionFactories`     | `string[]` | ids ของ extension factory ของ Codex app-server ปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | Runtime ids ที่ Plugin ที่ bundled อาจลงทะเบียน middleware ผลลัพธ์ของเครื่องมือให้ได้ |
| `externalAuthProviders`          | `string[]` | Provider ids ที่ Plugin นี้เป็นเจ้าของ hook ของ external auth profile       |
| `speechProviders`                | `string[]` | Speech provider ids ที่ Plugin นี้เป็นเจ้าของ                                 |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription provider ids ที่ Plugin นี้เป็นเจ้าของ                 |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice provider ids ที่ Plugin นี้เป็นเจ้าของ                         |
| `memoryEmbeddingProviders`       | `string[]` | Memory embedding provider ids ที่ Plugin นี้เป็นเจ้าของ                       |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding provider ids ที่ Plugin นี้เป็นเจ้าของ                    |
| `imageGenerationProviders`       | `string[]` | Image-generation provider ids ที่ Plugin นี้เป็นเจ้าของ                       |
| `videoGenerationProviders`       | `string[]` | Video-generation provider ids ที่ Plugin นี้เป็นเจ้าของ                       |
| `webFetchProviders`              | `string[]` | Web-fetch provider ids ที่ Plugin นี้เป็นเจ้าของ                              |
| `webSearchProviders`             | `string[]` | Web-search provider ids ที่ Plugin นี้เป็นเจ้าของ                             |
| `migrationProviders`             | `string[]` | Import provider ids ที่ Plugin นี้เป็นเจ้าของสำหรับ `openclaw migrate`          |
| `tools`                          | `string[]` | ชื่อเครื่องมือของ agent ที่ Plugin นี้เป็นเจ้าของ                                    |

`contracts.embeddedExtensionFactories` ถูกเก็บไว้สำหรับ factories ของ extension
เฉพาะ Codex app-server ที่ bundled เท่านั้น การแปลงผลลัพธ์เครื่องมือที่ bundled ควร
ประกาศ `contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน External plugins ไม่สามารถ
ลงทะเบียน middleware ผลลัพธ์ของเครื่องมือได้ เพราะ seam สามารถเขียนเอาต์พุตเครื่องมือที่มีความน่าเชื่อถือสูงใหม่
ก่อนที่ model จะเห็นได้

การลงทะเบียน Runtime `api.registerTool(...)` ต้องตรงกับ `contracts.tools`
การค้นหาเครื่องมือใช้รายการนี้เพื่อโหลดเฉพาะ runtime ของ Plugin ที่สามารถเป็นเจ้าของ
เครื่องมือที่ร้องขอได้

Provider plugins ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugins ที่ไม่มีประกาศนี้ยังคงรัน
ผ่าน fallback ความเข้ากันได้ที่เลิกใช้แล้ว แต่ fallback นั้นช้ากว่าและ
จะถูกลบหลังช่วงเวลาการย้าย

Bundled memory embedding providers ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับ adapter id ทุกตัวที่เปิดเผย รวมถึง
adapters ในตัว เช่น `local` พาธ CLI แบบ standalone ใช้สัญญา manifest นี้
เพื่อโหลดเฉพาะ Plugin เจ้าของก่อนที่ runtime Gateway แบบเต็มจะ
ลงทะเบียน providers

## อ้างอิง mediaUnderstandingProviderMetadata

ใช้ `mediaUnderstandingProviderMetadata` เมื่อ media-understanding provider มี
models เริ่มต้น ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสารแบบ native ที่
ตัวช่วย core ทั่วไปต้องใช้ก่อน runtime loads ต้องประกาศคีย์ใน
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

รายการ provider แต่ละรายการสามารถมีได้ดังนี้:

| ฟิลด์                  | ประเภท                                | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | ความสามารถด้านสื่อที่ provider นี้เปิดเผย                                 |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้น capability-to-model ที่ใช้เมื่อ config ไม่ได้ระบุ model      |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะถูกจัดเรียงก่อนสำหรับ provider fallback แบบอัตโนมัติตามข้อมูลรับรอง |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบ native ที่ provider รองรับ                            |

## อ้างอิง channelConfigs

ใช้ `channelConfigs` เมื่อ channel Plugin ต้องการ config metadata ราคาถูกก่อน
runtime loads การค้นหา setup/status ของ channel แบบอ่านอย่างเดียวสามารถใช้ metadata นี้
โดยตรงสำหรับ external channels ที่กำหนดค่าไว้เมื่อไม่มีรายการ setup หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้ setup runtime

`channelConfigs` คือ Plugin manifest metadata ไม่ใช่ส่วน config ระดับบนสุดใหม่ของผู้ใช้
ผู้ใช้ยังคงกำหนดค่า channel instances ภายใต้ `channels.<channel-id>`
OpenClaw อ่าน manifest metadata เพื่อตัดสินใจว่า Plugin ใดเป็นเจ้าของ channel ที่กำหนดค่าไว้นั้น
ก่อนที่โค้ด runtime ของ Plugin จะทำงาน

สำหรับ channel Plugin, `configSchema` และ `channelConfigs` อธิบายพาธที่แตกต่างกัน:

- `configSchema` ตรวจสอบความถูกต้องของ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบความถูกต้องของ `channels.<channel-id>`

Plugins ที่ไม่ bundled ซึ่งประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มี OpenClaw ยังคงโหลด Plugin ได้ แต่
cold-path config schema, setup และ surface ของ Control UI จะไม่สามารถรู้รูปทรงของตัวเลือก
ที่ channel เป็นเจ้าของได้จนกว่า runtime ของ Plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้น `auto` แบบ static สำหรับการตรวจสอบ command config
ที่รันก่อน channel runtime loads ได้ Channels ที่ bundled ยังสามารถ publish
ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
metadata catalog channel อื่นๆ ที่ package เป็นเจ้าของได้

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

รายการ channel แต่ละรายการสามารถมีได้:

| ฟิลด์         | ชนิด                     | ความหมาย                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการ config ช่องทางที่ประกาศไว้         |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ/placeholder/คำใบ้ข้อมูลอ่อนไหวสำหรับ UI ที่เลือกได้สำหรับส่วน config ช่องทางนั้น          |
| `label`       | `string`                 | ป้ายกำกับช่องทางที่ผสานเข้ากับพื้นผิวตัวเลือกและการตรวจสอบเมื่อ metadata รันไทม์ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายช่องทางแบบสั้นสำหรับพื้นผิวการตรวจสอบและแค็ตตาล็อก                               |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติของคำสั่งเนทีฟแบบคงที่และสกิลเนทีฟสำหรับการตรวจสอบ config ก่อนรันไทม์       |
| `preferOver`  | `string[]`               | รหัส Plugin เดิมหรือที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรมีอันดับเหนือกว่าในพื้นผิวการเลือก    |

### การแทนที่ Plugin ช่องทางอื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับรหัสช่องทางที่
Plugin อื่นก็สามารถให้ได้เช่นกัน กรณีทั่วไปคือรหัส Plugin ที่เปลี่ยนชื่อ,
Plugin แบบ standalone ที่มาแทน Plugin ที่บันเดิลไว้, หรือ fork ที่มีการดูแล
ซึ่งคงรหัสช่องทางเดิมไว้เพื่อความเข้ากันได้ของ config

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

เมื่อมีการกำหนดค่า `channels.chat` OpenClaw จะพิจารณาทั้งรหัสช่องทางและ
รหัส Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
ถูกบันเดิลหรือเปิดใช้ตามค่าเริ่มต้น OpenClaw จะปิดใช้ Plugin นั้นใน
config รันไทม์ที่มีผล เพื่อให้ Plugin เดียวเป็นเจ้าของช่องทางและเครื่องมือของช่องทางนั้น การเลือกโดยผู้ใช้แบบชัดเจน
ยังคงมีผลเหนือกว่า: หากผู้ใช้เปิดใช้ทั้งสอง Plugin อย่างชัดเจน OpenClaw
จะคงตัวเลือกนั้นไว้และรายงานการวินิจฉัยช่องทาง/เครื่องมือซ้ำ แทนที่จะ
เปลี่ยนชุด Plugin ที่ร้องขออย่างเงียบๆ

จำกัดขอบเขต `preferOver` ไว้เฉพาะรหัส Plugin ที่สามารถให้ช่องทางเดียวกันได้จริง
ค่านี้ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อคีย์ config ของผู้ใช้

## ข้อมูลอ้างอิง modelSupport

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin ผู้ให้บริการของคุณจาก
รหัสโมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่รันไทม์ของ Plugin
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

- การอ้างอิง `provider/model` แบบชัดเจนใช้ metadata manifest ของ `providers` ที่เป็นเจ้าของ
- `modelPatterns` มีผลเหนือกว่า `modelPrefixes`
- หาก Plugin ที่ไม่ได้บันเดิลหนึ่งรายการและ Plugin ที่บันเดิลหนึ่งรายการตรงกันทั้งคู่
  Plugin ที่ไม่ได้บันเดิลจะชนะ
- ความกำกวมที่เหลือจะถูกละเว้นจนกว่าผู้ใช้หรือ config จะระบุผู้ให้บริการ

ฟิลด์:

| ฟิลด์           | ชนิด       | ความหมาย                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | คำนำหน้าที่จับคู่ด้วย `startsWith` กับรหัสโมเดลแบบย่อ                 |
| `modelPatterns` | `string[]` | ซอร์ส regex ที่จับคู่กับรหัสโมเดลแบบย่อหลังจากนำ suffix ของโปรไฟล์ออกแล้ว |

## ข้อมูลอ้างอิง modelCatalog

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้ metadata ของโมเดลผู้ให้บริการก่อน
โหลดรันไทม์ของ Plugin นี่คือซอร์สที่ manifest เป็นเจ้าของสำหรับแถวแค็ตตาล็อกแบบคงที่,
alias ของผู้ให้บริการ, กฎการระงับ, และโหมดการค้นพบ การรีเฟรชรันไทม์
ยังคงอยู่ในโค้ดรันไทม์ของผู้ให้บริการ แต่ manifest จะบอก core ว่าเมื่อใดจำเป็นต้องใช้รันไทม์

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

| ฟิลด์          | ชนิด                                                     | ความหมาย                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | แถวแค็ตตาล็อกสำหรับรหัสผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย       |
| `aliases`      | `Record<string, object>`                                 | alias ของผู้ให้บริการที่ควร resolve ไปยังผู้ให้บริการที่เป็นเจ้าของสำหรับการวางแผนแค็ตตาล็อกหรือการระงับ              |
| `suppressions` | `object[]`                                               | แถวโมเดลจากซอร์สอื่นที่ Plugin นี้ระงับด้วยเหตุผลเฉพาะผู้ให้บริการ                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ระบุว่าแค็ตตาล็อกผู้ให้บริการสามารถอ่านจาก metadata ของ manifest, รีเฟรชเข้า cache, หรือต้องใช้รันไทม์ |

`aliases` มีส่วนร่วมในการค้นหาความเป็นเจ้าของผู้ให้บริการสำหรับการวางแผน model-catalog
เป้าหมาย alias ต้องเป็นผู้ให้บริการระดับบนสุดที่ Plugin เดียวกันเป็นเจ้าของ เมื่อรายการ
ที่กรองตามผู้ให้บริการใช้ alias OpenClaw สามารถอ่าน manifest ที่เป็นเจ้าของและ
ใช้การ override API/base URL ของ alias ได้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ
Alias ไม่ขยายรายการแค็ตตาล็อกที่ไม่ได้กรอง; รายการแบบกว้างจะแสดงเฉพาะแถว
ผู้ให้บริการ canonical ที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ hook รันไทม์ผู้ให้บริการ `suppressBuiltInModel` เดิม
รายการการระงับจะถูกเคารพเฉพาะเมื่อ Plugin เป็นเจ้าของผู้ให้บริการ หรือ
ประกาศเป็นคีย์ `modelCatalog.aliases` ที่ชี้ไปยังผู้ให้บริการที่เป็นเจ้าของ Hook
การระงับรันไทม์จะไม่ถูกเรียกระหว่างการ resolve โมเดลอีกต่อไป

ฟิลด์ผู้ให้บริการ:

| ฟิลด์     | ชนิด                     | ความหมาย                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL ฐานเริ่มต้นที่เลือกได้สำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้    |
| `api`     | `ModelApi`               | adapter API เริ่มต้นที่เลือกได้สำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่เลือกได้ซึ่งใช้กับแค็ตตาล็อกผู้ให้บริการนี้      |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละเว้น            |

ฟิลด์โมเดล:

| ฟิลด์           | ชนิด                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | รหัสโมเดลภายในผู้ให้บริการ โดยไม่มีคำนำหน้า `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่แสดงผลที่เลือกได้                                                      |
| `api`           | `ModelApi`                                                     | การ override API รายโมเดลที่เลือกได้                                            |
| `baseUrl`       | `string`                                                       | การ override URL ฐานรายโมเดลที่เลือกได้                                       |
| `headers`       | `Record<string, string>`                                       | header แบบคงที่รายโมเดลที่เลือกได้                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | รูปแบบข้อมูลที่โมเดลยอมรับ                                               |
| `reasoning`     | `boolean`                                                      | ระบุว่าโมเดลเปิดเผยพฤติกรรมการใช้เหตุผลหรือไม่                               |
| `contextWindow` | `number`                                                       | context window ดั้งเดิมของผู้ให้บริการ                                             |
| `contextTokens` | `number`                                                       | เพดานบริบทของรันไทม์ที่มีผลซึ่งเลือกได้ เมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวนโทเคนเอาต์พุตสูงสุดเมื่อทราบ                                           |
| `cost`          | `object`                                                       | ราคา USD ต่อหนึ่งล้านโทเคนที่เลือกได้ รวมถึง `tieredPricing` ที่เลือกได้ |
| `compat`        | `object`                                                       | flag ความเข้ากันได้ที่เลือกได้ซึ่งตรงกับความเข้ากันได้ของ config โมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะรายการ ระงับเฉพาะเมื่อแถวนั้นต้องไม่ปรากฏเลย          |
| `statusReason`  | `string`                                                       | เหตุผลที่เลือกได้ซึ่งแสดงพร้อมสถานะที่ไม่พร้อมใช้งาน                            |
| `replaces`      | `string[]`                                                     | รหัสโมเดลภายในผู้ให้บริการรุ่นเก่าที่โมเดลนี้มาแทนที่                       |
| `replacedBy`    | `string`                                                       | รหัสโมเดลภายในผู้ให้บริการที่มาแทนสำหรับแถวที่เลิกใช้แล้ว                    |
| `tags`          | `string[]`                                                     | แท็กเสถียรที่ใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์การระงับ:

| ฟิลด์                      | ชนิด       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | รหัสผู้ให้บริการสำหรับแถว upstream ที่จะระงับ ต้องเป็นของ Plugin นี้หรือประกาศเป็น alias ที่เป็นเจ้าของ |
| `model`                    | `string`   | รหัสโมเดลภายในผู้ให้บริการที่จะระงับ                                                                      |
| `reason`                   | `string`   | ข้อความที่เลือกได้ซึ่งแสดงเมื่อมีการร้องขอแถวที่ถูกระงับโดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายชื่อ host ของ URL ฐานผู้ให้บริการที่มีผลซึ่งเลือกได้ โดยต้องมีอยู่ก่อนจึงจะใช้การระงับ               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของ provider-config แบบตรงตัวที่เลือกได้ โดยต้องมีอยู่ก่อนจึงจะใช้การระงับ              |

อย่าใส่ข้อมูลที่มีเฉพาะตอนรันไทม์ไว้ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อแถวใน manifest
สมบูรณ์พอให้พื้นผิวรายการและตัวเลือกที่กรองตามผู้ให้บริการข้าม
การค้นพบผ่าน registry/รันไทม์ได้ ใช้ `refreshable` เมื่อแถวใน manifest มีประโยชน์
ในฐานะ seed หรือส่วนเสริมที่แสดงเป็นรายการได้ แต่การรีเฟรช/แคชสามารถเพิ่มแถวเพิ่มเติมภายหลังได้;
แถวแบบ refreshable ไม่ใช่แหล่งอ้างอิงที่มีอำนาจในตัวเอง ใช้ `runtime` เมื่อ OpenClaw
ต้องโหลดรันไทม์ของผู้ให้บริการเพื่อทราบรายการ

## อ้างอิง `modelIdNormalization`

ใช้ `modelIdNormalization` สำหรับการล้างค่า id ของโมเดลแบบเบา ๆ ที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้อง
เกิดขึ้นก่อนโหลดรันไทม์ของผู้ให้บริการ สิ่งนี้ทำให้ alias เช่น ชื่อโมเดลแบบสั้น
id เดิมเฉพาะผู้ให้บริการ และกฎ prefix ของพร็อกซี อยู่ใน manifest ของ Plugin ที่เป็นเจ้าของ
แทนที่จะอยู่ในตารางเลือกโมเดลของแกนหลัก

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

ฟิลด์ของผู้ให้บริการ:

| ฟิลด์                                | ประเภท                  | ความหมาย                                                                                  |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | alias ของ id โมเดลแบบตรงตัวโดยไม่สนตัวพิมพ์ใหญ่เล็ก ค่าจะถูกส่งคืนตามที่เขียนไว้        |
| `stripPrefixes`                      | `string[]`              | Prefix ที่จะลบออกก่อนค้นหา alias มีประโยชน์สำหรับการซ้ำซ้อนของผู้ให้บริการ/โมเดลเดิม    |
| `prefixWhenBare`                     | `string`                | Prefix ที่จะเพิ่มเมื่อ id โมเดลที่ทำ normalization แล้วไม่มี `/` อยู่ก่อนแล้ว             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎ prefix ของ bare-id แบบมีเงื่อนไขหลังค้นหา alias โดยใช้ `modelPrefix` และ `prefix` เป็นคีย์ |

## อ้างอิง `providerEndpoints`

ใช้ `providerEndpoints` สำหรับการจัดประเภทปลายทางที่นโยบายคำขอทั่วไป
ต้องรู้ก่อนโหลดรันไทม์ของผู้ให้บริการ แกนหลักยังคงเป็นเจ้าของความหมายของแต่ละ
`endpointClass`; manifest ของ Plugin เป็นเจ้าของข้อมูลเมตา host และ base URL

ฟิลด์ของปลายทาง:

| ฟิลด์                          | ประเภท     | ความหมาย                                                                                       |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาสปลายทางของแกนหลักที่รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`      |
| `hosts`                        | `string[]` | ชื่อโฮสต์แบบตรงตัวที่ map ไปยังคลาสปลายทาง                                                    |
| `hostSuffixes`                 | `string[]` | suffix ของโฮสต์ที่ map ไปยังคลาสปลายทาง เติม `.` นำหน้าสำหรับการจับคู่เฉพาะ suffix ของโดเมน |
| `baseUrls`                     | `string[]` | base URL ของ HTTP(S) ที่ทำ normalization แล้วแบบตรงตัว ซึ่ง map ไปยังคลาสปลายทาง              |
| `googleVertexRegion`           | `string`   | ภูมิภาค Google Vertex แบบคงที่สำหรับโฮสต์ส่วนกลางแบบตรงตัว                                     |
| `googleVertexRegionHostSuffix` | `string`   | Suffix ที่จะตัดออกจากโฮสต์ที่ตรงกันเพื่อเปิดเผย prefix ของภูมิภาค Google Vertex              |

## อ้างอิง `providerRequest`

ใช้ `providerRequest` สำหรับข้อมูลเมตาความเข้ากันได้ของคำขอแบบเบา ๆ ที่นโยบาย
คำขอทั่วไปต้องใช้โดยไม่โหลดรันไทม์ของผู้ให้บริการ เก็บการเขียน payload ใหม่ที่เฉพาะต่อพฤติกรรม
ไว้ใน hook รันไทม์ของผู้ให้บริการหรือ helper ที่ใช้ร่วมกันในตระกูลผู้ให้บริการ

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

| ฟิลด์                 | ประเภท       | ความหมาย                                                                                 |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายตระกูลผู้ให้บริการที่ใช้ในการตัดสินใจความเข้ากันได้ของคำขอทั่วไปและการวินิจฉัย    |
| `compatibilityFamily` | `"moonshot"` | กลุ่มความเข้ากันได้ของตระกูลผู้ให้บริการแบบไม่บังคับสำหรับ helper คำขอที่ใช้ร่วมกัน    |
| `openAICompletions`   | `object`     | แฟล็กคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage`      |

## อ้างอิง `modelPricing`

ใช้ `modelPricing` เมื่อผู้ให้บริการต้องควบคุมพฤติกรรมราคาฝั่ง control-plane ก่อน
โหลดรันไทม์ แคชราคาของ Gateway อ่านข้อมูลเมตานี้โดยไม่ import
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

ฟิลด์ของผู้ให้บริการ:

| ฟิลด์        | ประเภท            | ความหมาย                                                                                         |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | ตั้งเป็น `false` สำหรับผู้ให้บริการแบบ local/self-hosted ที่ไม่ควรดึงราคา OpenRouter หรือ LiteLLM |
| `openRouter` | `false \| object` | การ map การค้นหาราคา OpenRouter ค่า `false` ปิดการค้นหา OpenRouter สำหรับผู้ให้บริการนี้         |
| `liteLLM`    | `false \| object` | การ map การค้นหาราคา LiteLLM ค่า `false` ปิดการค้นหา LiteLLM สำหรับผู้ให้บริการนี้              |

ฟิลด์ของแหล่งข้อมูล:

| ฟิลด์                      | ประเภท             | ความหมาย                                                                                                      |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | id ผู้ให้บริการของแคตตาล็อกภายนอกเมื่อแตกต่างจาก id ผู้ให้บริการของ OpenClaw เช่น `z-ai` สำหรับผู้ให้บริการ `zai` |
| `passthroughProviderModel` | `boolean`          | ปฏิบัติต่อ id โมเดลที่มี slash เป็น ref ผู้ให้บริการ/โมเดลแบบซ้อน มีประโยชน์สำหรับผู้ให้บริการพร็อกซี เช่น OpenRouter |
| `modelIdTransforms`        | `"version-dots"[]` | รูปแบบเพิ่มเติมของ id โมเดลในแคตตาล็อกภายนอก `version-dots` จะลอง id เวอร์ชันแบบมีจุด เช่น `claude-opus-4.6` |

### ดัชนีผู้ให้บริการ OpenClaw

ดัชนีผู้ให้บริการ OpenClaw คือข้อมูลเมตาแบบ preview ที่ OpenClaw เป็นเจ้าของสำหรับผู้ให้บริการ
ที่ Plugin ของพวกเขาอาจยังไม่ได้ติดตั้ง ดัชนีนี้ไม่ใช่ส่วนหนึ่งของ manifest ของ Plugin
manifest ของ Plugin ยังคงเป็นแหล่งอ้างอิงที่มีอำนาจของ Plugin ที่ติดตั้งแล้ว ดัชนีผู้ให้บริการคือ
สัญญาสำรองภายในที่พื้นผิวตัวเลือกโมเดลสำหรับผู้ให้บริการที่ติดตั้งได้ในอนาคตและก่อนติดตั้ง
จะใช้เมื่อยังไม่ได้ติดตั้ง Plugin ของผู้ให้บริการ

ลำดับแหล่งอ้างอิงของแคตตาล็อก:

1. การกำหนดค่าของผู้ใช้
2. manifest ของ Plugin ที่ติดตั้งแล้ว `modelCatalog`
3. แคชแคตตาล็อกโมเดลจากการรีเฟรชอย่างชัดเจน
4. แถว preview ของดัชนีผู้ให้บริการ OpenClaw

ดัชนีผู้ให้บริการต้องไม่มี secret, สถานะเปิดใช้งาน, hook รันไทม์ หรือ
ข้อมูลโมเดลสดเฉพาะบัญชี แคตตาล็อก preview ของดัชนีใช้รูปทรงแถวผู้ให้บริการ
`modelCatalog` แบบเดียวกับ manifest ของ Plugin แต่ควรจำกัดไว้ที่
ข้อมูลเมตาการแสดงผลที่เสถียร เว้นแต่ฟิลด์ของ runtime adapter เช่น `api`,
`baseUrl`, ราคา หรือแฟล็กความเข้ากันได้ จะถูกตั้งใจให้สอดคล้องกับ
manifest ของ Plugin ที่ติดตั้งแล้ว ผู้ให้บริการที่มีการค้นพบ `/models` แบบสดควร
เขียนแถวที่รีเฟรชแล้วผ่านเส้นทางแคชแคตตาล็อกโมเดลแบบชัดเจน แทนที่จะ
ทำให้การแสดงรายการปกติหรือการเริ่มต้นใช้งานเรียก API ของผู้ให้บริการ

รายการในดัชนีผู้ให้บริการอาจมีข้อมูลเมตาของ Plugin ที่ติดตั้งได้สำหรับผู้ให้บริการ
ซึ่ง Plugin ได้ย้ายออกจากแกนหลักหรือยังไม่ได้ติดตั้งด้วย ข้อมูลเมตานี้
สะท้อนรูปแบบแคตตาล็อกช่องทาง: ชื่อแพ็กเกจ, npm install spec,
integrity ที่คาดไว้ และป้ายตัวเลือกการยืนยันตัวตนแบบเบา ๆ เพียงพอสำหรับแสดง
ตัวเลือกการตั้งค่าที่ติดตั้งได้ เมื่อ Plugin ถูกติดตั้งแล้ว manifest ของ Plugin จะชนะและ
รายการดัชนีผู้ให้บริการจะถูกละเว้นสำหรับผู้ให้บริการนั้น

คีย์ capability ระดับบนแบบเดิมเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด
manifest ตามปกติจะไม่ปฏิบัติต่อฟิลด์ระดับบนเหล่านั้นเป็นความเป็นเจ้าของ
capability อีกต่อไป

## Manifest เทียบกับ package.json

สองไฟล์นี้ทำหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ, การตรวจสอบความถูกต้องของการกำหนดค่า, ข้อมูลเมตาตัวเลือกการยืนยันตัวตน และ hint ของ UI ที่ต้องมีอยู่ก่อนโค้ด Plugin ทำงาน |
| `package.json`         | ข้อมูลเมตา npm, การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, gating การติดตั้ง, การตั้งค่า หรือข้อมูลเมตาแคตตาล็อก |

หากไม่แน่ใจว่าข้อมูลเมตาชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากเกี่ยวกับการทำแพ็กเกจ, ไฟล์ entry หรือพฤติกรรม npm install ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ

ข้อมูลเมตาของ Plugin ก่อนรันไทม์บางส่วนตั้งใจให้อยู่ใน `package.json` ภายใต้บล็อก
`openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`
`openclaw.bundle` และ `openclaw.bundle.json` ไม่ใช่สัญญา Plugin ของ OpenClaw;
Plugin แบบ native ต้องใช้ `openclaw.plugin.json` ร่วมกับฟิลด์
`package.json#openclaw` ที่รองรับด้านล่าง

ตัวอย่างสำคัญ:

| ฟิลด์                                                                                      | ความหมาย                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ประกาศ entrypoint ของ Plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | ประกาศ entrypoint รันไทม์ JavaScript ที่บิลด์แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                                                                 |
| `openclaw.setupEntry`                                                                      | entrypoint แบบเบาสำหรับการตั้งค่าเท่านั้น ใช้ระหว่าง onboarding, การเริ่มต้นช่องทางแบบเลื่อนเวลา และสถานะช่องทางแบบอ่านอย่างเดียว/การค้นพบ SecretRef ต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin |
| `openclaw.runtimeSetupEntry`                                                               | ประกาศ entrypoint การตั้งค่า JavaScript ที่บิลด์แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องมี `setupEntry`, ต้องมีอยู่จริง และต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin                         |
| `openclaw.channel`                                                                         | metadata แค็ตตาล็อกช่องทางแบบเบา เช่น ป้ายกำกับ, พาธเอกสาร, alias และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                                                | metadata คำสั่งเนทีฟแบบคงที่และค่าเริ่มต้นอัตโนมัติของ skill เนทีฟ ที่ใช้โดย config, audit และพื้นผิวรายการคำสั่งก่อนโหลดรันไทม์ช่องทาง                                          |
| `openclaw.channel.configuredState`                                                         | metadata ตัวตรวจสอบสถานะที่กำหนดค่าแล้วแบบเบา ที่ตอบได้ว่า "มีการตั้งค่าแบบ env-only อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางทั้งหมด                                         |
| `openclaw.channel.persistedAuthState`                                                      | metadata ตัวตรวจสอบ auth ที่บันทึกไว้แบบเบา ที่ตอบได้ว่า "มีอะไรลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางทั้งหมด                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | hint สำหรับติดตั้ง/อัปเดต Plugin ที่ bundled และ Plugin ที่เผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | พาธติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้ใช้                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | เวอร์ชันโฮสต์ OpenClaw ขั้นต่ำที่รองรับ โดยใช้ฐาน semver เช่น `>=2026.3.22` หรือ `>=2026.5.1-beta.1`                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | สตริง integrity ของ npm dist ที่คาดไว้ เช่น `sha512-...`; flow การติดตั้งและอัปเดตจะตรวจสอบ artifact ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | อนุญาตเส้นทางกู้คืนการติดตั้งใหม่ของ bundled-plugin แบบแคบเมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | อนุญาตให้พื้นผิวช่องทางแบบ setup-only โหลดก่อน Plugin ช่องทางเต็มระหว่าง startup                                                                                                 |

metadata ของ manifest ตัดสินใจว่าตัวเลือก provider/channel/setup ใดจะปรากฏใน
onboarding ก่อนที่รันไทม์จะโหลด `package.json#openclaw.install` บอก
onboarding ว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้าย hint การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด
registry ของ manifest สำหรับแหล่ง Plugin ที่ไม่ใช่ bundled ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ;
ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม Plugin ภายนอกบนโฮสต์รุ่นเก่า แหล่ง Plugin แบบ bundled
ถือว่ามีเวอร์ชันร่วมกับ host checkout

metadata แบบติดตั้งเมื่อจำเป็นอย่างเป็นทางการควรใช้ `clawhubSpec` เมื่อ Plugin
เผยแพร่บน ClawHub; onboarding ถือว่านั่นเป็นแหล่งรีโมตที่ต้องการและ
บันทึกข้อเท็จจริง artifact ของ ClawHub หลังติดตั้ง `npmSpec` ยังคงเป็น fallback
สำหรับความเข้ากันได้ของแพ็กเกจที่ยังไม่ได้ย้ายไป ClawHub

การ pin เวอร์ชัน npm แบบระบุแน่นอนอยู่ใน `npmSpec` อยู่แล้ว เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการแค็ตตาล็อกภายนอกอย่างเป็นทางการ
ควรจับคู่ spec แบบระบุแน่นอนกับ `expectedIntegrity` เพื่อให้ flow การอัปเดตล้มเหลว
แบบปิด หาก artifact npm ที่ดึงมาไม่ตรงกับรีลีสที่ pin ไว้อีกต่อไป
onboarding แบบ interactive ยังคงเสนอ spec npm จาก registry ที่เชื่อถือได้ รวมถึง
ชื่อแพ็กเกจเปล่าและ dist-tag เพื่อความเข้ากันได้ การวินิจฉัยแค็ตตาล็อกสามารถ
แยกแยะแหล่งที่มาแบบ exact, floating, integrity-pinned, missing-integrity, package-name
mismatch และ invalid default-choice ได้ และยังเตือนเมื่อมี
`expectedIntegrity` แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ pin ได้
เมื่อมี `expectedIntegrity`
flow การติดตั้ง/อัปเดตจะบังคับใช้ค่านี้; เมื่อเว้นไว้ การ resolve จาก registry จะถูก
บันทึกโดยไม่มี integrity pin

Plugin ช่องทางควรระบุ `openclaw.setupEntry` เมื่อ status, รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าแล้วโดยไม่โหลด
รันไทม์ทั้งหมด entry การตั้งค่าควรเปิดเผย metadata ช่องทาง พร้อม config,
status และ adapter สำหรับ secrets ที่ปลอดภัยต่อการตั้งค่า; เก็บ network client, gateway listener และ
transport runtime ไว้ใน entrypoint หลักของ extension

ฟิลด์ runtime entrypoint ไม่ได้ override การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
source entrypoint ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ตั้งใจให้แคบ ไม่ได้ทำให้
config ที่เสียแบบใดก็ได้ติดตั้งได้ ปัจจุบันอนุญาตเฉพาะให้ flow การติดตั้ง
กู้คืนจากความล้มเหลวเฉพาะของการอัปเกรด bundled-plugin ที่ค้างอยู่ เช่น
พาธ bundled plugin ที่หายไป หรือ entry `channels.<id>` ที่ค้างอยู่สำหรับ
bundled plugin เดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ปฏิบัติงาน
ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือ metadata ของแพ็กเกจสำหรับโมดูลตัวตรวจสอบ
ขนาดเล็กมาก:

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

ใช้เมื่อ flow การตั้งค่า, doctor, status หรือ presence แบบอ่านอย่างเดียวต้องการ
probe auth แบบ yes/no ที่เบาก่อนที่ Plugin ช่องทางเต็มจะโหลด สถานะ auth ที่บันทึกไว้
ไม่ใช่สถานะช่องทางที่กำหนดค่าแล้ว: อย่าใช้ metadata นี้เพื่อเปิดใช้ Plugin อัตโนมัติ,
ซ่อมแซม dependency ของรันไทม์ หรือ decide ว่ารันไทม์ช่องทางควรโหลดหรือไม่
target export ควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะสถานะที่บันทึกไว้; อย่า
route ผ่าน barrel รันไทม์ช่องทางเต็ม

`openclaw.channel.configuredState` ใช้รูปทรงเดียวกันสำหรับการตรวจสอบ
configured แบบ env-only ที่เบา:

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

ใช้เมื่อช่องทางสามารถตอบ configured-state จาก env หรือ input ขนาดเล็กอื่นที่ไม่ใช่รันไทม์
ได้ หากการตรวจสอบต้องใช้การ resolve config เต็มหรือรันไทม์ช่องทางจริง
ให้เก็บ logic นั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญของการค้นพบ (id Plugin ซ้ำ)

OpenClaw ค้นพบ Plugin จาก root หลายแห่ง (bundled, การติดตั้ง global, workspace, พาธที่เลือกผ่าน config อย่างชัดเจน) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด**; รายการซ้ำที่มีลำดับต่ำกว่าจะถูกทิ้งแทนที่จะโหลดไว้ข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **เลือกผ่าน config** — พาธที่ pin อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อมกับ OpenClaw
3. **การติดตั้ง global** — Plugin ที่ติดตั้งลงใน root Plugin global ของ OpenClaw
4. **Workspace** — Plugin ที่ค้นพบโดยอิงกับ workspace ปัจจุบัน

ผลที่ตามมา:

- สำเนา fork หรือสำเนาเก่าของ bundled plugin ที่อยู่ใน workspace จะไม่ shadow build แบบ bundled
- หากต้องการ override bundled plugin ด้วยตัว local จริง ๆ ให้ pin ผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนที่จะพึ่งการค้นพบจาก workspace
- การทิ้งรายการซ้ำจะถูก log เพื่อให้ Doctor และ diagnostics ตอน startup ชี้ไปยังสำเนาที่ถูกทิ้งได้
- การ override รายการซ้ำที่เลือกผ่าน config จะถูกใช้ถ้อยคำว่าเป็น override ที่ชัดเจนใน diagnostics แต่ยังคงเตือนเพื่อให้ fork ที่ค้างและ shadow โดยไม่ตั้งใจยังมองเห็นได้

## ข้อกำหนด JSON Schema

- **Plugin ทุกตัวต้องมาพร้อม JSON Schema** แม้ว่าจะไม่รับ config ก็ตาม
- schema ว่างใช้ได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema ถูกตรวจสอบตอนอ่าน/เขียน config ไม่ใช่ตอนรันไทม์
- เมื่อขยายหรือ fork bundled plugin ด้วยคีย์ config ใหม่ ให้อัปเดต `configSchema` ใน `openclaw.plugin.json` ของ Plugin นั้นพร้อมกันด้วย schema ของ bundled plugin เข้มงวด ดังนั้นการเพิ่ม `plugins.entries.<id>.config.myNewKey` ใน config ผู้ใช้โดยไม่เพิ่ม `myNewKey` ไปที่ `configSchema.properties` จะถูกปฏิเสธก่อนรันไทม์ Plugin โหลด

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

## พฤติกรรมการตรวจสอบความถูกต้อง

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ channel id นั้นจะประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id ของ Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักเป็น **ข้อผิดพลาด**
- หาก Plugin ถูกติดตั้งแล้วแต่ manifest หรือ schema เสียหรือหายไป
  การตรวจสอบความถูกต้องจะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin อยู่แต่ Plugin ถูก **ปิดใช้งาน** config จะถูกเก็บไว้และ
  มี **คำเตือน** แสดงใน Doctor + logs

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema `plugins.*` ฉบับเต็ม

## หมายเหตุ

- ไฟล์กำกับเป็นสิ่งที่**จำเป็นสำหรับ Plugin เนทีฟของ OpenClaw** รวมถึงการโหลดจากระบบไฟล์ภายในเครื่อง รันไทม์ยังคงโหลดโมดูล Plugin แยกต่างหาก; ไฟล์กำกับมีไว้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น.
- ไฟล์กำกับเนทีฟถูกแยกวิเคราะห์ด้วย JSON5 ดังนั้นจึงยอมรับคอมเมนต์ เครื่องหมายจุลภาคท้ายรายการ และคีย์ที่ไม่ใส่เครื่องหมายคำพูด ตราบใดที่ค่าสุดท้ายยังคงเป็นออบเจ็กต์.
- ตัวโหลดไฟล์กำกับจะอ่านเฉพาะฟิลด์ของไฟล์กำกับที่มีเอกสารระบุไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดที่กำหนดเอง.
- `channels`, `providers`, `cliBackends`, และ `skills` สามารถละไว้ทั้งหมดได้เมื่อ Plugin ไม่ต้องการใช้.
- `providerDiscoveryEntry` ต้องคงความเบาไว้และไม่ควรนำเข้าโค้ดรันไทม์ขนาดใหญ่; ใช้สำหรับเมตาดาทาแค็ตตาล็อกผู้ให้บริการแบบสแตติกหรือตัวบรรยายการค้นพบแบบจำกัด ไม่ใช่การดำเนินการในช่วงเวลารับคำขอ.
- ชนิด Plugin แบบเอกสิทธิ์เลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`).
- ประกาศชนิด Plugin แบบเอกสิทธิ์ในไฟล์กำกับนี้ `OpenClawPluginDefinition.kind` ของรายการรันไทม์เลิกใช้แล้วและยังคงอยู่เฉพาะในฐานะทางเลือกสำรองเพื่อความเข้ากันได้สำหรับ Plugin รุ่นเก่า.
- เมตาดาทาตัวแปรสภาพแวดล้อม (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว, และ `channelEnvVars`) เป็นแบบประกาศเท่านั้น สถานะ การตรวจสอบ การตรวจสอบความถูกต้องของการส่ง Cron และพื้นผิวแบบอ่านอย่างเดียวอื่น ๆ ยังคงใช้นโยบายความไว้วางใจ Plugin และการเปิดใช้งานที่มีผลจริง ก่อนจะถือว่าตัวแปรสภาพแวดล้อมถูกกำหนดค่าแล้ว.
- สำหรับเมตาดาทาตัวช่วยตั้งค่ารันไทม์ที่ต้องใช้โค้ดผู้ให้บริการ ดู [ฮุกผู้ให้บริการรันไทม์](/th/plugins/architecture-internals#provider-runtime-hooks).
- หาก Plugin ของคุณขึ้นต่อโมดูลเนทีฟ ให้จัดทำเอกสารขั้นตอนการบิลด์และข้อกำหนดรายการอนุญาตของตัวจัดการแพ็กเกจใด ๆ (ตัวอย่างเช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin.
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ.
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    เอกสารอ้างอิง Plugin SDK และการนำเข้าพาธย่อย.
  </Card>
</CardGroup>
