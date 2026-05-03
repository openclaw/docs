---
read_when:
    - คุณกำลังสร้าง Plugin ของ OpenClaw
    - คุณจำเป็นต้องเผยแพร่สคีมาการกำหนดค่า Plugin หรือดีบักข้อผิดพลาดการตรวจสอบความถูกต้องของ Plugin
summary: ข้อกำหนดของแมนิเฟสต์ Plugin + สคีมา JSON (การตรวจสอบการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ของ Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้สำหรับ**แมนิเฟสต์ Plugin OpenClaw แบบเนทีฟ**เท่านั้น

สำหรับเลย์เอาต์บันเดิลที่เข้ากันได้ โปรดดู [บันเดิล Plugin](/th/plugins/bundles)

รูปแบบบันเดิลที่เข้ากันได้ใช้ไฟล์แมนิเฟสต์ต่างกัน:

- บันเดิล Codex: `.codex-plugin/plugin.json`
- บันเดิล Claude: `.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude
  เริ่มต้นที่ไม่มีแมนิเฟสต์
- บันเดิล Cursor: `.cursor-plugin/plugin.json`

OpenClaw ตรวจพบเลย์เอาต์บันเดิลเหล่านั้นโดยอัตโนมัติด้วย แต่เลย์เอาต์เหล่านั้นจะไม่ได้รับการตรวจสอบ
กับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับบันเดิลที่เข้ากันได้ ปัจจุบัน OpenClaw อ่านเมทาดาทาของบันเดิลพร้อมกับรูต Skills ที่ประกาศไว้
รูตคำสั่ง Claude ค่าเริ่มต้น `settings.json` ของบันเดิล Claude
ค่าเริ่มต้น LSP ของบันเดิล Claude และชุดฮุกที่รองรับเมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของรันไทม์ OpenClaw

Plugin OpenClaw แบบเนทีฟทุกตัว**ต้อง**ส่งไฟล์ `openclaw.plugin.json` มาพร้อมใน
**รูตของ Plugin** OpenClaw ใช้แมนิเฟสต์นี้เพื่อตรวจสอบการกำหนดค่า
**โดยไม่เรียกใช้โค้ด Plugin** แมนิเฟสต์ที่ขาดหายหรือไม่ถูกต้องจะถูกถือว่าเป็น
ข้อผิดพลาดของ Plugin และจะบล็อกการตรวจสอบการกำหนดค่า

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugins](/th/tools/plugin)
สำหรับโมเดลความสามารถแบบเนทีฟและคำแนะนำความเข้ากันได้กับภายนอกในปัจจุบัน:
[โมเดลความสามารถ](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือเมทาดาทาที่ OpenClaw อ่าน**ก่อนโหลดโค้ด
Plugin ของคุณ** ทุกอย่างด้านล่างต้องเบาพอให้ตรวจสอบได้โดยไม่ต้องเริ่ม
รันไทม์ Plugin

**ใช้สำหรับ:**

- อัตลักษณ์ Plugin, การตรวจสอบการกำหนดค่า และคำแนะนำ UI การกำหนดค่า
- เมทาดาทาการยืนยันตัวตน การเริ่มต้นใช้งาน และการตั้งค่า (นามแฝง การเปิดใช้งานอัตโนมัติ ตัวแปรสภาพแวดล้อมของผู้ให้บริการ ตัวเลือกการยืนยันตัวตน)
- คำแนะนำการเปิดใช้งานสำหรับพื้นผิว control-plane
- การเป็นเจ้าของตระกูลโมเดลแบบย่อ
- สแนปช็อตการเป็นเจ้าของความสามารถแบบสแตติก (`contracts`)
- เมทาดาทาตัวรัน QA ที่โฮสต์ `openclaw qa` ร่วมสามารถตรวจสอบได้
- เมทาดาทาการกำหนดค่าเฉพาะช่องทางที่ผสานเข้ากับพื้นผิวแค็ตตาล็อกและการตรวจสอบ

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรมรันไทม์ การประกาศจุดเข้าโค้ด
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

## ข้อมูลอ้างอิงฟิลด์ระดับบนสุด

| ฟิลด์                                | จำเป็น | ชนิด                             | ความหมาย                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | รหัส Plugin แบบ canonical นี่คือรหัสที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                 |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบ inline สำหรับการกำหนดค่าของ Plugin นี้                                                                                                                                                                                        |
| `enabledByDefault`                   | ไม่ใช่       | `true`                           | ทำเครื่องหมาย Plugin ที่รวมมาในชุดให้เปิดใช้งานโดยค่าเริ่มต้น ละเว้นรายการนี้ หรือตั้งค่าเป็นค่าใดๆ ที่ไม่ใช่ `true` เพื่อปล่อยให้ Plugin ปิดใช้งานโดยค่าเริ่มต้น                                                                                                        |
| `enabledByDefaultOnPlatforms`        | ไม่ใช่       | `string[]`                       | ทำเครื่องหมาย Plugin ที่รวมมาในชุดให้เปิดใช้งานโดยค่าเริ่มต้นเฉพาะบนแพลตฟอร์ม Node.js ที่ระบุไว้ เช่น `["darwin"]` การกำหนดค่าแบบชัดเจนยังคงมีผลเหนือกว่า                                                                                            |
| `legacyPluginIds`                    | ไม่ใช่       | `string[]`                       | รหัสดั้งเดิมที่ถูกปรับให้เป็นรหัส Plugin แบบ canonical นี้                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | ไม่ใช่       | `string[]`                       | รหัสผู้ให้บริการที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อการยืนยันตัวตน การกำหนดค่า หรือการอ้างอิงโมเดลกล่าวถึงรหัสเหล่านั้น                                                                                                                                     |
| `kind`                               | ไม่ใช่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบเฉพาะทางที่ใช้โดย `plugins.slots.*`                                                                                                                                                                        |
| `channels`                           | ไม่ใช่       | `string[]`                       | รหัสช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบการกำหนดค่า                                                                                                                                                         |
| `providers`                          | ไม่ใช่       | `string[]`                       | รหัสผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | ไม่ใช่       | `string`                         | พาธโมดูลค้นพบผู้ให้บริการแบบเบา ซึ่งสัมพันธ์กับรากของ Plugin สำหรับเมทาดาทาแค็ตตาล็อกผู้ให้บริการที่อยู่ในขอบเขต manifest ซึ่งสามารถโหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์ Plugin เต็มรูปแบบ                                               |
| `modelSupport`                       | ไม่ใช่       | `object`                         | เมทาดาทาตระกูลโมเดลแบบย่อที่ manifest เป็นเจ้าของ ใช้เพื่อโหลด Plugin โดยอัตโนมัติก่อนรันไทม์                                                                                                                                         |
| `modelCatalog`                       | ไม่ใช่       | `object`                         | เมทาดาทาแค็ตตาล็อกโมเดลเชิงประกาศสำหรับผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญา control-plane สำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต การเริ่มใช้งาน ตัวเลือกโมเดล alias และการระงับโดยไม่ต้องโหลดรันไทม์ Plugin         |
| `modelPricing`                       | ไม่ใช่       | `object`                         | นโยบายค้นหาราคาภายนอกที่ผู้ให้บริการเป็นเจ้าของ ใช้เพื่อยกเว้นผู้ให้บริการแบบ local/self-hosted ออกจากแค็ตตาล็อกราคาระยะไกล หรือแมปการอ้างอิงผู้ให้บริการไปยังรหัสแค็ตตาล็อก OpenRouter/LiteLLM โดยไม่ hardcode รหัสผู้ให้บริการใน core             |
| `modelIdNormalization`               | ไม่ใช่       | `object`                         | การล้าง alias/prefix ของรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้องทำงานก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                                                           |
| `providerEndpoints`                  | ไม่ใช่       | `object[]`                       | เมทาดาทาโฮสต์ปลายทาง/baseUrl ที่ manifest เป็นเจ้าของสำหรับเส้นทางผู้ให้บริการที่ core ต้องจัดประเภทก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                            |
| `providerRequest`                    | ไม่ใช่       | `object`                         | เมทาดาทาตระกูลผู้ให้บริการและความเข้ากันได้ของคำขอแบบราคาถูก ซึ่งใช้โดยนโยบายคำขอทั่วไปก่อนโหลดรันไทม์ผู้ให้บริการ                                                                                                              |
| `cliBackends`                        | ไม่ใช่       | `string[]`                       | รหัสแบ็กเอนด์การอนุมาน CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติระหว่างเริ่มต้นจากการอ้างอิงการกำหนดค่าแบบชัดเจน                                                                                                                         |
| `syntheticAuthRefs`                  | ไม่ใช่       | `string[]`                       | การอ้างอิงผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ hook การยืนยันตัวตนสังเคราะห์ซึ่ง Plugin เป็นเจ้าของควรถูกตรวจสอบระหว่างการค้นพบโมเดลแบบ cold ก่อนโหลดรันไทม์                                                                                              |
| `nonSecretAuthMarkers`               | ไม่ใช่       | `string[]`                       | ค่าคีย์ API ตัวแทนที่ Plugin ที่รวมมาในชุดเป็นเจ้าของ ซึ่งแทนสถานะข้อมูลประจำตัวแบบ local, OAuth หรือ ambient ที่ไม่ใช่ความลับ                                                                                                                |
| `commandAliases`                     | ไม่ใช่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการวินิจฉัยการกำหนดค่าและ CLI ที่รับรู้ Plugin ก่อนโหลดรันไทม์                                                                                                                |
| `providerAuthEnvVars`                | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env ด้านความเข้ากันได้ที่เลิกใช้แล้วสำหรับการค้นหาการยืนยันตัวตน/สถานะของผู้ให้บริการ ควรใช้ `setup.providers[].envVars` สำหรับ Plugin ใหม่ OpenClaw ยังคงอ่านค่านี้ระหว่างช่วงเลิกใช้                                                 |
| `providerAuthAliases`                | ไม่ใช่       | `Record<string, string>`         | รหัสผู้ให้บริการที่ควรนำรหัสผู้ให้บริการอื่นมาใช้ซ้ำสำหรับการค้นหาการยืนยันตัวตน เช่น ผู้ให้บริการด้านการเขียนโค้ดที่ใช้คีย์ API และโปรไฟล์การยืนยันตัวตนของผู้ให้บริการฐานร่วมกัน                                                                          |
| `channelEnvVars`                     | ไม่ใช่       | `Record<string, string[]>`       | เมทาดาทา env ของช่องทางแบบเบาที่ OpenClaw สามารถตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้รายการนี้สำหรับการตั้งค่าช่องทางที่ขับเคลื่อนด้วย env หรือพื้นผิวการยืนยันตัวตนที่ตัวช่วยเริ่มต้น/กำหนดค่าทั่วไปควรมองเห็น                                            |
| `providerAuthChoices`                | ไม่ใช่       | `object[]`                       | เมทาดาทาตัวเลือกการยืนยันตัวตนแบบเบาสำหรับตัวเลือกการเริ่มใช้งาน การแก้ไขผู้ให้บริการที่ต้องการ และการเชื่อมต่อแฟล็ก CLI อย่างง่าย                                                                                                                       |
| `activation`                         | ไม่ใช่       | `object`                         | เมทาดาทาตัววางแผนการเปิดใช้งานแบบเบาสำหรับการโหลดที่ถูกกระตุ้นโดยการเริ่มต้น ผู้ให้บริการ คำสั่ง ช่องทาง เส้นทาง และความสามารถ เป็นเมทาดาทาเท่านั้น รันไทม์ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                                                       |
| `setup`                              | ไม่ใช่       | `object`                         | ตัวอธิบายการตั้งค่า/การเริ่มใช้งานแบบเบาที่พื้นผิวการค้นพบและการตั้งค่าสามารถตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ Plugin                                                                                                                    |
| `qaRunners`                          | ไม่ใช่       | `object[]`                       | ตัวอธิบายตัวรัน QA แบบเบาที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันใช้ก่อนโหลดรันไทม์ Plugin                                                                                                                                      |
| `contracts`                          | ไม่ใช่       | `object`                         | สแนปชอตความเป็นเจ้าของความสามารถแบบสแตติกสำหรับ hook การยืนยันตัวตนภายนอก เสียง การถอดเสียงแบบเรียลไทม์ เสียงพูดแบบเรียลไทม์ การเข้าใจสื่อ การสร้างภาพ การสร้างเพลง การสร้างวิดีโอ web-fetch การค้นหาเว็บ และความเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่ใช่       | `Record<string, object>`         | ค่าเริ่มต้นด้านการเข้าใจสื่อแบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                            |
| `imageGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนสำหรับการสร้างภาพแบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.imageGenerationProviders` รวมถึง alias การยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `videoGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนสำหรับการสร้างวิดีโอแบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.videoGenerationProviders` รวมถึง alias การยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `musicGenerationProviderMetadata`    | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนสำหรับการสร้างเพลงแบบเบาสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.musicGenerationProviders` รวมถึง alias การยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `toolMetadata`                       | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาความพร้อมใช้งานแบบเบาสำหรับเครื่องมือที่ Plugin เป็นเจ้าของซึ่งประกาศใน `contracts.tools` ใช้รายการนี้เมื่อเครื่องมือไม่ควรโหลดรันไทม์ เว้นแต่จะมีหลักฐานจากการกำหนดค่า env หรือการยืนยันตัวตน                                                           |
| `channelConfigs`                     | ไม่ใช่       | `Record<string, object>`         | เมทาดาทาการกำหนดค่าช่องทางที่ manifest เป็นเจ้าของ ซึ่งถูกรวมเข้ากับพื้นผิวการค้นพบและการตรวจสอบก่อนโหลดรันไทม์                                                                                                                          |
| `skills`                             | ไม่ใช่       | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด ซึ่งสัมพันธ์กับรากของ Plugin                                                                                                                                                                             |
| `name`                               | ไม่       | `string`                         | ชื่อ Plugin ที่มนุษย์อ่านเข้าใจได้                                                                                                                                                                                                         |
| `description`                        | ไม่       | `string`                         | สรุปสั้นๆ ที่แสดงในพื้นผิวของ Plugin                                                                                                                                                                                             |
| `version`                            | ไม่       | `string`                         | เวอร์ชัน Plugin สำหรับให้ข้อมูล                                                                                                                                                                                                       |
| `uiHints`                            | ไม่       | `Record<string, object>`         | ป้ายกำกับ UI, placeholder และคำใบ้ด้านความอ่อนไหวสำหรับฟิลด์การกำหนดค่า                                                                                                                                                                   |

## เอกสารอ้างอิงเมทาดาทาของผู้ให้บริการการสร้าง

ฟิลด์เมทาดาทาของผู้ให้บริการการสร้างอธิบายสัญญาณการยืนยันตัวตนแบบคงที่สำหรับ
ผู้ให้บริการที่ประกาศไว้ในรายการ `contracts.*GenerationProviders` ที่ตรงกัน
OpenClaw อ่านฟิลด์เหล่านี้ก่อนรันไทม์ของผู้ให้บริการจะโหลด เพื่อให้เครื่องมือหลักสามารถ
ตัดสินใจได้ว่าผู้ให้บริการการสร้างพร้อมใช้งานหรือไม่ โดยไม่ต้องนำเข้า
Plugin ของผู้ให้บริการทุกรายการ

ใช้ฟิลด์เหล่านี้เฉพาะกับข้อเท็จจริงเชิงประกาศที่ตรวจได้อย่างประหยัดเท่านั้น การส่งข้อมูล การแปลงคำขอ
การรีเฟรชโทเค็น การตรวจสอบข้อมูลรับรอง และพฤติกรรมการสร้างจริง
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

รายการเมทาดาทาแต่ละรายการรองรับ:

| ฟิลด์           | จำเป็น | ประเภท       | ความหมาย                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | ไม่ใช่       | `string[]` | รหัสผู้ให้บริการเพิ่มเติมที่ควรนับเป็นนามแฝงการยืนยันตัวตนแบบคงที่สำหรับผู้ให้บริการการสร้าง                                       |
| `authProviders` | ไม่ใช่       | `string[]` | รหัสผู้ให้บริการที่โปรไฟล์การยืนยันตัวตนซึ่งกำหนดค่าไว้ควรถูกนับเป็นการยืนยันตัวตนสำหรับผู้ให้บริการการสร้างนี้                                      |
| `configSignals` | ไม่ใช่       | `object[]` | สัญญาณความพร้อมใช้งานจากการกำหนดค่าเท่านั้นที่ตรวจได้อย่างประหยัด สำหรับผู้ให้บริการแบบโลคัลหรือโฮสต์เองที่สามารถกำหนดค่าได้โดยไม่ต้องใช้โปรไฟล์การยืนยันตัวตนหรือตัวแปรสภาพแวดล้อม |
| `authSignals`   | ไม่ใช่       | `object[]` | สัญญาณการยืนยันตัวตนที่ระบุชัดเจน เมื่อมีฟิลด์นี้ สัญญาณเหล่านี้จะแทนที่ชุดสัญญาณเริ่มต้นจากรหัสผู้ให้บริการ `aliases` และ `authProviders`     |

รายการ `configSignals` แต่ละรายการรองรับ:

| ฟิลด์         | จำเป็น | ประเภท       | ความหมาย                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | ใช่      | `string`   | เส้นทางแบบจุดไปยังอ็อบเจกต์การกำหนดค่าที่ Plugin เป็นเจ้าของเพื่อตรวจสอบ เช่น `plugins.entries.example.config`                                                                                    |
| `overlayPath` | ไม่ใช่       | `string`   | เส้นทางแบบจุดภายในการกำหนดค่าราก ซึ่งอ็อบเจกต์ของเส้นทางนั้นควรซ้อนทับอ็อบเจกต์รากก่อนประเมินสัญญาณ ใช้ฟิลด์นี้สำหรับการกำหนดค่าเฉพาะความสามารถ เช่น `image`, `video` หรือ `music` |
| `required`    | ไม่ใช่       | `string[]` | เส้นทางแบบจุดภายในการกำหนดค่าที่มีผล ซึ่งต้องมีค่าที่กำหนดไว้ สตริงต้องไม่ว่างเปล่า อ็อบเจกต์และอาร์เรย์ต้องไม่ว่างเปล่า                                                |
| `requiredAny` | ไม่ใช่       | `string[]` | เส้นทางแบบจุดภายในการกำหนดค่าที่มีผล ซึ่งอย่างน้อยหนึ่งเส้นทางต้องมีค่าที่กำหนดไว้                                                                                                  |
| `mode`        | ไม่ใช่       | `object`   | ตัวป้องกันโหมดสตริงแบบไม่บังคับภายในการกำหนดค่าที่มีผล ใช้ฟิลด์นี้เมื่อความพร้อมใช้งานจากการกำหนดค่าเท่านั้นใช้ได้เฉพาะกับโหมดหนึ่งเท่านั้น                                                                |

ตัวป้องกัน `mode` แต่ละรายการรองรับ:

| ฟิลด์        | จำเป็น | ประเภท       | ความหมาย                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | ไม่ใช่       | `string`   | เส้นทางแบบจุดภายในการกำหนดค่าที่มีผล ค่าเริ่มต้นคือ `mode`                          |
| `default`    | ไม่ใช่       | `string`   | ค่าโหมดที่จะใช้เมื่อการกำหนดค่าละเว้นเส้นทาง                                  |
| `allowed`    | ไม่ใช่       | `string[]` | หากมี สัญญาณจะผ่านเฉพาะเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้ |
| `disallowed` | ไม่ใช่       | `string[]` | หากมี สัญญาณจะล้มเหลวเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้       |

รายการ `authSignals` แต่ละรายการรองรับ:

| ฟิลด์             | จำเป็น | ประเภท     | ความหมาย                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string` | รหัสผู้ให้บริการที่จะตรวจสอบในโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้                                                                                                                             |
| `providerBaseUrl` | ไม่ใช่       | `object` | ตัวป้องกันแบบไม่บังคับที่ทำให้สัญญาณถูกนับเฉพาะเมื่อผู้ให้บริการที่กำหนดค่าไว้อ้างอิงอยู่ใช้ URL ฐานที่อนุญาต ใช้ฟิลด์นี้เมื่อนามแฝงการยืนยันตัวตนใช้ได้เฉพาะกับ API บางรายการเท่านั้น |

ตัวป้องกัน `providerBaseUrl` แต่ละรายการรองรับ:

| ฟิลด์             | จำเป็น | ประเภท       | ความหมาย                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string`   | รหัสการกำหนดค่าผู้ให้บริการที่ควรตรวจสอบ `baseUrl`                                                                                                |
| `defaultBaseUrl`  | ไม่ใช่       | `string`   | URL ฐานที่จะถือว่าใช้เมื่อการกำหนดค่าผู้ให้บริการละเว้น `baseUrl`                                                                                         |
| `allowedBaseUrls` | ใช่      | `string[]` | URL ฐานที่อนุญาตสำหรับสัญญาณการยืนยันตัวตนนี้ สัญญาณจะถูกละเว้นเมื่อ URL ฐานที่กำหนดค่าไว้หรือค่าเริ่มต้นไม่ตรงกับหนึ่งในค่าที่ปรับรูปแบบแล้วเหล่านี้ |

## เอกสารอ้างอิงเมทาดาทาของเครื่องมือ

`toolMetadata` ใช้รูปแบบ `configSignals` และ `authSignals` เดียวกันกับ
เมทาดาทาของผู้ให้บริการการสร้าง โดยใช้ชื่อเครื่องมือเป็นคีย์ `contracts.tools` ประกาศ
ความเป็นเจ้าของ `toolMetadata` ประกาศหลักฐานความพร้อมใช้งานที่ตรวจได้อย่างประหยัด เพื่อให้ OpenClaw สามารถ
หลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin เพียงเพื่อให้แฟกทอรีเครื่องมือส่งคืน `null`

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
โหลด Plugin เจ้าของเมื่อสัญญาเครื่องมือตรงกับนโยบาย สำหรับเครื่องมือในเส้นทางที่ใช้งานบ่อย
ซึ่งแฟกทอรีขึ้นอยู่กับการยืนยันตัวตน/การกำหนดค่า ผู้เขียน Plugin ควรประกาศ
`toolMetadata` แทนการทำให้คอร์นำเข้ารันไทม์เพื่อถาม

## เอกสารอ้างอิง providerAuthChoices

รายการ `providerAuthChoices` แต่ละรายการอธิบายตัวเลือกการเริ่มต้นใช้งานหรือการยืนยันตัวตนหนึ่งตัวเลือก
OpenClaw อ่านสิ่งนี้ก่อนรันไทม์ของผู้ให้บริการจะโหลด
รายการตั้งค่าผู้ให้บริการใช้ตัวเลือกในแมนิเฟสต์เหล่านี้ ตัวเลือกการตั้งค่าที่ได้จากตัวบรรยาย
และเมทาดาทาแค็ตตาล็อกการติดตั้งโดยไม่โหลดรันไทม์ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ประเภท                                            | ความหมาย                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | รหัสผู้ให้บริการที่ตัวเลือกนี้เป็นของ                                                                      |
| `method`              | ใช่      | `string`                                        | รหัสวิธีการยืนยันตัวตนที่จะส่งต่อไป                                                                           |
| `choiceId`            | ใช่      | `string`                                        | รหัสตัวเลือกการยืนยันตัวตนที่เสถียร ซึ่งใช้โดยโฟลว์การเริ่มต้นใช้งานและ CLI                                                  |
| `choiceLabel`         | ไม่ใช่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละเว้น OpenClaw จะย้อนกลับไปใช้ `choiceId`                                        |
| `choiceHint`          | ไม่ใช่       | `string`                                        | ข้อความช่วยเหลือสั้นๆ สำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่ใช่       | `number`                                        | ค่าที่ต่ำกว่าจะเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดยผู้ช่วย                                       |
| `assistantVisibility` | ไม่ใช่       | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกจากตัวเลือกของผู้ช่วย ขณะที่ยังอนุญาตให้เลือกด้วย CLI แบบแมนนวลได้                        |
| `deprecatedChoiceIds` | ไม่ใช่       | `string[]`                                      | รหัสตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้ไปยังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่ใช่       | `string`                                        | รหัสกลุ่มแบบไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้อง                                                          |
| `groupLabel`          | ไม่ใช่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่ใช่       | `string`                                        | ข้อความช่วยเหลือสั้นๆ สำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่ใช่       | `string`                                        | คีย์ตัวเลือกภายในสำหรับโฟลว์การยืนยันตัวตนแบบแฟล็กเดียวอย่างง่าย                                                      |
| `cliFlag`             | ไม่ใช่       | `string`                                        | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่ใช่       | `string`                                        | รูปแบบตัวเลือก CLI แบบเต็ม เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่ใช่       | `string`                                        | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                                            |
| `onboardingScopes`    | ไม่ใช่       | `Array<"text-inference" \| "image-generation">` | พื้นผิวการเริ่มต้นใช้งานที่ตัวเลือกนี้ควรปรากฏ หากละเว้น ค่าเริ่มต้นคือ `["text-inference"]` |

## เอกสารอ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่ง runtime ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามเรียกใช้เป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้ metadata นี้สำหรับการวินิจฉัยโดยไม่ต้อง import โค้ด runtime ของ Plugin

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
| `kind`       | ไม่       | `"runtime-slash"` | ทำเครื่องหมาย alias ว่าเป็นคำสั่ง slash ในแชท แทนที่จะเป็นคำสั่ง CLI ระดับราก |
| `cliCommand` | ไม่       | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องเพื่อแนะนำสำหรับการดำเนินการ CLI หากมี  |

## ข้อมูลอ้างอิง activation

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผนการ activate/load

บล็อกนี้เป็น metadata สำหรับ planner ไม่ใช่ lifecycle API บล็อกนี้ไม่ได้ลงทะเบียน
พฤติกรรม runtime ไม่ได้แทนที่ `register(...)` และไม่ได้รับประกันว่า
โค้ด Plugin ได้ทำงานไปแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ตัวเลือกก่อน fallback ไปยัง metadata ความเป็นเจ้าของใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

เลือกใช้ metadata ที่แคบที่สุดซึ่งอธิบายความเป็นเจ้าของอยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, ตัวอธิบาย setup หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์นั้นได้ ใช้ `activation` สำหรับคำใบ้ planner
เพิ่มเติมที่ไม่สามารถแทนได้ด้วยฟิลด์ความเป็นเจ้าของเหล่านั้น
ใช้ `cliBackends` ระดับบนสำหรับ alias ของ CLI runtime เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้เฉพาะกับ
id ของ agent harness แบบฝังที่ยังไม่มีฟิลด์ความเป็นเจ้าของอยู่แล้ว

บล็อกนี้เป็น metadata เท่านั้น บล็อกนี้ไม่ได้ลงทะเบียนพฤติกรรม runtime และไม่ได้
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint อื่นของ runtime/Plugin
consumer ปัจจุบันใช้บล็อกนี้เป็นคำใบ้เพื่อจำกัดขอบเขตก่อนการโหลด Plugin ที่กว้างขึ้น ดังนั้น
metadata activation ที่ไม่ใช่ startup ที่ขาดหายไปมักมีผลเพียงเรื่องประสิทธิภาพเท่านั้น และ
ไม่ควรเปลี่ยนความถูกต้องตราบใดที่ fallback ของความเป็นเจ้าของใน manifest ยังคงมีอยู่

ทุก Plugin ควรตั้งค่า `activation.onStartup` อย่างตั้งใจ ตั้งเป็น `true`
เฉพาะเมื่อ Plugin ต้องทำงานระหว่างการ startup ของ Gateway ตั้งเป็น `false` เมื่อ
Plugin ไม่ทำงานตอน startup และควรโหลดจาก trigger ที่แคบกว่าเท่านั้น
การไม่ระบุ `onStartup` จะไม่โหลด Plugin ตอน startup โดยปริยายอีกต่อไป ใช้
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
| `onStartup`        | ไม่       | `boolean`                                            | activation ตอน startup ของ Gateway อย่างชัดเจน ทุก Plugin ควรตั้งค่านี้ `true` จะ import Plugin ระหว่าง startup; `false` จะคงให้ Plugin lazy ตอน startup เว้นแต่ trigger อื่นที่ตรงกันจำเป็นต้องโหลด |
| `onProviders`      | ไม่       | `string[]`                                           | id ของ provider ที่ควรรวม Plugin นี้ไว้ในแผนการ activate/load                                                                                                                      |
| `onAgentHarnesses` | ไม่       | `string[]`                                           | id ของ agent harness runtime แบบฝังที่ควรรวม Plugin นี้ไว้ในแผนการ activate/load ใช้ `cliBackends` ระดับบนสำหรับ alias ของ CLI backend                                           |
| `onCommands`       | ไม่       | `string[]`                                           | id ของคำสั่งที่ควรรวม Plugin นี้ไว้ในแผนการ activate/load                                                                                                                       |
| `onChannels`       | ไม่       | `string[]`                                           | id ของ channel ที่ควรรวม Plugin นี้ไว้ในแผนการ activate/load                                                                                                                       |
| `onRoutes`         | ไม่       | `string[]`                                           | ชนิดของ route ที่ควรรวม Plugin นี้ไว้ในแผนการ activate/load                                                                                                                       |
| `onConfigPaths`    | ไม่       | `string[]`                                           | path ของ config แบบสัมพันธ์กับรากที่ควรรวม Plugin นี้ไว้ในแผน startup/load เมื่อมี path นั้นอยู่และไม่ได้ถูกปิดใช้อย่างชัดเจน                                                      |
| `onCapabilities`   | ไม่       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ควรใช้ฟิลด์ที่แคบกว่าเมื่อเป็นไปได้                                                                                     |

consumer ที่ใช้งานจริงในปัจจุบัน:

- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับการ import ตอน startup
  อย่างชัดเจน
- การวางแผน CLI ที่ trigger โดยคำสั่ง fallback ไปยัง legacy
  `commandAliases[].cliCommand` หรือ `commandAliases[].name`
- การวางแผน startup ของ agent-runtime ใช้ `activation.onAgentHarnesses` สำหรับ
  harness แบบฝัง และใช้ `cliBackends[]` ระดับบนสำหรับ alias ของ CLI runtime
- การวางแผน setup/channel ที่ trigger โดย channel fallback ไปยังความเป็นเจ้าของ legacy `channels[]`
  เมื่อ metadata activation ของ channel ที่ชัดเจนขาดหายไป
- การวางแผน Plugin ตอน startup ใช้ `activation.onConfigPaths` สำหรับพื้นผิว config ระดับราก
  ที่ไม่ใช่ channel เช่นบล็อก `browser` ของ Plugin browser ที่ bundled มา
- การวางแผน setup/runtime ที่ trigger โดย provider fallback ไปยังความเป็นเจ้าของ legacy
  `providers[]` และ `cliBackends[]` ระดับบน เมื่อ metadata activation ของ provider
  ที่ชัดเจนขาดหายไป

การวินิจฉัยของ planner สามารถแยกคำใบ้ activation ที่ชัดเจนออกจาก fallback ของ
ความเป็นเจ้าของใน manifest ได้ ตัวอย่างเช่น `activation-command-hint` หมายความว่า
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายความว่า
planner ใช้ความเป็นเจ้าของ `commandAliases` แทน label เหตุผลเหล่านี้มีไว้สำหรับ
การวินิจฉัยของ host และการทดสอบ ผู้เขียน Plugin ควรประกาศ metadata
ที่อธิบายความเป็นเจ้าของได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง qaRunners

ใช้ `qaRunners` เมื่อ Plugin เพิ่ม transport runner หนึ่งตัวหรือมากกว่าไว้ใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน ทำให้ metadata นี้ประหยัดและคงที่ไว้ runtime ของ Plugin
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

| ฟิลด์         | จำเป็น | ชนิด     | ความหมาย                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | ใช่      | `string` | คำสั่งย่อยที่ mount ใต้ `openclaw qa` เช่น `matrix`    |
| `description` | ไม่       | `string` | ข้อความช่วยเหลือ fallback ที่ใช้เมื่อ host ที่ใช้ร่วมกันต้องการคำสั่ง stub |

## ข้อมูลอ้างอิง setup

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการ metadata ราคาถูกที่ Plugin เป็นเจ้าของ
ก่อน runtime โหลด

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

`cliBackends` ระดับบนยังคงใช้ได้และอธิบาย backend สำหรับการอนุมานของ CLI ต่อไป
`setup.cliBackends` คือพื้นผิวตัวอธิบายเฉพาะ setup สำหรับ
โฟลว์ control-plane/setup ที่ควรคงเป็น metadata-only

เมื่อมี `setup.providers` และ `setup.cliBackends` จะเป็นพื้นผิวค้นหา
แบบ descriptor-first ที่แนะนำสำหรับการค้นพบ setup หาก descriptor เพียงแต่
จำกัด Plugin ตัวเลือก และ setup ยังต้องใช้ hook runtime ช่วง setup ที่สมบูรณ์กว่า
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็น
เส้นทางดำเนินการ fallback

OpenClaw ยังรวม `setup.providers[].envVars` ในการค้นหา auth ของ provider และ
env-var แบบทั่วไปด้วย `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility
adapter ในช่วง deprecation แต่ Plugin ที่ไม่ได้ bundled ซึ่งยังใช้ฟิลด์นี้
จะได้รับการวินิจฉัย manifest Plugin ใหม่ควรวาง metadata env ของ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup แบบง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มี setup entry หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้ setup runtime entry ของ `providerAuthChoices` ที่ชัดเจนยังคง
เป็นตัวเลือกที่แนะนำสำหรับ label ที่กำหนดเอง, CLI flags, ขอบเขต onboarding และ metadata ของ assistant

ตั้ง `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw ปฏิบัติต่อ `false` ที่ชัดเจนเป็นสัญญาแบบ descriptor-only
และจะไม่ดำเนินการ `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
Plugin แบบ descriptor-only ยังจัดส่ง setup runtime entry ใดรายการหนึ่งเหล่านั้น
OpenClaw จะรายงานการวินิจฉัยแบบ additive และยังคงละเว้น entry นั้นต่อไป การไม่ระบุ
`requiresRuntime` จะคงพฤติกรรม fallback แบบ legacy เพื่อให้ Plugin เดิมที่เพิ่ม
descriptor โดยไม่มี flag นี้ไม่เสียหาย

เนื่องจากการค้นหา setup สามารถดำเนินการโค้ด `setup-api` ที่ Plugin เป็นเจ้าของ
ค่า `setup.providers[].id` และ `setup.cliBackends[]` ที่ normalize แล้วต้องไม่ซ้ำกันทั่วทั้ง
Plugin ที่ค้นพบ ความเป็นเจ้าของที่กำกวมจะ fail closed แทนที่จะเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อ setup runtime ทำงานจริง การวินิจฉัย registry ของ setup จะรายงาน descriptor
drift หาก `setup-api` ลงทะเบียน provider หรือ CLI backend ที่ manifest
descriptor ไม่ได้ประกาศ หรือหาก descriptor ไม่มีการลงทะเบียน runtime
ที่ตรงกัน การวินิจฉัยเหล่านี้เป็นแบบ additive และไม่ปฏิเสธ Plugin legacy

### ข้อมูลอ้างอิง setup.providers

| ฟิลด์          | จำเป็น | ชนิด       | ความหมาย                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่      | `string`   | id ของ provider ที่เปิดเผยระหว่าง setup หรือ onboarding ให้ id ที่ normalize แล้วไม่ซ้ำกันทั่วทั้งระบบ             |
| `authMethods`  | ไม่       | `string[]` | id ของเมธอด setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลด runtime เต็ม                       |
| `envVars`      | ไม่       | `string[]` | Env vars ที่พื้นผิว setup/status แบบทั่วไปสามารถตรวจสอบได้ก่อน runtime ของ Plugin โหลด               |
| `authEvidence` | ไม่       | `object[]` | การตรวจสอบหลักฐาน auth ในเครื่องที่ประหยัดสำหรับ provider ที่สามารถ authenticate ผ่าน marker ที่ไม่ใช่ secret |

`authEvidence` ใช้สำหรับมาร์กเกอร์ข้อมูลรับรองในเครื่องที่ผู้ให้บริการเป็นเจ้าของ ซึ่งสามารถ
ตรวจสอบได้โดยไม่ต้องโหลดโค้ดรันไทม์ การตรวจสอบเหล่านี้ต้องยังคงเบาและทำงานในเครื่อง:
ไม่มีการเรียกเครือข่าย ไม่มีการอ่าน keychain หรือ secret-manager ไม่มีคำสั่ง shell และไม่มี
การ probe API ของผู้ให้บริการ

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่       | `string`   | ตัวแปรสภาพแวดล้อมที่มีพาธไฟล์ข้อมูลรับรองแบบระบุชัดเจน                                                           |
| `fallbackPaths`    | ไม่       | `string[]` | พาธไฟล์ข้อมูลรับรองในเครื่องที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีอยู่หรือว่าง รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่       | `string[]` | ตัวแปรสภาพแวดล้อมที่ระบุไว้อย่างน้อยหนึ่งตัวต้องไม่ว่างก่อนที่หลักฐานจะถือว่าใช้ได้                                    |
| `requiresAllEnv`   | ไม่       | `string[]` | ตัวแปรสภาพแวดล้อมที่ระบุไว้ทุกตัวต้องไม่ว่างก่อนที่หลักฐานจะถือว่าใช้ได้                                           |
| `credentialMarker` | ใช่      | `string`   | มาร์กเกอร์ที่ไม่ใช่ความลับซึ่งส่งคืนเมื่อมีหลักฐานอยู่                                                       |
| `source`           | ไม่       | `string`   | ป้ายกำกับแหล่งที่มาสำหรับผู้ใช้ในเอาต์พุต auth/status                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่       | `object[]` | ตัวอธิบายการตั้งค่าผู้ให้บริการที่เปิดเผยระหว่างการตั้งค่าและ onboarding                                     |
| `cliBackends`      | ไม่       | `string[]` | id ของ backend ตอนตั้งค่าที่ใช้สำหรับการค้นหาการตั้งค่าแบบ descriptor-first รักษา id ที่ normalize แล้วให้ไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่       | `string[]` | id การย้าย config ที่พื้นผิวการตั้งค่าของ Plugin นี้เป็นเจ้าของ                                          |
| `requiresRuntime`  | ไม่       | `boolean`  | การตั้งค่ายังต้องดำเนินการ `setup-api` หลังจากค้นหา descriptor หรือไม่                            |

## อ้างอิง uiHints

`uiHints` คือ map จากชื่อฟิลด์ config ไปยัง hint ขนาดเล็กสำหรับการเรนเดอร์

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
| `label`       | `string`   | ป้ายกำกับฟิลด์สำหรับผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือสั้น ๆ                      |
| `tags`        | `string[]` | แท็ก UI แบบไม่บังคับ                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายว่าฟิลด์เป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายว่าฟิลด์เป็นความลับหรืออ่อนไหว |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตของฟอร์ม       |

## อ้างอิง contracts

ใช้ `contracts` เฉพาะสำหรับ metadata การเป็นเจ้าของ capability แบบ static ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้อง import รันไทม์ของ Plugin

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

แต่ละรายการเป็นแบบไม่บังคับ:

| ฟิลด์                            | ประเภท       | ความหมาย                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id ของ factory ส่วนขยาย app-server ของ Codex ปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | id รันไทม์ที่ Plugin แบบ bundled อาจลงทะเบียน middleware ผลลัพธ์เครื่องมือให้ได้ |
| `externalAuthProviders`          | `string[]` | id ผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ hook โปรไฟล์ auth ภายนอก       |
| `speechProviders`                | `string[]` | id ผู้ให้บริการเสียงพูดที่ Plugin นี้เป็นเจ้าของ                                 |
| `realtimeTranscriptionProviders` | `string[]` | id ผู้ให้บริการการถอดเสียงแบบ realtime ที่ Plugin นี้เป็นเจ้าของ                 |
| `realtimeVoiceProviders`         | `string[]` | id ผู้ให้บริการเสียงแบบ realtime ที่ Plugin นี้เป็นเจ้าของ                         |
| `memoryEmbeddingProviders`       | `string[]` | id ผู้ให้บริการ memory embedding ที่ Plugin นี้เป็นเจ้าของ                       |
| `mediaUnderstandingProviders`    | `string[]` | id ผู้ให้บริการ media-understanding ที่ Plugin นี้เป็นเจ้าของ                    |
| `imageGenerationProviders`       | `string[]` | id ผู้ให้บริการ image-generation ที่ Plugin นี้เป็นเจ้าของ                       |
| `videoGenerationProviders`       | `string[]` | id ผู้ให้บริการ video-generation ที่ Plugin นี้เป็นเจ้าของ                       |
| `webFetchProviders`              | `string[]` | id ผู้ให้บริการ web-fetch ที่ Plugin นี้เป็นเจ้าของ                              |
| `webSearchProviders`             | `string[]` | id ผู้ให้บริการ web-search ที่ Plugin นี้เป็นเจ้าของ                             |
| `migrationProviders`             | `string[]` | id ผู้ให้บริการ import ที่ Plugin นี้เป็นเจ้าของสำหรับ `openclaw migrate`          |
| `tools`                          | `string[]` | ชื่อเครื่องมือ agent ที่ Plugin นี้เป็นเจ้าของ                                    |

`contracts.embeddedExtensionFactories` ถูกคงไว้สำหรับ factory ส่วนขยายเฉพาะ app-server ของ Codex
แบบ bundled เท่านั้น transform ผลลัพธ์เครื่องมือแบบ bundled ควรประกาศ
`contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน Plugin ภายนอกไม่สามารถ
ลงทะเบียน middleware ผลลัพธ์เครื่องมือได้ เพราะ seam สามารถเขียนผลลัพธ์เครื่องมือที่มีความน่าเชื่อถือสูงใหม่
ก่อนที่โมเดลจะเห็น

การลงทะเบียน `api.registerTool(...)` ตอนรันไทม์ต้องตรงกับ `contracts.tools`
การค้นพบเครื่องมือใช้รายการนี้เพื่อโหลดเฉพาะรันไทม์ของ Plugin ที่สามารถเป็นเจ้าของ
เครื่องมือที่ร้องขอได้

Plugin ผู้ให้บริการที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugin ที่ไม่มีการประกาศยังคงทำงาน
ผ่าน fallback ความเข้ากันได้ที่เลิกใช้แล้ว แต่ fallback นั้นช้ากว่าและ
จะถูกนำออกหลังช่วงเวลาการย้าย

ผู้ให้บริการ memory embedding แบบ bundled ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับทุก id adapter ที่เปิดเผย รวมถึง
adapter ในตัวอย่าง `local` พาธ CLI แบบ standalone ใช้สัญญา manifest นี้
เพื่อโหลดเฉพาะ Plugin เจ้าของก่อนที่รันไทม์ Gateway เต็มรูปแบบจะ
ลงทะเบียนผู้ให้บริการแล้ว

## อ้างอิง mediaUnderstandingProviderMetadata

ใช้ `mediaUnderstandingProviderMetadata` เมื่อผู้ให้บริการ media-understanding มี
โมเดลเริ่มต้น ลำดับความสำคัญ fallback ของ auto-auth หรือการรองรับเอกสาร native ที่
ตัวช่วย core ทั่วไปต้องใช้ก่อนโหลดรันไทม์ key ต้องประกาศใน
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

| ฟิลด์                  | ประเภท                                | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | capability ด้านสื่อที่ผู้ให้บริการนี้เปิดเผย                                 |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้นจาก capability ไปยังโมเดลที่ใช้เมื่อ config ไม่ได้ระบุโมเดล      |
| `autoPriority`         | `Record<string, number>`            | เลขที่ต่ำกว่าจะถูกเรียงก่อนสำหรับ fallback ผู้ให้บริการอัตโนมัติตามข้อมูลรับรอง |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสาร native ที่ผู้ให้บริการรองรับ                            |

## อ้างอิง channelConfigs

ใช้ `channelConfigs` เมื่อ Plugin ของช่องทางต้องการ metadata config ราคาถูกก่อน
โหลดรันไทม์ การค้นพบการตั้งค่า/สถานะของช่องทางแบบอ่านอย่างเดียวสามารถใช้ metadata นี้
โดยตรงสำหรับช่องทางภายนอกที่กำหนดค่าแล้วเมื่อไม่มีรายการ setup ให้ใช้ หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้รันไทม์สำหรับ setup

`channelConfigs` คือ metadata manifest ของ Plugin ไม่ใช่ส่วน config ผู้ใช้ระดับบนสุดใหม่
ผู้ใช้ยังคงกำหนดค่า instance ของช่องทางภายใต้ `channels.<channel-id>`
OpenClaw อ่าน metadata manifest เพื่อตัดสินว่า Plugin ใดเป็นเจ้าของช่องทางที่กำหนดค่าแล้วนั้น
ก่อนที่โค้ดรันไทม์ของ Plugin จะทำงาน

สำหรับ Plugin ของช่องทาง `configSchema` และ `channelConfigs` อธิบายพาธที่แตกต่างกัน:

- `configSchema` ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบ `channels.<channel-id>`

Plugin ที่ไม่ใช่ bundled ซึ่งประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มี OpenClaw ยังสามารถโหลด Plugin ได้ แต่
schema config บน cold-path, setup และพื้นผิว Control UI จะไม่สามารถรู้รูปแบบ option
ที่ช่องทางเป็นเจ้าของได้จนกว่า runtime ของ Plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้น `auto` แบบ static สำหรับการตรวจสอบ config คำสั่ง
ที่ทำงานก่อนโหลดรันไทม์ของช่องทาง ช่องทางแบบ bundled ยังสามารถเผยแพร่
ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
metadata catalog ช่องทางอื่น ๆ ที่ package เป็นเจ้าของ

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
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับรายการ config ของช่องทางที่ประกาศแต่ละรายการ         |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ/placeholder/คำใบ้ข้อมูลอ่อนไหวของ UI ที่ไม่บังคับสำหรับส่วน config ของช่องทางนั้น          |
| `label`       | `string`                 | ป้ายกำกับช่องทางที่รวมเข้าในพื้นผิวตัวเลือกและตรวจสอบเมื่อ metadata ของ runtime ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบายช่องทางแบบสั้นสำหรับพื้นผิวตรวจสอบและแค็ตตาล็อก                               |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติของคำสั่ง native แบบคงที่และ Skills native สำหรับการตรวจ config ก่อน runtime       |
| `preferOver`  | `string[]`               | ID ของ Plugin เดิมหรือมีลำดับความสำคัญต่ำกว่าที่ช่องทางนี้ควรมีอันดับเหนือกว่าในพื้นผิวการเลือก    |

### การแทนที่ Plugin ช่องทางอื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับ ID ช่องทางที่
Plugin อื่นก็สามารถให้ได้เช่นกัน กรณีทั่วไปคือ ID ของ Plugin ที่เปลี่ยนชื่อแล้ว,
Plugin แบบสแตนด์อโลนที่แทนที่ Plugin ที่รวมมาให้, หรือ fork ที่มีการดูแลและ
คง ID ช่องทางเดิมไว้เพื่อความเข้ากันได้ของ config

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

เมื่อกำหนดค่า `channels.chat` แล้ว OpenClaw จะพิจารณาทั้ง ID ช่องทางและ
ID ของ Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
ถูกรวมมาให้หรือเปิดใช้งานเป็นค่าเริ่มต้น OpenClaw จะปิดใช้งาน Plugin นั้นใน
config ของ runtime ที่มีผล เพื่อให้ Plugin เดียวเป็นเจ้าของช่องทางและเครื่องมือของช่องทางนั้น การเลือกโดยผู้ใช้แบบชัดเจน
ยังชนะเสมอ: หากผู้ใช้เปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw
จะรักษาตัวเลือกนั้นไว้และรายงานการวินิจฉัยช่องทาง/เครื่องมือซ้ำ แทนที่จะ
เปลี่ยนชุด Plugin ที่ร้องขอโดยไม่แจ้งให้ทราบ

จำกัดขอบเขต `preferOver` ไว้กับ ID ของ Plugin ที่สามารถให้ช่องทางเดียวกันได้จริง
นี่ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อคีย์ config ของผู้ใช้

## อ้างอิง `modelSupport`

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin ผู้ให้บริการของคุณจาก
ID โมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่ runtime ของ Plugin
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

- การอ้างอิง `provider/model` แบบชัดเจนใช้ metadata ของ manifest `providers` ที่เป็นเจ้าของ
- `modelPatterns` ชนะ `modelPrefixes`
- หาก Plugin ที่ไม่ได้รวมมาให้หนึ่งตัวและ Plugin ที่รวมมาให้หนึ่งตัวตรงกันทั้งคู่ Plugin ที่ไม่ได้รวมมาให้
  จะชนะ
- ความกำกวมที่เหลือจะถูกละเว้นจนกว่าผู้ใช้หรือ config จะระบุผู้ให้บริการ

ฟิลด์:

| ฟิลด์           | ชนิด       | ความหมาย                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | คำนำหน้าที่จับคู่ด้วย `startsWith` กับ ID โมเดลแบบย่อ                 |
| `modelPatterns` | `string[]` | แหล่ง regex ที่จับคู่กับ ID โมเดลแบบย่อหลังจากลบ suffix ของโปรไฟล์แล้ว |

## อ้างอิง `modelCatalog`

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้ metadata ของโมเดลผู้ให้บริการก่อน
โหลด runtime ของ Plugin นี่คือแหล่งที่ manifest เป็นเจ้าของสำหรับแถวแค็ตตาล็อกแบบคงที่,
นามแฝงผู้ให้บริการ, กฎการระงับ, และโหมดการค้นพบ การ refresh ของ runtime
ยังเป็นหน้าที่ของโค้ด runtime ของผู้ให้บริการ แต่ manifest จะบอก core ว่าเมื่อใดจำเป็นต้องใช้ runtime

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
| `providers`    | `Record<string, object>`                                 | แถวแค็ตตาล็อกสำหรับ ID ผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ คีย์ควรปรากฏใน `providers` ระดับบนสุดด้วย       |
| `aliases`      | `Record<string, object>`                                 | นามแฝงผู้ให้บริการที่ควรถูก resolve ไปยังผู้ให้บริการที่เป็นเจ้าของสำหรับการวางแผนแค็ตตาล็อกหรือการระงับ              |
| `suppressions` | `object[]`                                               | แถวโมเดลจากแหล่งอื่นที่ Plugin นี้ระงับด้วยเหตุผลเฉพาะผู้ให้บริการ                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ระบุว่าแค็ตตาล็อกของผู้ให้บริการอ่านได้จาก metadata ของ manifest, refresh เข้าสู่ cache ได้, หรือต้องใช้ runtime |

`aliases` มีส่วนร่วมในการค้นหาความเป็นเจ้าของผู้ให้บริการสำหรับการวางแผน model-catalog
เป้าหมายของนามแฝงต้องเป็นผู้ให้บริการระดับบนสุดที่ Plugin เดียวกันเป็นเจ้าของ เมื่อรายการ
ที่กรองตามผู้ให้บริการใช้นามแฝง OpenClaw สามารถอ่าน manifest ที่เป็นเจ้าของและ
ใช้การ override API/base URL ของนามแฝงได้โดยไม่ต้องโหลด runtime ของผู้ให้บริการ
นามแฝงจะไม่ขยายรายการแค็ตตาล็อกที่ไม่ได้กรอง รายการแบบกว้างจะแสดงเฉพาะ
แถวผู้ให้บริการ canonical ที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ hook ของ runtime ผู้ให้บริการแบบเก่า `suppressBuiltInModel`
รายการการระงับจะถูกใช้เฉพาะเมื่อผู้ให้บริการเป็นของ Plugin หรือ
ประกาศเป็นคีย์ `modelCatalog.aliases` ที่ชี้ไปยังผู้ให้บริการที่เป็นเจ้าของ hook การระงับของ runtime
จะไม่ถูกเรียกระหว่างการ resolve โมเดลอีกต่อไป

ฟิลด์ผู้ให้บริการ:

| ฟิลด์     | ชนิด                     | ความหมาย                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL เริ่มต้นที่ไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้    |
| `api`     | `ModelApi`               | API adapter เริ่มต้นที่ไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่ไม่บังคับซึ่งใช้กับแค็ตตาล็อกผู้ให้บริการนี้      |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละเว้น            |

ฟิลด์โมเดล:

| ฟิลด์           | ชนิด                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID โมเดลภายในผู้ให้บริการ โดยไม่มีคำนำหน้า `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่แสดงที่ไม่บังคับ                                                      |
| `api`           | `ModelApi`                                                     | การ override API รายโมเดลที่ไม่บังคับ                                            |
| `baseUrl`       | `string`                                                       | การ override base URL รายโมเดลที่ไม่บังคับ                                       |
| `headers`       | `Record<string, string>`                                       | header แบบคงที่รายโมเดลที่ไม่บังคับ                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | รูปแบบข้อมูลที่โมเดลรับได้                                               |
| `reasoning`     | `boolean`                                                      | ระบุว่าโมเดลเปิดเผยพฤติกรรม reasoning หรือไม่                               |
| `contextWindow` | `number`                                                       | context window ดั้งเดิมของผู้ให้บริการ                                             |
| `contextTokens` | `number`                                                       | ขีดจำกัด context ของ runtime ที่มีผลซึ่งไม่บังคับเมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวน token เอาต์พุตสูงสุดเมื่อทราบ                                           |
| `cost`          | `object`                                                       | ราคาที่ไม่บังคับเป็น USD ต่อหนึ่งล้าน token รวมถึง `tieredPricing` ที่ไม่บังคับ |
| `compat`        | `object`                                                       | flag ความเข้ากันได้ที่ไม่บังคับซึ่งตรงกับความเข้ากันได้ของ config โมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะการแสดงรายการ ระงับเฉพาะเมื่อแถวต้องไม่ปรากฏเลยเท่านั้น          |
| `statusReason`  | `string`                                                       | เหตุผลที่ไม่บังคับซึ่งแสดงพร้อมสถานะที่ไม่ใช่ available                            |
| `replaces`      | `string[]`                                                     | ID โมเดลภายในผู้ให้บริการที่เก่ากว่าซึ่งโมเดลนี้แทนที่                       |
| `replacedBy`    | `string`                                                       | ID โมเดลภายในผู้ให้บริการที่ใช้แทนสำหรับแถวที่ deprecated                    |
| `tags`          | `string[]`                                                     | tag ที่เสถียรซึ่งใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์การระงับ:

| ฟิลด์                      | ชนิด       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID ผู้ให้บริการสำหรับแถว upstream ที่จะระงับ ต้องเป็นของ Plugin นี้หรือประกาศเป็นนามแฝงที่เป็นเจ้าของ |
| `model`                    | `string`   | ID โมเดลภายในผู้ให้บริการที่จะระงับ                                                                      |
| `reason`                   | `string`   | ข้อความที่ไม่บังคับซึ่งแสดงเมื่อมีการร้องขอแถวที่ถูกระงับโดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายการ host ของ base URL ผู้ให้บริการที่มีผลซึ่งไม่บังคับ และจำเป็นก่อนที่การระงับจะมีผล               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของ provider-config แบบตรงตัวที่ไม่บังคับ และจำเป็นก่อนที่การระงับจะมีผล              |

อย่าใส่ข้อมูลที่ใช้เฉพาะรันไทม์ไว้ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อแถวในไฟล์ประกาศรายการสมบูรณ์พอให้พื้นผิวรายการและตัวเลือกที่กรองตามผู้ให้บริการข้ามการค้นพบผ่านรีจิสทรี/รันไทม์ได้ ใช้ `refreshable` เมื่อแถวในไฟล์ประกาศรายการมีประโยชน์ในฐานะเมล็ดข้อมูลหรือข้อมูลเสริมที่แสดงเป็นรายการได้ แต่การรีเฟรช/แคชสามารถเพิ่มแถวเพิ่มเติมภายหลังได้ แถวแบบ refreshable ไม่ใช่แหล่งอ้างอิงที่มีอำนาจในตัวเอง ใช้ `runtime` เมื่อ OpenClaw ต้องโหลดรันไทม์ของผู้ให้บริการเพื่อทราบรายการ

## ข้อมูลอ้างอิง modelIdNormalization

ใช้ `modelIdNormalization` สำหรับการล้างรหัสโมเดลราคาถูกที่ผู้ให้บริการเป็นเจ้าของ และต้องเกิดขึ้นก่อนรันไทม์ของผู้ให้บริการโหลด วิธีนี้ทำให้นามแฝง เช่น ชื่อโมเดลแบบสั้น รหัสเดิมภายในผู้ให้บริการ และกฎคำนำหน้าของพร็อกซี อยู่ในไฟล์ประกาศรายการของ Plugin เจ้าของ แทนที่จะอยู่ในตารางการเลือกโมเดลของแกนกลาง

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

| ฟิลด์                                | ชนิด                    | ความหมาย                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | นามแฝงรหัสโมเดลที่ตรงกันแบบเป๊ะโดยไม่สนตัวพิมพ์ใหญ่เล็ก ค่าจะถูกส่งคืนตามที่เขียนไว้                  |
| `stripPrefixes`                      | `string[]`              | คำนำหน้าที่ต้องลบออกก่อนค้นหานามแฝง มีประโยชน์สำหรับการซ้ำซ้อนของผู้ให้บริการ/โมเดลแบบเดิม     |
| `prefixWhenBare`                     | `string`                | คำนำหน้าที่ต้องเพิ่มเมื่อรหัสโมเดลที่ปรับมาตรฐานแล้วไม่มี `/` อยู่ก่อน                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎคำนำหน้ารหัสเปล่าแบบมีเงื่อนไขหลังค้นหานามแฝง โดยอิง `modelPrefix` และ `prefix` |

## ข้อมูลอ้างอิง providerEndpoints

ใช้ `providerEndpoints` สำหรับการจัดประเภทปลายทางที่นโยบายคำขอทั่วไปต้องทราบก่อนรันไทม์ของผู้ให้บริการโหลด แกนกลางยังคงเป็นเจ้าของความหมายของแต่ละ `endpointClass`; ไฟล์ประกาศรายการของ Plugin เป็นเจ้าของเมทาดาทาโฮสต์และ URL ฐาน

ฟิลด์ของปลายทาง:

| ฟิลด์                          | ชนิด       | ความหมาย                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาสปลายทางแกนกลางที่รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`        |
| `hosts`                        | `string[]` | ชื่อโฮสต์แบบตรงตัวที่แมปกับคลาสปลายทาง                                                |
| `hostSuffixes`                 | `string[]` | ส่วนต่อท้ายโฮสต์ที่แมปกับคลาสปลายทาง เติม `.` นำหน้าเพื่อจับคู่เฉพาะส่วนต่อท้ายโดเมน |
| `baseUrls`                     | `string[]` | URL ฐาน HTTP(S) ที่ปรับมาตรฐานแล้วแบบตรงตัวซึ่งแมปกับคลาสปลายทาง                             |
| `googleVertexRegion`           | `string`   | ภูมิภาค Google Vertex แบบคงที่สำหรับโฮสต์ส่วนกลางแบบตรงตัว                                            |
| `googleVertexRegionHostSuffix` | `string`   | ส่วนต่อท้ายที่จะตัดออกจากโฮสต์ที่ตรงกันเพื่อเปิดเผยคำนำหน้าภูมิภาค Google Vertex                 |

## ข้อมูลอ้างอิง providerRequest

ใช้ `providerRequest` สำหรับเมทาดาทาความเข้ากันได้ของคำขอแบบราคาถูกที่นโยบายคำขอทั่วไปต้องใช้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ เก็บการเขียน payload ใหม่ที่เจาะจงพฤติกรรมไว้ในฮุกของรันไทม์ผู้ให้บริการหรือตัวช่วยร่วมของตระกูลผู้ให้บริการ

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

| ฟิลด์                 | ชนิด         | ความหมาย                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายกำกับตระกูลผู้ให้บริการที่ใช้ในการตัดสินใจและวินิจฉัยความเข้ากันได้ของคำขอทั่วไป |
| `compatibilityFamily` | `"moonshot"` | กลุ่มความเข้ากันได้ของตระกูลผู้ให้บริการแบบไม่บังคับสำหรับตัวช่วยคำขอร่วม              |
| `openAICompletions`   | `object`     | แฟล็กคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage`       |

## ข้อมูลอ้างอิง modelPricing

ใช้ `modelPricing` เมื่อผู้ให้บริการต้องควบคุมพฤติกรรมราคาของ control plane ก่อนรันไทม์โหลด แคชราคาของ Gateway อ่านเมทาดาทานี้โดยไม่ต้องนำเข้าโค้ดรันไทม์ของผู้ให้บริการ

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

| ฟิลด์        | ชนิด              | ความหมาย                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | ตั้งค่าเป็น `false` สำหรับผู้ให้บริการภายในเครื่อง/โฮสต์เองที่ไม่ควรดึงราคา OpenRouter หรือ LiteLLM |
| `openRouter` | `false \| object` | การแมปการค้นหาราคา OpenRouter `false` ปิดการค้นหา OpenRouter สำหรับผู้ให้บริการนี้           |
| `liteLLM`    | `false \| object` | การแมปการค้นหาราคา LiteLLM `false` ปิดการค้นหา LiteLLM สำหรับผู้ให้บริการนี้                 |

ฟิลด์ของแหล่งที่มา:

| ฟิลด์                      | ชนิด               | ความหมาย                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | รหัสผู้ให้บริการในแค็ตตาล็อกภายนอกเมื่อแตกต่างจากรหัสผู้ให้บริการของ OpenClaw เช่น `z-ai` สำหรับผู้ให้บริการ `zai` |
| `passthroughProviderModel` | `boolean`          | ปฏิบัติต่อรหัสโมเดลที่มีเครื่องหมายทับเป็นการอ้างอิงผู้ให้บริการ/โมเดลแบบซ้อน มีประโยชน์สำหรับผู้ให้บริการพร็อกซี เช่น OpenRouter       |
| `modelIdTransforms`        | `"version-dots"[]` | ตัวแปรรหัสโมเดลในแค็ตตาล็อกภายนอกเพิ่มเติม `version-dots` ลองใช้รหัสเวอร์ชันแบบมีจุด เช่น `claude-opus-4.6`            |

### ดัชนีผู้ให้บริการของ OpenClaw

ดัชนีผู้ให้บริการของ OpenClaw คือเมทาดาทาแบบพรีวิวที่ OpenClaw เป็นเจ้าของสำหรับผู้ให้บริการที่ Plugin อาจยังไม่ได้ติดตั้ง ดัชนีนี้ไม่ใช่ส่วนหนึ่งของไฟล์ประกาศรายการของ Plugin ไฟล์ประกาศรายการของ Plugin ยังคงเป็นแหล่งอ้างอิงที่มีอำนาจสำหรับ Plugin ที่ติดตั้งแล้ว ดัชนีผู้ให้บริการคือสัญญาสำรองภายในที่พื้นผิวตัวเลือกโมเดลสำหรับผู้ให้บริการที่ติดตั้งได้ในอนาคตและก่อนติดตั้งจะใช้เมื่อยังไม่ได้ติดตั้ง Plugin ของผู้ให้บริการ

ลำดับอำนาจของแค็ตตาล็อก:

1. การกำหนดค่าของผู้ใช้
2. `modelCatalog` ในไฟล์ประกาศรายการของ Plugin ที่ติดตั้งแล้ว
3. แค็ตตาล็อกโมเดลจากการรีเฟรชอย่างชัดเจน
4. แถวพรีวิวจากดัชนีผู้ให้บริการของ OpenClaw

ดัชนีผู้ให้บริการต้องไม่มีความลับ สถานะเปิดใช้งาน ฮุกรันไทม์ หรือข้อมูลโมเดลสดเฉพาะบัญชี แค็ตตาล็อกพรีวิวของดัชนีใช้รูปทรงแถวผู้ให้บริการของ `modelCatalog` แบบเดียวกับไฟล์ประกาศรายการของ Plugin แต่ควรจำกัดไว้ที่เมทาดาทาการแสดงผลที่เสถียร เว้นแต่ฟิลด์ของอะแดปเตอร์รันไทม์ เช่น `api`, `baseUrl`, ราคา หรือแฟล็กความเข้ากันได้ จะถูกตั้งใจให้สอดคล้องกับไฟล์ประกาศรายการของ Plugin ที่ติดตั้งแล้ว ผู้ให้บริการที่มีการค้นพบ `/models` แบบสดควรเขียนแถวที่รีเฟรชแล้วผ่านเส้นทางแคชแค็ตตาล็อกโมเดลแบบชัดเจน แทนที่จะให้การแสดงรายการปกติหรือการเริ่มต้นใช้งานเรียก API ของผู้ให้บริการ

รายการในดัชนีผู้ให้บริการอาจมีเมทาดาทา Plugin ที่ติดตั้งได้สำหรับผู้ให้บริการที่ Plugin ถูกย้ายออกจากแกนกลางหรือยังไม่ได้ติดตั้งด้วย เมทาดาทานี้สะท้อนรูปแบบแค็ตตาล็อกช่องทาง: ชื่อแพ็กเกจ สเปกการติดตั้ง npm ค่า integrity ที่คาดไว้ และป้ายกำกับตัวเลือกการยืนยันตัวตนแบบราคาถูก เพียงพอสำหรับแสดงตัวเลือกการตั้งค่าที่ติดตั้งได้ เมื่อ Plugin ถูกติดตั้งแล้ว ไฟล์ประกาศรายการของ Plugin จะชนะ และรายการดัชนีผู้ให้บริการจะถูกละเว้นสำหรับผู้ให้บริการนั้น

คีย์ความสามารถระดับบนสุดแบบเดิมเลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อย้าย `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลดไฟล์ประกาศรายการตามปกติจะไม่ถือว่าฟิลด์ระดับบนสุดเหล่านั้นเป็นเจ้าของความสามารถอีกต่อไป

## ไฟล์ประกาศรายการเทียบกับ package.json

ไฟล์ทั้งสองทำหน้าที่ต่างกัน:

| ไฟล์                   | ใช้สำหรับ                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ การตรวจสอบการกำหนดค่า เมทาดาทาตัวเลือกการยืนยันตัวตน และคำใบ้ UI ที่ต้องมีอยู่ก่อนโค้ด Plugin ทำงาน                         |
| `package.json`         | เมทาดาทา npm การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับจุดเข้าใช้งาน การกั้นการติดตั้ง การตั้งค่า หรือเมทาดาทาแค็ตตาล็อก |

หากไม่แน่ใจว่าเมทาดาทาชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- หาก OpenClaw ต้องรู้ข้อมูลนั้นก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- หากข้อมูลนั้นเกี่ยวกับการทำแพ็กเกจ ไฟล์จุดเข้าใช้งาน หรือพฤติกรรมการติดตั้ง npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่มีผลต่อการค้นพบ

เมทาดาทา Plugin บางส่วนก่อนรันไทม์จงใจอยู่ใน `package.json` ใต้บล็อก `openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`
`openclaw.bundle` และ `openclaw.bundle.json` ไม่ใช่สัญญา Plugin ของ OpenClaw;
Plugin แบบเนทีฟต้องใช้ `openclaw.plugin.json` ร่วมกับฟิลด์ `package.json#openclaw` ที่รองรับด้านล่าง

ตัวอย่างสำคัญ:

| ฟิลด์                                                                                      | ความหมาย                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ประกาศจุดเข้าใช้งาน Plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | ประกาศจุดเข้าใช้งานรันไทม์ JavaScript ที่สร้างแล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น                                                                 |
| `openclaw.setupEntry`                                                                      | จุดเข้าใช้งานแบบเบาสำหรับการตั้งค่าเท่านั้น ใช้ระหว่างการเริ่มต้นใช้งาน การเริ่มช่องทางแบบเลื่อนเวลา และสถานะช่องทางแบบอ่านอย่างเดียว/การค้นพบ SecretRef ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น |
| `openclaw.runtimeSetupEntry`                                                               | ประกาศจุดเข้าใช้งานการตั้งค่า JavaScript ที่สร้างแล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องมี `setupEntry` ต้องมีอยู่จริง และต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin                         |
| `openclaw.channel`                                                                         | เมทาดาทาแค็ตตาล็อกช่องทางแบบราคาถูก เช่น ป้ายกำกับ พาธเอกสาร นามแฝง และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                                                | เมทาดาทาคำสั่งเนทีฟแบบสแตติกและค่าเริ่มต้นอัตโนมัติของ Skills เนทีฟที่ใช้โดยพื้นผิว config, audit และรายการคำสั่งก่อนที่รันไทม์ช่องทางจะโหลด                                          |
| `openclaw.channel.configuredState`                                                         | เมทาดาทาตัวตรวจสอบสถานะที่กำหนดค่าแล้วแบบเบา ซึ่งตอบได้ว่า "มีการตั้งค่าแบบ env-only อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางทั้งหมด                                         |
| `openclaw.channel.persistedAuthState`                                                      | เมทาดาทาตัวตรวจสอบการยืนยันตัวตนที่คงอยู่แบบเบา ซึ่งตอบได้ว่า "มีอะไรที่ลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางทั้งหมด                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | คำแนะนำการติดตั้ง/อัปเดตสำหรับ Plugin ที่รวมมากับระบบและ Plugin ที่เผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | พาธการติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้ใช้                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | เวอร์ชันโฮสต์ OpenClaw ขั้นต่ำที่รองรับ โดยใช้ค่าฐาน semver เช่น `>=2026.3.22` หรือ `>=2026.5.1-beta.1`                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | สตริง npm dist integrity ที่คาดไว้ เช่น `sha512-...`; โฟลว์ติดตั้งและอัปเดตจะตรวจสอบอาร์ทิแฟกต์ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | อนุญาตพาธกู้คืนการติดตั้ง Plugin ที่รวมมากับระบบในขอบเขตแคบเมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | ทำให้พื้นผิวช่องทางแบบตั้งค่าเท่านั้นโหลดได้ก่อน Plugin ช่องทางเต็มระหว่างการเริ่มต้นระบบ                                                                                                 |

เมทาดาทา manifest เป็นตัวตัดสินว่าตัวเลือกผู้ให้บริการ/ช่องทาง/การตั้งค่าใดจะปรากฏใน
การเริ่มต้นใช้งานก่อนที่รันไทม์จะโหลด `package.json#openclaw.install` บอก
การเริ่มต้นใช้งานว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้ายคำแนะนำการติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` จะถูกบังคับใช้ระหว่างการติดตั้งและการโหลด
รีจิสทรี manifest สำหรับแหล่ง Plugin ที่ไม่ได้รวมมากับระบบ ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ;
ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม Plugin ภายนอกบนโฮสต์รุ่นเก่า แหล่ง Plugin ที่รวมมากับระบบ
จะถือว่ามีเวอร์ชันร่วมกับ checkout ของโฮสต์

เมทาดาทา install-on-demand อย่างเป็นทางการควรใช้ `clawhubSpec` เมื่อ Plugin
เผยแพร่บน ClawHub; การเริ่มต้นใช้งานจะถือว่าสิ่งนี้เป็นแหล่งรีโมตที่ต้องการและ
บันทึกข้อเท็จจริงของอาร์ทิแฟกต์ ClawHub หลังติดตั้ง `npmSpec` ยังคงเป็นตัวสำรองด้านความเข้ากันได้
สำหรับแพ็กเกจที่ยังไม่ได้ย้ายไป ClawHub

การตรึงเวอร์ชัน npm แบบเจาะจงอยู่ใน `npmSpec` อยู่แล้ว เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการแค็ตตาล็อกภายนอกอย่างเป็นทางการ
ควรจับคู่สเปกแบบเจาะจงกับ `expectedIntegrity` เพื่อให้โฟลว์อัปเดตล้มเหลวแบบปิด
หากอาร์ทิแฟกต์ npm ที่ดึงมาไม่ตรงกับรุ่นที่ตรึงไว้อีกต่อไป
การเริ่มต้นใช้งานแบบโต้ตอบยังคงเสนอ trusted registry npm specs รวมถึงชื่อแพ็กเกจเปล่า
และ dist-tags เพื่อความเข้ากันได้ การวินิจฉัยแค็ตตาล็อกสามารถแยกแยะ
แหล่งที่มาแบบเจาะจง แบบลอยตัว แบบตรึง integrity แบบไม่มี integrity แบบชื่อแพ็กเกจ
ไม่ตรงกัน และ default-choice ที่ไม่ถูกต้องได้ และยังเตือนเมื่อ
มี `expectedIntegrity` แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ตรึงได้
เมื่อมี `expectedIntegrity`
โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้ค่านี้; เมื่อไม่ได้ระบุไว้ การแก้ไขรีจิสทรีจะถูก
บันทึกโดยไม่มีการตรึง integrity

Plugin ช่องทางควรระบุ `openclaw.setupEntry` เมื่อสถานะ รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่กำหนดค่าแล้วโดยไม่โหลดรันไทม์ทั้งหมด
จุดเข้าใช้งานการตั้งค่าควรเปิดเผยเมทาดาทาช่องทางรวมถึงอะแดปเตอร์ config,
status และ secrets ที่ปลอดภัยสำหรับการตั้งค่า; ให้เก็บไคลเอนต์เครือข่าย ตัวรับฟัง Gateway และ
รันไทม์การขนส่งไว้ในจุดเข้าใช้งานส่วนขยายหลัก

ฟิลด์จุดเข้าใช้งานรันไทม์ไม่ได้แทนที่การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
จุดเข้าใช้งานซอร์ส ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกตั้งใจให้มีขอบเขตแคบ
มันไม่ได้ทำให้ config ที่เสียหายใดๆ ติดตั้งได้ วันนี้มันอนุญาตเฉพาะให้โฟลว์ติดตั้ง
กู้คืนจากความล้มเหลวการอัปเกรด Plugin ที่รวมมากับระบบบางกรณี เช่น
พาธ Plugin ที่รวมมากับระบบขาดหาย หรือรายการ `channels.<id>` ที่ค้างสำหรับ
Plugin ที่รวมมากับระบบเดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ปฏิบัติการ
ไปที่ `openclaw doctor --fix`

`openclaw.channel.persistedAuthState` คือเมทาดาทาแพ็กเกจสำหรับโมดูลตัวตรวจสอบขนาดเล็ก:

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

ใช้เมื่อตั้งค่า doctor สถานะ หรือโฟลว์ presence แบบอ่านอย่างเดียวต้องการ probe การยืนยันตัวตนแบบ
ใช่/ไม่ใช่ที่ราคาถูกก่อนที่ Plugin ช่องทางเต็มจะโหลด สถานะการยืนยันตัวตนที่คงอยู่ไม่ใช่
สถานะช่องทางที่กำหนดค่าแล้ว: อย่าใช้เมทาดาทานี้เพื่อเปิดใช้ Plugin อัตโนมัติ
ซ่อมแซม dependency ของรันไทม์ หรือตัดสินใจว่ารันไทม์ช่องทางควรโหลดหรือไม่
export เป้าหมายควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะสถานะที่คงอยู่; อย่า
ส่งผ่านไปยัง barrel ของรันไทม์ช่องทางเต็ม

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบการกำหนดค่าแบบ env-only
ที่ราคาถูก:

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

ใช้เมื่อช่องทางสามารถตอบสถานะที่กำหนดค่าแล้วจาก env หรืออินพุตขนาดเล็กอื่นๆ
ที่ไม่ใช่รันไทม์ หากการตรวจสอบต้องใช้การแก้ไข config เต็มรูปแบบหรือรันไทม์ช่องทางจริง
ให้เก็บตรรกะนั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญการค้นพบ (รหัส Plugin ซ้ำ)

OpenClaw ค้นพบ Plugin จาก root หลายแห่ง (ที่รวมมากับระบบ การติดตั้งส่วนกลาง workspace พาธที่เลือกผ่าน config โดยชัดแจ้ง) หากการค้นพบสองรายการมี `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด**; รายการซ้ำที่มีลำดับความสำคัญต่ำกว่าจะถูกทิ้งแทนที่จะโหลดเคียงข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **เลือกผ่าน config** — พาธที่ตรึงไว้อย่างชัดแจ้งใน `plugins.entries.<id>`
2. **รวมมากับระบบ** — Plugin ที่จัดส่งมากับ OpenClaw
3. **การติดตั้งส่วนกลาง** — Plugin ที่ติดตั้งลงใน root Plugin ส่วนกลางของ OpenClaw
4. **Workspace** — Plugin ที่ค้นพบโดยอิงกับ workspace ปัจจุบัน

ผลที่ตามมา:

- สำเนา Plugin ที่รวมมากับระบบที่ fork หรือค้างอยู่ใน workspace จะไม่บัง build ที่รวมมากับระบบ
- หากต้องการแทนที่ Plugin ที่รวมมากับระบบด้วยตัว local จริงๆ ให้ตรึงผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนที่จะพึ่งพาการค้นพบใน workspace
- การทิ้งรายการซ้ำจะถูกบันทึกใน log เพื่อให้ Doctor และการวินิจฉัยตอนเริ่มระบบชี้ไปยังสำเนาที่ถูกละทิ้งได้
- การแทนที่รายการซ้ำที่เลือกผ่าน config จะถูกเขียนในคำวินิจฉัยว่าเป็นการแทนที่อย่างชัดแจ้ง แต่ยังคงเตือนเพื่อให้ fork ที่ค้างและการบังโดยไม่ตั้งใจยังมองเห็นได้

## ข้อกำหนด JSON Schema

- **Plugin ทุกตัวต้องจัดส่ง JSON Schema** แม้ว่าจะไม่รับ config ก็ตาม
- schema ว่างเป็นสิ่งที่ยอมรับได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema จะถูกตรวจสอบความถูกต้องในเวลาที่อ่าน/เขียน config ไม่ใช่ที่รันไทม์
- เมื่อขยายหรือ fork Plugin ที่รวมมากับระบบด้วยคีย์ config ใหม่ ให้อัปเดต `configSchema` ใน `openclaw.plugin.json` ของ Plugin นั้นพร้อมกัน schema ของ Plugin ที่รวมมากับระบบเป็นแบบเข้มงวด ดังนั้นการเพิ่ม `plugins.entries.<id>.config.myNewKey` ใน config ผู้ใช้โดยไม่เพิ่ม `myNewKey` ลงใน `configSchema.properties` จะถูกปฏิเสธก่อนที่รันไทม์ Plugin จะโหลด

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

- คีย์ `channels.*` ที่ไม่รู้จักเป็น **ข้อผิดพลาด** เว้นแต่ id ช่องทางจะถูกประกาศโดย
  manifest ของ Plugin
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` และ `plugins.slots.*`
  ต้องอ้างอิง id Plugin ที่ **ค้นพบได้** id ที่ไม่รู้จักเป็น **ข้อผิดพลาด**
- หาก Plugin ถูกติดตั้งแต่มี manifest หรือ schema ที่เสียหายหรือขาดหาย
  การตรวจสอบความถูกต้องจะล้มเหลวและ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin อยู่แต่ Plugin ถูก **ปิดใช้งาน** config จะถูกเก็บไว้และ
  **คำเตือน** จะแสดงใน Doctor + logs

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema `plugins.*` ฉบับเต็ม

## หมายเหตุ

- แมนิเฟสต์เป็นสิ่งที่**จำเป็นสำหรับ Plugin OpenClaw แบบเนทีฟ** รวมถึงการโหลดจากระบบไฟล์ภายในเครื่อง รันไทม์ยังคงโหลดโมดูล Plugin แยกต่างหาก ส่วนแมนิเฟสต์ใช้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น
- แมนิเฟสต์แบบเนทีฟจะถูกแยกวิเคราะห์ด้วย JSON5 ดังนั้นจึงรองรับความคิดเห็น จุลภาคท้ายรายการ และคีย์ที่ไม่ใส่เครื่องหมายอัญประกาศ ตราบใดที่ค่าสุดท้ายยังเป็นออบเจ็กต์
- ตัวโหลดแมนิเฟสต์จะอ่านเฉพาะฟิลด์แมนิเฟสต์ที่มีเอกสารกำกับไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- `channels`, `providers`, `cliBackends`, และ `skills` สามารถละไว้ทั้งหมดได้เมื่อ Plugin ไม่ต้องใช้
- `providerDiscoveryEntry` ต้องคงไว้ให้เบา และไม่ควรนำเข้าโค้ดรันไทม์ในวงกว้าง ใช้สำหรับเมทาดาทาแคตตาล็อกผู้ให้บริการแบบคงที่ หรือตัวอธิบายการค้นพบแบบแคบ ไม่ใช่การดำเนินการในเวลาที่มีคำขอ
- ชนิด Plugin แบบเอกสิทธิ์จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- ประกาศชนิด Plugin แบบเอกสิทธิ์ในแมนิเฟสต์นี้ `OpenClawPluginDefinition.kind` ของรายการเข้ารันไทม์เลิกใช้แล้ว และยังคงอยู่เป็นตัวสำรองเพื่อความเข้ากันได้สำหรับ Plugin รุ่นเก่าเท่านั้น
- เมทาดาทาตัวแปรสภาพแวดล้อม (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว, และ `channelEnvVars`) เป็นแบบประกาศเท่านั้น สถานะ การตรวจสอบ การตรวจสอบความถูกต้องของการส่งผ่าน cron และพื้นผิวแบบอ่านอย่างเดียวอื่นๆ ยังคงใช้นโยบายความเชื่อถือ Plugin และการเปิดใช้งานจริงก่อนถือว่าตัวแปรสภาพแวดล้อมหนึ่งถูกกำหนดค่าแล้ว
- สำหรับเมทาดาทาตัวช่วยตั้งค่ารันไทม์ที่ต้องใช้โค้ดผู้ให้บริการ โปรดดู [ฮุกรันไทม์ของผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณพึ่งพาโมดูลเนทีฟ ให้จัดทำเอกสารขั้นตอนการบิลด์และข้อกำหนดรายการอนุญาตของตัวจัดการแพ็กเกจใดๆ (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="Building plugins" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin
  </Card>
  <Card title="Plugin architecture" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ
  </Card>
  <Card title="SDK overview" href="/th/plugins/sdk-overview" icon="book">
    ข้อมูลอ้างอิง Plugin SDK และการนำเข้าเส้นทางย่อย
  </Card>
</CardGroup>
