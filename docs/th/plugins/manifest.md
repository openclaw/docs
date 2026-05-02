---
read_when:
    - คุณกำลังสร้าง Plugin สำหรับ OpenClaw
    - คุณต้องส่งมอบสคีมาการกำหนดค่าของ Plugin หรือดีบักข้อผิดพลาดในการตรวจสอบ Plugin
summary: ข้อกำหนดของแมนิเฟสต์ Plugin + สคีมา JSON (การตรวจสอบความถูกต้องของการกำหนดค่าแบบเข้มงวด)
title: แมนิเฟสต์ของ Plugin
x-i18n:
    generated_at: "2026-05-02T10:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

หน้านี้มีไว้สำหรับ **แมนิเฟสต์ Plugin OpenClaw แบบเนทีฟ** เท่านั้น

สำหรับเลย์เอาต์บันเดิลที่เข้ากันได้ โปรดดู [บันเดิล Plugin](/th/plugins/bundles)

รูปแบบบันเดิลที่เข้ากันได้ใช้ไฟล์แมนิเฟสต์ที่แตกต่างกัน:

- บันเดิล Codex: `.codex-plugin/plugin.json`
- บันเดิล Claude: `.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น
  ที่ไม่มีแมนิเฟสต์
- บันเดิล Cursor: `.cursor-plugin/plugin.json`

OpenClaw ตรวจพบเลย์เอาต์บันเดิลเหล่านั้นโดยอัตโนมัติด้วย แต่ไม่ได้ตรวจสอบ
เทียบกับสคีมา `openclaw.plugin.json` ที่อธิบายไว้ที่นี่

สำหรับบันเดิลที่เข้ากันได้ ปัจจุบัน OpenClaw อ่านเมทาดาทาของบันเดิลพร้อมกับราก
skill ที่ประกาศไว้ รากคำสั่ง Claude ค่าเริ่มต้น `settings.json` ของบันเดิล
Claude ค่าเริ่มต้น LSP ของบันเดิล Claude และแพ็ก hook ที่รองรับเมื่อเลย์เอาต์ตรงกับ
ความคาดหวังของรันไทม์ OpenClaw

Plugin OpenClaw แบบเนทีฟทุกตัว **ต้อง** มาพร้อมไฟล์ `openclaw.plugin.json` ใน
**ราก Plugin** OpenClaw ใช้แมนิเฟสต์นี้เพื่อตรวจสอบการกำหนดค่า
**โดยไม่เรียกใช้โค้ด Plugin** แมนิเฟสต์ที่ขาดหายหรือไม่ถูกต้องจะถูกจัดเป็น
ข้อผิดพลาดของ Plugin และบล็อกการตรวจสอบการกำหนดค่า

ดูคู่มือระบบ Plugin ฉบับเต็ม: [Plugin](/th/tools/plugin)
สำหรับโมเดลความสามารถแบบเนทีฟและแนวทางความเข้ากันได้ภายนอกในปัจจุบัน:
[โมเดลความสามารถ](/th/plugins/architecture#public-capability-model)

## ไฟล์นี้ทำอะไร

`openclaw.plugin.json` คือเมทาดาทาที่ OpenClaw อ่าน **ก่อนโหลดโค้ด
Plugin ของคุณ** ทุกอย่างด้านล่างต้องมีต้นทุนต่ำพอที่จะตรวจสอบได้โดยไม่ต้องบูต
รันไทม์ Plugin

**ใช้สำหรับ:**

- เอกลักษณ์ Plugin, การตรวจสอบการกำหนดค่า และคำใบ้ UI การกำหนดค่า
- เมทาดาทาการยืนยันตัวตน การเริ่มใช้งาน และการตั้งค่า (นามแฝง เปิดใช้อัตโนมัติ ตัวแปร env ของผู้ให้บริการ ตัวเลือกการยืนยันตัวตน)
- คำใบ้การเปิดใช้งานสำหรับพื้นผิว control-plane
- ความเป็นเจ้าของแบบย่อของตระกูลโมเดล
- สแนปช็อตความเป็นเจ้าของความสามารถแบบคงที่ (`contracts`)
- เมทาดาทา QA runner ที่โฮสต์ `openclaw qa` ที่ใช้ร่วมกันสามารถตรวจสอบได้
- เมทาดาทาการกำหนดค่าเฉพาะแชนเนลที่ผสานเข้าในแค็ตตาล็อกและพื้นผิวการตรวจสอบ

**อย่าใช้สำหรับ:** การลงทะเบียนพฤติกรรมรันไทม์ การประกาศ entrypoint ของโค้ด
หรือเมทาดาทาการติดตั้ง npm สิ่งเหล่านี้ควรอยู่ในโค้ด Plugin ของคุณและ `package.json`

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

| ฟิลด์                                | จำเป็น | ประเภท                             | ความหมาย                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | ใช่      | `string`                         | รหัส Plugin ตามแบบแผน นี่คือรหัสที่ใช้ใน `plugins.entries.<id>`                                                                                                                                                                 |
| `configSchema`                       | ใช่      | `object`                         | JSON Schema แบบฝังในบรรทัดสำหรับการกำหนดค่าของ Plugin นี้                                                                                                                                                                                        |
| `enabledByDefault`                   | ไม่       | `true`                           | ทำเครื่องหมาย Plugin ที่มาพร้อมชุดให้เปิดใช้งานตามค่าเริ่มต้น ละไว้ หรือตั้งค่าเป็นค่าที่ไม่ใช่ `true` เพื่อปล่อยให้ Plugin ปิดใช้งานตามค่าเริ่มต้น                                                                                                        |
| `legacyPluginIds`                    | ไม่       | `string[]`                       | รหัสดั้งเดิมที่ปรับให้อยู่ในรูปแบบเดียวกับรหัส Plugin ตามแบบแผนนี้                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | ไม่       | `string[]`                       | รหัสผู้ให้บริการที่ควรเปิดใช้งาน Plugin นี้โดยอัตโนมัติเมื่อการยืนยันตัวตน การกำหนดค่า หรือการอ้างอิงโมเดลกล่าวถึงรหัสเหล่านั้น                                                                                                                                     |
| `kind`                               | ไม่       | `"memory"` \| `"context-engine"` | ประกาศชนิด Plugin แบบเอกสิทธิ์ที่ใช้โดย `plugins.slots.*`                                                                                                                                                                        |
| `channels`                           | ไม่       | `string[]`                       | รหัสช่องทางที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการค้นพบและการตรวจสอบความถูกต้องของการกำหนดค่า                                                                                                                                                         |
| `providers`                          | ไม่       | `string[]`                       | รหัสผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | ไม่       | `string`                         | เส้นทางโมดูลค้นพบผู้ให้บริการขนาดเบา ซึ่งสัมพันธ์กับรูทของ Plugin สำหรับเมทาดาทาแค็ตตาล็อกผู้ให้บริการที่อยู่ในขอบเขตเมนิเฟสต์ ซึ่งโหลดได้โดยไม่ต้องเปิดใช้งานรันไทม์ Plugin แบบเต็ม                                               |
| `modelSupport`                       | ไม่       | `object`                         | เมทาดาทาแบบย่อของตระกูลโมเดลที่เมนิเฟสต์เป็นเจ้าของ ใช้เพื่อโหลด Plugin โดยอัตโนมัติก่อนรันไทม์                                                                                                                                         |
| `modelCatalog`                       | ไม่       | `object`                         | เมทาดาทาแค็ตตาล็อกโมเดลเชิงประกาศสำหรับผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ นี่คือสัญญาระดับแผงควบคุมสำหรับการแสดงรายการแบบอ่านอย่างเดียวในอนาคต การเริ่มต้นใช้งาน ตัวเลือกโมเดล นามแฝง และการระงับโดยไม่ต้องโหลดรันไทม์ Plugin         |
| `modelPricing`                       | ไม่       | `object`                         | นโยบายค้นหาราคาภายนอกที่ผู้ให้บริการเป็นเจ้าของ ใช้เพื่อยกเว้นผู้ให้บริการภายในเครื่องหรือที่โฮสต์เองออกจากแค็ตตาล็อกราคาระยะไกล หรือแมปการอ้างอิงผู้ให้บริการกับรหัสแค็ตตาล็อก OpenRouter/LiteLLM โดยไม่ฮาร์ดโค้ดรหัสผู้ให้บริการในแกนหลัก             |
| `modelIdNormalization`               | ไม่       | `object`                         | การล้างนามแฝง/คำนำหน้าของรหัสโมเดลที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้องทำงานก่อนที่รันไทม์ผู้ให้บริการจะโหลด                                                                                                                                           |
| `providerEndpoints`                  | ไม่       | `object[]`                       | เมทาดาทาโฮสต์ปลายทาง/baseUrl ที่เมนิเฟสต์เป็นเจ้าของสำหรับเส้นทางผู้ให้บริการ ซึ่งแกนหลักต้องจัดประเภทก่อนที่รันไทม์ผู้ให้บริการจะโหลด                                                                                                            |
| `providerRequest`                    | ไม่       | `object`                         | เมทาดาทาตระกูลผู้ให้บริการและความเข้ากันได้ของคำขอแบบต้นทุนต่ำ ใช้โดยนโยบายคำขอทั่วไปก่อนที่รันไทม์ผู้ให้บริการจะโหลด                                                                                                              |
| `cliBackends`                        | ไม่       | `string[]`                       | รหัสแบ็กเอนด์การอนุมาน CLI ที่ Plugin นี้เป็นเจ้าของ ใช้สำหรับการเปิดใช้งานอัตโนมัติเมื่อเริ่มต้นจากการอ้างอิงการกำหนดค่าอย่างชัดเจน                                                                                                                         |
| `syntheticAuthRefs`                  | ไม่       | `string[]`                       | การอ้างอิงผู้ให้บริการหรือแบ็กเอนด์ CLI ที่ควรตรวจสอบฮุกการยืนยันตัวตนสังเคราะห์ที่ Plugin เป็นเจ้าของ ระหว่างการค้นพบโมเดลแบบเริ่มเย็นก่อนที่รันไทม์จะโหลด                                                                                              |
| `nonSecretAuthMarkers`               | ไม่       | `string[]`                       | ค่าคีย์ API ตัวยึดตำแหน่งที่ Plugin ที่มาพร้อมชุดเป็นเจ้าของ ซึ่งแทนสถานะข้อมูลประจำตัวแบบไม่เป็นความลับภายในเครื่อง OAuth หรือจากสภาพแวดล้อม                                                                                                                |
| `commandAliases`                     | ไม่       | `object[]`                       | ชื่อคำสั่งที่ Plugin นี้เป็นเจ้าของ ซึ่งควรสร้างการวินิจฉัยการกำหนดค่าและ CLI ที่รับรู้ Plugin ก่อนที่รันไทม์จะโหลด                                                                                                                |
| `providerAuthEnvVars`                | ไม่       | `Record<string, string[]>`       | เมทาดาทาสภาพแวดล้อมเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับการค้นหาการยืนยันตัวตน/สถานะของผู้ให้บริการ แนะนำให้ใช้ `setup.providers[].envVars` สำหรับ Plugin ใหม่ OpenClaw ยังอ่านค่านี้ระหว่างช่วงเลิกใช้                                                 |
| `providerAuthAliases`                | ไม่       | `Record<string, string>`         | รหัสผู้ให้บริการที่ควรนำรหัสผู้ให้บริการอื่นมาใช้ซ้ำสำหรับการค้นหาการยืนยันตัวตน เช่น ผู้ให้บริการสำหรับการเขียนโค้ดที่ใช้คีย์ API และโปรไฟล์การยืนยันตัวตนของผู้ให้บริการฐานร่วมกัน                                                                          |
| `channelEnvVars`                     | ไม่       | `Record<string, string[]>`       | เมทาดาทาสภาพแวดล้อมของช่องทางแบบต้นทุนต่ำที่ OpenClaw ตรวจสอบได้โดยไม่ต้องโหลดโค้ด Plugin ใช้สิ่งนี้สำหรับการตั้งค่าช่องทางที่ขับเคลื่อนด้วยสภาพแวดล้อม หรือพื้นผิวการยืนยันตัวตนที่ตัวช่วยเริ่มต้น/กำหนดค่าทั่วไปควรมองเห็น                                            |
| `providerAuthChoices`                | ไม่       | `object[]`                       | เมทาดาทาตัวเลือกการยืนยันตัวตนแบบต้นทุนต่ำสำหรับตัวเลือกการเริ่มต้นใช้งาน การแก้ค่าผู้ให้บริการที่ต้องการ และการเชื่อมสายแฟล็ก CLI อย่างง่าย                                                                                                                       |
| `activation`                         | ไม่       | `object`                         | เมทาดาทาตัววางแผนการเปิดใช้งานแบบต้นทุนต่ำสำหรับการโหลดที่ถูกกระตุ้นจากการเริ่มต้น ผู้ให้บริการ คำสั่ง ช่องทาง เส้นทาง และความสามารถ เป็นเมทาดาทาเท่านั้น รันไทม์ Plugin ยังคงเป็นเจ้าของพฤติกรรมจริง                                                       |
| `setup`                              | ไม่       | `object`                         | ตัวบรรยายการตั้งค่า/การเริ่มต้นใช้งานแบบต้นทุนต่ำที่พื้นผิวการค้นพบและการตั้งค่าสามารถตรวจสอบได้โดยไม่ต้องโหลดรันไทม์ Plugin                                                                                                                    |
| `qaRunners`                          | ไม่       | `object[]`                       | ตัวบรรยายตัวรัน QA แบบต้นทุนต่ำที่โฮสต์ `openclaw qa` ร่วมใช้ก่อนที่รันไทม์ Plugin จะโหลด                                                                                                                                      |
| `contracts`                          | ไม่       | `object`                         | สแนปชอตการเป็นเจ้าของความสามารถแบบคงที่สำหรับฮุกการยืนยันตัวตนภายนอก เสียง การถอดเสียงแบบเรียลไทม์ เสียงพูดแบบเรียลไทม์ การทำความเข้าใจสื่อ การสร้างภาพ การสร้างเพลง การสร้างวิดีโอ การดึงข้อมูลเว็บ การค้นหาเว็บ และการเป็นเจ้าของเครื่องมือ |
| `mediaUnderstandingProviderMetadata` | ไม่       | `Record<string, object>`         | ค่าเริ่มต้นการทำความเข้าใจสื่อแบบต้นทุนต่ำสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.mediaUnderstandingProviders`                                                                                                                            |
| `imageGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างภาพแบบต้นทุนต่ำสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.imageGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `videoGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างวิดีโอแบบต้นทุนต่ำสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.videoGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `musicGenerationProviderMetadata`    | ไม่       | `Record<string, object>`         | เมทาดาทาการยืนยันตัวตนการสร้างเพลงแบบต้นทุนต่ำสำหรับรหัสผู้ให้บริการที่ประกาศใน `contracts.musicGenerationProviders` รวมถึงนามแฝงการยืนยันตัวตนและการ์ด base-url ที่ผู้ให้บริการเป็นเจ้าของ                                                                  |
| `toolMetadata`                       | ไม่       | `Record<string, object>`         | เมทาดาทาความพร้อมใช้งานแบบต้นทุนต่ำสำหรับเครื่องมือที่ Plugin เป็นเจ้าของและประกาศใน `contracts.tools` ใช้เมื่อเครื่องมือไม่ควรโหลดรันไทม์เว้นแต่จะมีหลักฐานการกำหนดค่า สภาพแวดล้อม หรือการยืนยันตัวตน                                                           |
| `channelConfigs`                     | ไม่       | `Record<string, object>`         | เมทาดาทาการกำหนดค่าช่องทางที่เมนิՖสต์เป็นเจ้าของ ซึ่งรวมเข้ากับพื้นผิวการค้นพบและการตรวจสอบความถูกต้องก่อนที่รันไทม์จะโหลด                                                                                                                          |
| `skills`                             | ไม่       | `string[]`                       | ไดเรกทอรี Skills ที่จะโหลด โดยสัมพันธ์กับรูทของ Plugin                                                                                                                                                                             |
| `name`                               | ไม่       | `string`                         | ชื่อ Plugin ที่มนุษย์อ่านได้                                                                                                                                                                                                         |
| `description`                        | No       | `string`                         | สรุปสั้น ๆ ที่แสดงในพื้นผิวของ Plugin                                                                                                                                                                                             |
| `version`                            | No       | `string`                         | เวอร์ชัน Plugin สำหรับข้อมูลอ้างอิง                                                                                                                                                                                                       |
| `uiHints`                            | No       | `Record<string, object>`         | ป้ายกำกับ UI, ข้อความตัวอย่าง และคำใบ้เกี่ยวกับความอ่อนไหวสำหรับฟิลด์การกำหนดค่า                                                                                                                                                                   |

## ข้อมูลอ้างอิงเมทาดาทาของผู้ให้บริการการสร้าง

ฟิลด์เมทาดาทาของผู้ให้บริการการสร้างอธิบายสัญญาณการยืนยันตัวตนแบบคงที่สำหรับ
ผู้ให้บริการที่ประกาศไว้ในรายการ `contracts.*GenerationProviders` ที่ตรงกัน
OpenClaw อ่านฟิลด์เหล่านี้ก่อนที่รันไทม์ของผู้ให้บริการจะโหลด เพื่อให้เครื่องมือแกนหลักสามารถ
ตัดสินใจได้ว่าผู้ให้บริการการสร้างพร้อมใช้งานหรือไม่ โดยไม่ต้องนำเข้า
Plugin ของผู้ให้บริการทุกตัว

ใช้ฟิลด์เหล่านี้เฉพาะกับข้อเท็จจริงแบบประกาศที่ตรวจสอบได้ราคาถูกเท่านั้น การขนส่ง การแปลงคำขอ
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

แต่ละรายการเมทาดาทารองรับ:

| ฟิลด์           | จำเป็น | ประเภท       | ความหมาย                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | ไม่       | `string[]` | รหัสผู้ให้บริการเพิ่มเติมที่ควรนับเป็นนามแฝงการยืนยันตัวตนแบบคงที่สำหรับผู้ให้บริการการสร้าง                                       |
| `authProviders` | ไม่       | `string[]` | รหัสผู้ให้บริการที่โปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้ควรนับเป็นการยืนยันตัวตนสำหรับผู้ให้บริการการสร้างนี้                                      |
| `configSignals` | ไม่       | `object[]` | สัญญาณความพร้อมใช้งานที่อิงเฉพาะการกำหนดค่าและตรวจสอบได้ราคาถูกสำหรับผู้ให้บริการแบบโลคัลหรือโฮสต์เอง ซึ่งสามารถกำหนดค่าได้โดยไม่ต้องใช้โปรไฟล์การยืนยันตัวตนหรือตัวแปรสภาพแวดล้อม |
| `authSignals`   | ไม่       | `object[]` | สัญญาณการยืนยันตัวตนแบบชัดเจน เมื่อมีฟิลด์นี้ สัญญาณเหล่านี้จะแทนที่ชุดสัญญาณเริ่มต้นจากรหัสผู้ให้บริการ, `aliases`, และ `authProviders`     |

แต่ละรายการ `configSignals` รองรับ:

| ฟิลด์         | จำเป็น | ประเภท       | ความหมาย                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | ใช่      | `string`   | พาธแบบจุดไปยังอ็อบเจกต์การกำหนดค่าที่ Plugin เป็นเจ้าของซึ่งต้องตรวจสอบ เช่น `plugins.entries.example.config`                                                                                    |
| `overlayPath` | ไม่       | `string`   | พาธแบบจุดภายในการกำหนดค่าราก ซึ่งอ็อบเจกต์ของพาธนั้นควรซ้อนทับอ็อบเจกต์รากก่อนประเมินสัญญาณ ใช้สำหรับการกำหนดค่าเฉพาะความสามารถ เช่น `image`, `video`, หรือ `music` |
| `required`    | ไม่       | `string[]` | พาธแบบจุดภายในการกำหนดค่าที่มีผล ซึ่งต้องมีค่าที่กำหนดค่าไว้ สตริงต้องไม่ว่าง อ็อบเจกต์และอาร์เรย์ต้องไม่ว่าง                                                |
| `requiredAny` | ไม่       | `string[]` | พาธแบบจุดภายในการกำหนดค่าที่มีผล ซึ่งอย่างน้อยหนึ่งพาธต้องมีค่าที่กำหนดค่าไว้                                                                                                  |
| `mode`        | ไม่       | `object`   | ตัวตรวจเงื่อนไขโหมดแบบสตริงที่ไม่บังคับภายในการกำหนดค่าที่มีผล ใช้เมื่อความพร้อมใช้งานที่อิงเฉพาะการกำหนดค่ามีผลกับโหมดใดโหมดหนึ่งเท่านั้น                                                                |

ตัวตรวจเงื่อนไข `mode` แต่ละรายการรองรับ:

| ฟิลด์        | จำเป็น | ประเภท       | ความหมาย                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | ไม่       | `string`   | พาธแบบจุดภายในการกำหนดค่าที่มีผล ค่าเริ่มต้นคือ `mode`                          |
| `default`    | ไม่       | `string`   | ค่าโหมดที่จะใช้เมื่อการกำหนดค่าไม่ได้ระบุพาธนั้น                                  |
| `allowed`    | ไม่       | `string[]` | หากมี สัญญาณจะผ่านเฉพาะเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้ |
| `disallowed` | ไม่       | `string[]` | หากมี สัญญาณจะไม่ผ่านเมื่อโหมดที่มีผลเป็นหนึ่งในค่าเหล่านี้       |

แต่ละรายการ `authSignals` รองรับ:

| ฟิลด์             | จำเป็น | ประเภท     | ความหมาย                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string` | รหัสผู้ให้บริการที่จะตรวจในโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้                                                                                                                             |
| `providerBaseUrl` | ไม่       | `object` | ตัวตรวจเงื่อนไขที่ไม่บังคับซึ่งทำให้สัญญาณถูกนับเฉพาะเมื่อผู้ให้บริการที่กำหนดค่าไว้ซึ่งอ้างอิงถึงใช้ URL ฐานที่อนุญาต ใช้เมื่อชื่อแฝงการยืนยันตัวตนใช้ได้กับ API บางชุดเท่านั้น |

ตัวตรวจเงื่อนไข `providerBaseUrl` แต่ละรายการรองรับ:

| ฟิลด์             | จำเป็น | ประเภท       | ความหมาย                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | ใช่      | `string`   | รหัสการกำหนดค่าผู้ให้บริการที่ควรตรวจ `baseUrl`                                                                                                |
| `defaultBaseUrl`  | ไม่       | `string`   | URL ฐานที่จะสมมติใช้เมื่อการกำหนดค่าผู้ให้บริการไม่ได้ระบุ `baseUrl`                                                                                         |
| `allowedBaseUrls` | ใช่      | `string[]` | URL ฐานที่อนุญาตสำหรับสัญญาณการยืนยันตัวตนนี้ สัญญาณจะถูกละเว้นเมื่อ URL ฐานที่กำหนดค่าไว้หรือค่าเริ่มต้นไม่ตรงกับหนึ่งในค่าที่ทำให้เป็นรูปแบบมาตรฐานเหล่านี้ |

## ข้อมูลอ้างอิงเมทาดาทาของเครื่องมือ

`toolMetadata` ใช้โครงสร้าง `configSignals` และ `authSignals` เดียวกันกับ
เมทาดาทาของผู้ให้บริการการสร้าง โดยใช้ชื่อเครื่องมือเป็นคีย์ `contracts.tools` ประกาศ
ความเป็นเจ้าของ `toolMetadata` ประกาศหลักฐานความพร้อมใช้งานที่ตรวจสอบได้ราคาถูก เพื่อให้ OpenClaw สามารถ
หลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin เพียงเพื่อให้แฟกทอรีเครื่องมือของมันส่งคืน `null`

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
โหลด Plugin เจ้าของเมื่อสัญญาเครื่องมือตรงกับนโยบาย สำหรับเครื่องมือในเส้นทางที่ถูกเรียกใช้บ่อย
ซึ่งแฟกทอรีพึ่งพาการยืนยันตัวตน/การกำหนดค่า ผู้เขียน Plugin ควรประกาศ
`toolMetadata` แทนการทำให้แกนหลักนำเข้ารันไทม์เพื่อถาม

## ข้อมูลอ้างอิง providerAuthChoices

แต่ละรายการ `providerAuthChoices` อธิบายตัวเลือกการเริ่มใช้งานหรือการยืนยันตัวตนหนึ่งรายการ
OpenClaw อ่านข้อมูลนี้ก่อนที่รันไทม์ของผู้ให้บริการจะโหลด
รายการการตั้งค่าผู้ให้บริการใช้ตัวเลือกในแมนิเฟสต์เหล่านี้ ตัวเลือกการตั้งค่าที่ได้จาก descriptor
และเมทาดาทาแค็ตตาล็อกการติดตั้ง โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ

| ฟิลด์                 | จำเป็น | ประเภท                                            | ความหมาย                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | ใช่      | `string`                                        | รหัสผู้ให้บริการที่ตัวเลือกนี้สังกัด                                                                      |
| `method`              | ใช่      | `string`                                        | รหัสวิธีการยืนยันตัวตนที่จะ dispatch ไป                                                                           |
| `choiceId`            | ใช่      | `string`                                        | รหัสตัวเลือกการยืนยันตัวตนที่เสถียร ซึ่งใช้โดยโฟลว์การเริ่มใช้งานและ CLI                                                  |
| `choiceLabel`         | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้ หากละไว้ OpenClaw จะถอยกลับไปใช้ `choiceId`                                        |
| `choiceHint`          | ไม่       | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับตัวเลือก                                                                        |
| `assistantPriority`   | ไม่       | `number`                                        | ค่าที่ต่ำกว่าจะเรียงก่อนในตัวเลือกแบบโต้ตอบที่ขับเคลื่อนโดยผู้ช่วย                                       |
| `assistantVisibility` | ไม่       | `"visible"` \| `"manual-only"`                  | ซ่อนตัวเลือกจากตัวเลือกของผู้ช่วย แต่ยังคงอนุญาตให้เลือกด้วย CLI แบบแมนนวลได้                        |
| `deprecatedChoiceIds` | ไม่       | `string[]`                                      | รหัสตัวเลือกเดิมที่ควรเปลี่ยนเส้นทางผู้ใช้ไปยังตัวเลือกทดแทนนี้                                 |
| `groupId`             | ไม่       | `string`                                        | รหัสกลุ่มที่ไม่บังคับสำหรับจัดกลุ่มตัวเลือกที่เกี่ยวข้อง                                                          |
| `groupLabel`          | ไม่       | `string`                                        | ป้ายกำกับที่แสดงต่อผู้ใช้สำหรับกลุ่มนั้น                                                                        |
| `groupHint`           | ไม่       | `string`                                        | ข้อความช่วยสั้น ๆ สำหรับกลุ่ม                                                                         |
| `optionKey`           | ไม่       | `string`                                        | คีย์ตัวเลือกภายในสำหรับโฟลว์การยืนยันตัวตนแบบแฟล็กเดียวอย่างง่าย                                                      |
| `cliFlag`             | ไม่       | `string`                                        | ชื่อแฟล็ก CLI เช่น `--openrouter-api-key`                                                           |
| `cliOption`           | ไม่       | `string`                                        | รูปแบบตัวเลือก CLI เต็มรูปแบบ เช่น `--openrouter-api-key <key>`                                             |
| `cliDescription`      | ไม่       | `string`                                        | คำอธิบายที่ใช้ในความช่วยเหลือของ CLI                                                                            |
| `onboardingScopes`    | ไม่       | `Array<"text-inference" \| "image-generation">` | พื้นผิวการเริ่มใช้งานที่ตัวเลือกนี้ควรปรากฏ หากละไว้ ค่าเริ่มต้นคือ `["text-inference"]` |

## ข้อมูลอ้างอิง commandAliases

ใช้ `commandAliases` เมื่อ Plugin เป็นเจ้าของชื่อคำสั่งรันไทม์ที่ผู้ใช้อาจ
ใส่ผิดใน `plugins.allow` หรือพยายามเรียกใช้เป็นคำสั่ง CLI ระดับราก OpenClaw
ใช้เมตาดาต้านี้สำหรับการวินิจฉัยโดยไม่ต้องนำเข้าโค้ดรันไทม์ของ Plugin

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

| ฟิลด์       | จำเป็น | ชนิด             | ความหมาย                                                              |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | ใช่     | `string`          | ชื่อคำสั่งที่เป็นของ Plugin นี้                                        |
| `kind`       | ไม่      | `"runtime-slash"` | ทำเครื่องหมาย alias เป็นคำสั่ง slash ในแชตแทนที่จะเป็นคำสั่ง CLI ระดับราก |
| `cliCommand` | ไม่      | `string`          | คำสั่ง CLI ระดับรากที่เกี่ยวข้องเพื่อแนะนำสำหรับการดำเนินการ CLI หากมี |

## ข้อมูลอ้างอิง `activation`

ใช้ `activation` เมื่อ Plugin สามารถประกาศได้อย่างประหยัดว่าเหตุการณ์ control-plane ใด
ควรรวม Plugin นี้ไว้ในแผน activation/load

บล็อกนี้เป็นเมตาดาต้าของ planner ไม่ใช่ lifecycle API บล็อกนี้ไม่ได้ลงทะเบียน
พฤติกรรมรันไทม์ ไม่ได้แทนที่ `register(...)` และไม่ได้รับประกันว่า
โค้ดของ Plugin ได้ทำงานแล้ว activation planner ใช้ฟิลด์เหล่านี้เพื่อ
จำกัด Plugin ที่เป็นตัวเลือกก่อน fallback ไปยังเมตาดาต้า ownership ใน manifest ที่มีอยู่
เช่น `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` และ hooks

ให้เลือกเมตาดาต้าที่แคบที่สุดซึ่งอธิบาย ownership อยู่แล้ว ใช้
`providers`, `channels`, `commandAliases`, setup descriptors หรือ `contracts`
เมื่อฟิลด์เหล่านั้นแสดงความสัมพันธ์นั้นได้ ใช้ `activation` สำหรับคำใบ้ planner
เพิ่มเติมที่ไม่สามารถแสดงด้วยฟิลด์ ownership เหล่านั้นได้
ใช้ `cliBackends` ระดับบนสุดสำหรับ alias รันไทม์ CLI เช่น `claude-cli`,
`codex-cli` หรือ `google-gemini-cli`; `activation.onAgentHarnesses` ใช้เฉพาะสำหรับ
id ของ agent harness แบบฝังที่ยังไม่มีฟิลด์ ownership อยู่แล้ว

บล็อกนี้เป็นเมตาดาต้าเท่านั้น บล็อกนี้ไม่ได้ลงทะเบียนพฤติกรรมรันไทม์ และไม่ได้
แทนที่ `register(...)`, `setupEntry` หรือ entrypoint รันไทม์/Plugin อื่น ๆ
consumer ปัจจุบันใช้บล็อกนี้เป็นคำใบ้เพื่อจำกัดขอบเขตก่อนโหลด Plugin ที่กว้างขึ้น ดังนั้น
การขาดเมตาดาต้า activation ที่ไม่ใช่ startup โดยปกติจะมีต้นทุนแค่ประสิทธิภาพเท่านั้น และ
ไม่ควรเปลี่ยนความถูกต้องตราบใดที่ fallback ของ manifest ownership ยังมีอยู่

Plugin ทุกตัวควรกำหนด `activation.onStartup` อย่างตั้งใจ ตั้งค่าเป็น `true`
เฉพาะเมื่อ Plugin ต้องทำงานระหว่างการเริ่มต้น Gateway ตั้งค่าเป็น `false` เมื่อ
Plugin ไม่ทำงานตอน startup และควรโหลดเฉพาะจาก trigger ที่แคบกว่าเท่านั้น
การละ `onStartup` จะไม่ startup-load Plugin โดยปริยายอีกต่อไป; ใช้
เมตาดาต้า activation แบบชัดเจนสำหรับ startup, channel, config, agent-harness, memory หรือ
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

| ฟิลด์             | จำเป็น | ชนิด                                                | ความหมาย                                                                                                                                                                            |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | ไม่      | `boolean`                                            | การเปิดใช้งานตอนเริ่มต้น Gateway แบบชัดเจน Plugin ทุกตัวควรกำหนดค่านี้ `true` จะนำเข้า Plugin ระหว่าง startup; `false` จะทำให้ Plugin เป็น startup-lazy เว้นแต่ trigger อื่นที่ตรงกันต้องโหลด |
| `onProviders`      | ไม่      | `string[]`                                           | id ของ provider ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                      |
| `onAgentHarnesses` | ไม่      | `string[]`                                           | id รันไทม์ของ agent harness แบบฝังที่ควรรวม Plugin นี้ไว้ในแผน activation/load ใช้ `cliBackends` ระดับบนสุดสำหรับ alias ของ CLI backend                                           |
| `onCommands`       | ไม่      | `string[]`                                           | id ของคำสั่งที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onChannels`       | ไม่      | `string[]`                                           | id ของ channel ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onRoutes`         | ไม่      | `string[]`                                           | ชนิด route ที่ควรรวม Plugin นี้ไว้ในแผน activation/load                                                                                                                       |
| `onConfigPaths`    | ไม่      | `string[]`                                           | path ของ config ที่สัมพันธ์กับราก ซึ่งควรรวม Plugin นี้ไว้ในแผน startup/load เมื่อมี path นั้นอยู่และไม่ได้ถูกปิดใช้งานอย่างชัดเจน                                                      |
| `onCapabilities`   | ไม่      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | คำใบ้ capability แบบกว้างที่ใช้โดยการวางแผน activation ของ control-plane ควรใช้ฟิลด์ที่แคบกว่าเมื่อทำได้                                                                                     |

consumer แบบ live ปัจจุบัน:

- การวางแผน startup ของ Gateway ใช้ `activation.onStartup` สำหรับการนำเข้า startup
  แบบชัดเจน
- การวางแผน CLI ที่ถูก trigger ด้วยคำสั่ง fallback ไปยัง
  `commandAliases[].cliCommand` หรือ `commandAliases[].name` แบบ legacy
- การวางแผน startup ของ agent-runtime ใช้ `activation.onAgentHarnesses` สำหรับ
  harness แบบฝัง และใช้ `cliBackends[]` ระดับบนสุดสำหรับ alias รันไทม์ CLI
- การวางแผน setup/channel ที่ถูก trigger ด้วย channel fallback ไปยัง ownership
  `channels[]` แบบ legacy เมื่อไม่มีเมตาดาต้า activation ของ channel แบบชัดเจน
- การวางแผน Plugin ตอน startup ใช้ `activation.onConfigPaths` สำหรับพื้นผิว config
  ระดับรากที่ไม่ใช่ channel เช่นบล็อก `browser` ของ Plugin browser ที่ bundled มา
- การวางแผน setup/runtime ที่ถูก trigger ด้วย provider fallback ไปยัง ownership
  `providers[]` และ `cliBackends[]` ระดับบนสุดแบบ legacy เมื่อไม่มีเมตาดาต้า activation
  ของ provider แบบชัดเจน

การวินิจฉัยของ planner สามารถแยกคำใบ้ activation แบบชัดเจนออกจาก fallback ของ
manifest ownership ได้ ตัวอย่างเช่น `activation-command-hint` หมายความว่า
`activation.onCommands` ตรงกัน ขณะที่ `manifest-command-alias` หมายความว่า
planner ใช้ ownership จาก `commandAliases` แทน ป้ายเหตุผลเหล่านี้ใช้สำหรับ
การวินิจฉัยและการทดสอบของโฮสต์; ผู้เขียน Plugin ควรประกาศเมตาดาต้าที่
อธิบาย ownership ได้ดีที่สุดต่อไป

## ข้อมูลอ้างอิง `qaRunners`

ใช้ `qaRunners` เมื่อ Plugin เพิ่ม transport runner หนึ่งรายการขึ้นไปภายใต้
ราก `openclaw qa` ที่ใช้ร่วมกัน รักษาเมตาดาต้านี้ให้ประหยัดและคงที่; รันไทม์ของ Plugin
ยังคงเป็นเจ้าของการลงทะเบียน CLI จริงผ่านพื้นผิว `runtime-api.ts`
ขนาดเบาที่ export `qaRunnerCliRegistrations`

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

| ฟิลด์        | จำเป็น | ชนิด    | ความหมาย                                                     |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | ใช่     | `string` | subcommand ที่ mount ใต้ `openclaw qa` เช่น `matrix`              |
| `description` | ไม่      | `string` | ข้อความ help สำหรับ fallback ที่ใช้เมื่อโฮสต์ที่ใช้ร่วมกันต้องมีคำสั่ง stub |

## ข้อมูลอ้างอิง `setup`

ใช้ `setup` เมื่อพื้นผิว setup และ onboarding ต้องการเมตาดาต้าราคาถูกที่ Plugin เป็นเจ้าของ
ก่อนที่รันไทม์จะโหลด

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

`cliBackends` ระดับบนสุดยังใช้ได้และยังคงอธิบาย backend สำหรับการอนุมาน CLI
`setup.cliBackends` คือพื้นผิว descriptor เฉพาะ setup สำหรับ
โฟลว์ control-plane/setup ที่ควรคงไว้เป็นเมตาดาต้าเท่านั้น

เมื่อมีอยู่ `setup.providers` และ `setup.cliBackends` คือพื้นผิวการค้นหาแบบ
descriptor-first ที่แนะนำสำหรับการค้นพบ setup หาก descriptor เพียงแค่
จำกัด Plugin ที่เป็นตัวเลือก และ setup ยังต้องใช้ hook รันไทม์ช่วง setup ที่สมบูรณ์กว่า
ให้ตั้ง `requiresRuntime: true` และคง `setup-api` ไว้เป็นเส้นทางการทำงาน fallback

OpenClaw ยังรวม `setup.providers[].envVars` ในการค้นหา auth ของ provider และ
env-var แบบทั่วไปด้วย `providerAuthEnvVars` ยังคงรองรับผ่าน adapter ความเข้ากันได้
ระหว่างช่วงเลิกใช้ แต่ Plugin ที่ไม่ใช่ bundled ที่ยังใช้อยู่
จะได้รับการวินิจฉัย manifest Plugin ใหม่ควรวางเมตาดาต้า env สำหรับ setup/status
ไว้ที่ `setup.providers[].envVars`

OpenClaw ยังสามารถอนุมานตัวเลือก setup แบบง่ายจาก `setup.providers[].authMethods`
เมื่อไม่มี setup entry หรือเมื่อ `setup.requiresRuntime: false`
ประกาศว่าไม่จำเป็นต้องใช้รันไทม์ setup รายการ `providerAuthChoices` แบบชัดเจนยังคง
เป็นที่แนะนำสำหรับ label แบบกำหนดเอง, flag CLI, ขอบเขต onboarding และเมตาดาต้า assistant

ตั้ง `requiresRuntime: false` เฉพาะเมื่อ descriptor เหล่านั้นเพียงพอสำหรับ
พื้นผิว setup OpenClaw ถือว่า `false` แบบชัดเจนเป็นสัญญาแบบ descriptor-only
และจะไม่ execute `setup-api` หรือ `openclaw.setupEntry` สำหรับการค้นหา setup หาก
Plugin แบบ descriptor-only ยังจัดส่ง entry รันไทม์ setup อย่างใดอย่างหนึ่งนั้นมา
OpenClaw จะรายงานการวินิจฉัยแบบ additive และยังคงเพิกเฉยต่อ entry นั้นต่อไป การละ
`requiresRuntime` จะคงพฤติกรรม fallback แบบ legacy เพื่อให้ Plugin ที่มีอยู่ซึ่งเพิ่ม
descriptor โดยไม่มี flag ไม่เสียหาย

เนื่องจากการค้นหา setup สามารถ execute โค้ด `setup-api` ที่ Plugin เป็นเจ้าของได้ ค่า
`setup.providers[].id` และ `setup.cliBackends[]` ที่ normalized แล้วต้องไม่ซ้ำกันใน
Plugin ที่ค้นพบทั้งหมด ownership ที่กำกวมจะ fail closed แทนที่จะเลือก
ผู้ชนะจากลำดับการค้นพบ

เมื่อรันไทม์ setup ทำงาน การวินิจฉัยของ setup registry จะรายงาน drift ของ descriptor
หาก `setup-api` ลงทะเบียน provider หรือ CLI backend ที่ manifest
descriptors ไม่ได้ประกาศ หรือหาก descriptor ไม่มีการลงทะเบียนรันไทม์ที่ตรงกัน
การวินิจฉัยเหล่านี้เป็นแบบ additive และไม่ปฏิเสธ Plugin แบบ legacy

### ข้อมูลอ้างอิง `setup.providers`

| ฟิลด์         | จำเป็น | ชนิด      | ความหมาย                                                                                   |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | ใช่     | `string`   | id ของ provider ที่แสดงระหว่าง setup หรือ onboarding รักษา id ที่ normalized ให้ไม่ซ้ำกันทั่วทั้งระบบ |
| `authMethods`  | ไม่      | `string[]` | id ของวิธี setup/auth ที่ provider นี้รองรับโดยไม่ต้องโหลดรันไทม์เต็มรูปแบบ                  |
| `envVars`      | ไม่      | `string[]` | env var ที่พื้นผิว setup/status แบบทั่วไปสามารถตรวจสอบได้ก่อนที่รันไทม์ของ Plugin จะโหลด               |
| `authEvidence` | ไม่      | `object[]` | การตรวจสอบหลักฐาน auth ในเครื่องแบบประหยัดสำหรับ provider ที่สามารถ authenticate ผ่าน marker ที่ไม่ใช่ secret |

`authEvidence` ใช้สำหรับตัวบ่งชี้ข้อมูลประจำตัวภายในเครื่องที่ผู้ให้บริการเป็นเจ้าของ ซึ่งสามารถ
ตรวจสอบได้โดยไม่ต้องโหลดโค้ดรันไทม์ การตรวจสอบเหล่านี้ต้องยังคงเบาและเป็นภายในเครื่อง:
ไม่มีการเรียกเครือข่าย ไม่มีการอ่าน keychain หรือ secret-manager ไม่มีคำสั่ง shell และไม่มี
การ probe API ของผู้ให้บริการ

รายการหลักฐานที่รองรับ:

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | ใช่      | `string`   | ปัจจุบันคือ `local-file-with-env`                                                                               |
| `fileEnvVar`       | ไม่       | `string`   | env var ที่มีพาธไฟล์ข้อมูลประจำตัวแบบระบุชัดเจน                                                           |
| `fallbackPaths`    | ไม่       | `string[]` | พาธไฟล์ข้อมูลประจำตัวภายในเครื่องที่ตรวจสอบเมื่อ `fileEnvVar` ไม่มีอยู่หรือว่าง รองรับ `${HOME}` และ `${APPDATA}` |
| `requiresAnyEnv`   | ไม่       | `string[]` | ต้องมี env var อย่างน้อยหนึ่งรายการที่ระบุไว้ไม่ว่าง ก่อนที่หลักฐานจะถือว่าใช้งานได้                                    |
| `requiresAllEnv`   | ไม่       | `string[]` | env var ทุกรายการที่ระบุไว้ต้องไม่ว่าง ก่อนที่หลักฐานจะถือว่าใช้งานได้                                           |
| `credentialMarker` | ใช่      | `string`   | ตัวบ่งชี้ที่ไม่ใช่ความลับซึ่งส่งคืนเมื่อมีหลักฐานอยู่                                                       |
| `source`           | ไม่       | `string`   | ป้ายกำกับแหล่งที่มาสำหรับผู้ใช้ในเอาต์พุต auth/status                                                               |

### ฟิลด์ setup

| ฟิลด์              | จำเป็น | ประเภท       | ความหมาย                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | ไม่       | `object[]` | ตัวอธิบายการตั้งค่าผู้ให้บริการที่เปิดเผยระหว่างการตั้งค่าและการเริ่มต้นใช้งาน                                     |
| `cliBackends`      | ไม่       | `string[]` | ids ของ backend ในช่วงตั้งค่าที่ใช้สำหรับการค้นหาการตั้งค่าแบบ descriptor-first คง ids ที่ normalize แล้วให้ไม่ซ้ำกันทั่วระบบ |
| `configMigrations` | ไม่       | `string[]` | ids ของการ migration config ที่พื้นผิว setup ของ plugin นี้เป็นเจ้าของ                                          |
| `requiresRuntime`  | ไม่       | `boolean`  | setup ยังคงต้องเรียกใช้ `setup-api` หลังจากการค้นหา descriptor หรือไม่                            |

## อ้างอิง uiHints

`uiHints` คือ map จากชื่อฟิลด์ config ไปยังคำใบ้การแสดงผลขนาดเล็ก

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

คำใบ้ของแต่ละฟิลด์สามารถรวมสิ่งต่อไปนี้ได้:

| ฟิลด์         | ประเภท       | ความหมาย                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ป้ายกำกับฟิลด์สำหรับผู้ใช้                |
| `help`        | `string`   | ข้อความช่วยเหลือแบบสั้น                      |
| `tags`        | `string[]` | แท็ก UI ที่เลือกได้                       |
| `advanced`    | `boolean`  | ทำเครื่องหมายฟิลด์เป็นขั้นสูง            |
| `sensitive`   | `boolean`  | ทำเครื่องหมายฟิลด์เป็นความลับหรือละเอียดอ่อน |
| `placeholder` | `string`   | ข้อความ placeholder สำหรับอินพุตฟอร์ม       |

## อ้างอิง contracts

ใช้ `contracts` เฉพาะสำหรับ metadata การเป็นเจ้าของความสามารถแบบ static ที่ OpenClaw สามารถ
อ่านได้โดยไม่ต้อง import รันไทม์ของ plugin

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

แต่ละรายการเป็นแบบเลือกได้:

| ฟิลด์                            | ประเภท       | ความหมาย                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ids ของ factory ส่วนขยาย app-server ของ Codex ปัจจุบันคือ `codex-app-server` |
| `agentToolResultMiddleware`      | `string[]` | ids ของรันไทม์ที่ bundled plugin อาจลงทะเบียน middleware สำหรับ tool-result ได้ |
| `externalAuthProviders`          | `string[]` | ids ของผู้ให้บริการที่ plugin นี้เป็นเจ้าของ hook โปรไฟล์ auth ภายนอก       |
| `speechProviders`                | `string[]` | ids ของผู้ให้บริการ speech ที่ plugin นี้เป็นเจ้าของ                                 |
| `realtimeTranscriptionProviders` | `string[]` | ids ของผู้ให้บริการ realtime-transcription ที่ plugin นี้เป็นเจ้าของ                 |
| `realtimeVoiceProviders`         | `string[]` | ids ของผู้ให้บริการ realtime-voice ที่ plugin นี้เป็นเจ้าของ                         |
| `memoryEmbeddingProviders`       | `string[]` | ids ของผู้ให้บริการ memory embedding ที่ plugin นี้เป็นเจ้าของ                       |
| `mediaUnderstandingProviders`    | `string[]` | ids ของผู้ให้บริการ media-understanding ที่ plugin นี้เป็นเจ้าของ                    |
| `imageGenerationProviders`       | `string[]` | ids ของผู้ให้บริการ image-generation ที่ plugin นี้เป็นเจ้าของ                       |
| `videoGenerationProviders`       | `string[]` | ids ของผู้ให้บริการ video-generation ที่ plugin นี้เป็นเจ้าของ                       |
| `webFetchProviders`              | `string[]` | ids ของผู้ให้บริการ web-fetch ที่ plugin นี้เป็นเจ้าของ                              |
| `webSearchProviders`             | `string[]` | ids ของผู้ให้บริการ web-search ที่ plugin นี้เป็นเจ้าของ                             |
| `migrationProviders`             | `string[]` | ids ของผู้ให้บริการ import ที่ plugin นี้เป็นเจ้าของสำหรับ `openclaw migrate`          |
| `tools`                          | `string[]` | ชื่อเครื่องมือ Agent ที่ plugin นี้เป็นเจ้าของ                                    |

`contracts.embeddedExtensionFactories` ถูกเก็บไว้สำหรับ factory ส่วนขยายเฉพาะ bundled Codex
app-server เท่านั้น การแปลง tool-result แบบ bundled ควรประกาศ
`contracts.agentToolResultMiddleware` และลงทะเบียนด้วย
`api.registerAgentToolResultMiddleware(...)` แทน plugin ภายนอกไม่สามารถ
ลงทะเบียน middleware สำหรับ tool-result ได้ เพราะ seam นี้สามารถเขียนเอาต์พุตเครื่องมือ
ที่มีความน่าเชื่อถือสูงใหม่ก่อนที่โมเดลจะเห็น

การลงทะเบียน `api.registerTool(...)` ในรันไทม์ต้องตรงกับ `contracts.tools`
การค้นพบเครื่องมือใช้รายการนี้เพื่อโหลดเฉพาะรันไทม์ของ plugin ที่สามารถเป็นเจ้าของ
เครื่องมือที่ร้องขอได้

Provider plugins ที่ implement `resolveExternalAuthProfiles` ควรประกาศ
`contracts.externalAuthProviders` Plugins ที่ไม่มีการประกาศยังคงทำงาน
ผ่าน compatibility fallback ที่เลิกใช้แล้ว แต่ fallback นั้นช้ากว่าและ
จะถูกลบหลังจากช่วง migration

ผู้ให้บริการ memory embedding แบบ bundled ควรประกาศ
`contracts.memoryEmbeddingProviders` สำหรับ adapter id ทุกตัวที่เปิดเผย รวมถึง
adapter ในตัว เช่น `local` พาธ CLI แบบ standalone ใช้สัญญา manifest นี้
เพื่อโหลดเฉพาะ plugin ที่เป็นเจ้าของก่อนที่รันไทม์ Gateway เต็มรูปแบบจะ
ลงทะเบียนผู้ให้บริการ

## อ้างอิง mediaUnderstandingProviderMetadata

ใช้ `mediaUnderstandingProviderMetadata` เมื่อผู้ให้บริการ media-understanding มี
โมเดลเริ่มต้น ลำดับความสำคัญของ auto-auth fallback หรือการรองรับเอกสารแบบ native ที่
ตัวช่วย core ทั่วไปต้องใช้ก่อนโหลดรันไทม์ ต้องประกาศคีย์ใน
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

แต่ละรายการผู้ให้บริการสามารถรวมสิ่งต่อไปนี้ได้:

| ฟิลด์                  | ประเภท                                | ความหมาย                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | ความสามารถด้านสื่อที่ผู้ให้บริการนี้เปิดเผย                                 |
| `defaultModels`        | `Record<string, string>`            | ค่าเริ่มต้น capability-to-model ที่ใช้เมื่อ config ไม่ได้ระบุโมเดล      |
| `autoPriority`         | `Record<string, number>`            | ตัวเลขที่ต่ำกว่าจะเรียงก่อนสำหรับ fallback ผู้ให้บริการตามข้อมูลประจำตัวแบบอัตโนมัติ |
| `nativeDocumentInputs` | `"pdf"[]`                           | อินพุตเอกสารแบบ native ที่ผู้ให้บริการรองรับ                            |

## อ้างอิง channelConfigs

ใช้ `channelConfigs` เมื่อ channel plugin ต้องการ metadata config ที่เบาก่อน
โหลดรันไทม์ การค้นพบการตั้งค่า/สถานะ channel แบบอ่านอย่างเดียวสามารถใช้ metadata นี้
โดยตรงสำหรับ channel ภายนอกที่กำหนดค่าไว้เมื่อไม่มีรายการ setup ให้ใช้ หรือ
เมื่อ `setup.requiresRuntime: false` ประกาศว่าไม่จำเป็นต้องใช้รันไทม์ setup

`channelConfigs` คือ metadata manifest ของ plugin ไม่ใช่ส่วน config ผู้ใช้ระดับบนสุด
ใหม่ ผู้ใช้ยังคงกำหนดค่าอินสแตนซ์ channel ใต้ `channels.<channel-id>`
OpenClaw อ่าน metadata manifest เพื่อเลือกว่า plugin ใดเป็นเจ้าของ channel ที่กำหนดค่าไว้
ก่อนที่โค้ดรันไทม์ของ plugin จะทำงาน

สำหรับ channel plugin, `configSchema` และ `channelConfigs` อธิบายพาธที่แตกต่างกัน:

- `configSchema` ตรวจสอบ `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` ตรวจสอบ `channels.<channel-id>`

plugins ที่ไม่ใช่ bundled และประกาศ `channels[]` ควรประกาศรายการ
`channelConfigs` ที่ตรงกันด้วย หากไม่มีรายการเหล่านั้น OpenClaw ยังสามารถโหลด plugin ได้ แต่
schema config สำหรับ cold-path, setup และพื้นผิว Control UI จะไม่สามารถรู้รูปทรงของ
ตัวเลือกที่ channel เป็นเจ้าของได้จนกว่ารันไทม์ของ plugin จะทำงาน

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` และ
`nativeSkillsAutoEnabled` สามารถประกาศค่าเริ่มต้น `auto` แบบ static สำหรับการตรวจสอบ config
คำสั่งที่ทำงานก่อนโหลดรันไทม์ของ channel channel แบบ bundled ยังสามารถเผยแพร่
ค่าเริ่มต้นเดียวกันผ่าน `package.json#openclaw.channel.commands` ควบคู่กับ
metadata แค็ตตาล็อก channel อื่น ๆ ที่ package เป็นเจ้าของ

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

แต่ละรายการ channel สามารถรวมสิ่งต่อไปนี้ได้:

| ฟิลด์         | ประเภท                     | ความหมาย                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema สำหรับ `channels.<id>` จำเป็นสำหรับแต่ละรายการการกำหนดค่า channel ที่ประกาศไว้         |
| `uiHints`     | `Record<string, object>` | ป้ายกำกับ/placeholder/คำใบ้ข้อมูลอ่อนไหวของ UI แบบไม่บังคับสำหรับส่วนการกำหนดค่า channel นั้น          |
| `label`       | `string`                 | ป้ายกำกับ channel ที่ผสานเข้ากับพื้นผิวตัวเลือกและการตรวจสอบเมื่อ metadata ขณะ runtime ยังไม่พร้อม |
| `description` | `string`                 | คำอธิบาย channel แบบสั้นสำหรับพื้นผิวการตรวจสอบและแค็ตตาล็อก                               |
| `commands`    | `object`                 | ค่าเริ่มต้นอัตโนมัติของคำสั่ง native แบบคงที่และ skill native สำหรับการตรวจสอบ config ก่อน runtime       |
| `preferOver`  | `string[]`               | id Plugin เดิมหรือที่มีลำดับความสำคัญต่ำกว่าที่ channel นี้ควรอยู่เหนือกว่าในพื้นผิวการเลือก    |

### การแทนที่ Plugin channel อื่น

ใช้ `preferOver` เมื่อ Plugin ของคุณเป็นเจ้าของที่ต้องการสำหรับ channel id ที่
Plugin อื่นก็สามารถให้ได้เช่นกัน กรณีทั่วไปคือ id Plugin ที่เปลี่ยนชื่อ,
Plugin แบบ standalone ที่มาแทน Plugin ที่ bundled มา, หรือ fork ที่มีผู้ดูแลซึ่ง
คง channel id เดิมไว้เพื่อความเข้ากันได้ของ config

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

เมื่อกำหนดค่า `channels.chat` แล้ว OpenClaw จะพิจารณาทั้ง channel id และ
id Plugin ที่ต้องการ หาก Plugin ที่มีลำดับความสำคัญต่ำกว่าถูกเลือกเพียงเพราะ
ถูก bundled มาหรือเปิดใช้งานโดยค่าเริ่มต้น OpenClaw จะปิดใช้งาน Plugin นั้นใน
config ขณะ runtime ที่มีผล เพื่อให้ Plugin เดียวเป็นเจ้าของ channel และเครื่องมือของมัน การเลือกของผู้ใช้
แบบชัดเจนยังคงชนะ: หากผู้ใช้เปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw
จะคงตัวเลือกนั้นไว้และรายงาน diagnostic ของ channel/tool ที่ซ้ำกันแทนการ
เปลี่ยนชุด Plugin ที่ร้องขออย่างเงียบๆ

จำกัดขอบเขต `preferOver` ไว้เฉพาะ id Plugin ที่สามารถให้ channel เดียวกันได้จริง
ฟิลด์นี้ไม่ใช่ฟิลด์ลำดับความสำคัญทั่วไป และไม่ได้เปลี่ยนชื่อ key config ของผู้ใช้

## ข้อมูลอ้างอิง modelSupport

ใช้ `modelSupport` เมื่อ OpenClaw ควรอนุมาน Plugin ผู้ให้บริการของคุณจาก
id โมเดลแบบย่อ เช่น `gpt-5.5` หรือ `claude-sonnet-4.6` ก่อนที่ runtime ของ Plugin
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

- ref แบบ `provider/model` ที่ชัดเจนจะใช้ metadata manifest ของ `providers` ที่เป็นเจ้าของ
- `modelPatterns` มีลำดับเหนือกว่า `modelPrefixes`
- หาก Plugin ที่ไม่ได้ bundled หนึ่งตัวและ Plugin ที่ bundled หนึ่งตัว match ทั้งคู่ Plugin ที่ไม่ได้ bundled
  จะชนะ
- ความคลุมเครือที่เหลือจะถูกละเว้นจนกว่าผู้ใช้หรือ config จะระบุผู้ให้บริการ

ฟิลด์:

| ฟิลด์           | ประเภท       | ความหมาย                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefix ที่ match ด้วย `startsWith` กับ id โมเดลแบบย่อ                 |
| `modelPatterns` | `string[]` | แหล่งที่มา regex ที่ match กับ id โมเดลแบบย่อหลังนำ suffix ของโปรไฟล์ออกแล้ว |

## ข้อมูลอ้างอิง modelCatalog

ใช้ `modelCatalog` เมื่อ OpenClaw ควรรู้ metadata โมเดลของผู้ให้บริการก่อน
โหลด runtime ของ Plugin นี่คือแหล่งที่ manifest เป็นเจ้าของสำหรับแถวแค็ตตาล็อกแบบคงที่,
alias ของผู้ให้บริการ, กฎ suppression, และโหมด discovery การ refresh ขณะ runtime
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

| ฟิลด์          | ประเภท                                                     | ความหมาย                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | แถวแค็ตตาล็อกสำหรับ id ผู้ให้บริการที่ Plugin นี้เป็นเจ้าของ Key ควรปรากฏใน `providers` ระดับบนสุดด้วย       |
| `aliases`      | `Record<string, object>`                                 | alias ของผู้ให้บริการที่ควร resolve ไปยังผู้ให้บริการที่เป็นเจ้าของสำหรับการวางแผนแค็ตตาล็อกหรือ suppression              |
| `suppressions` | `object[]`                                               | แถวโมเดลจากแหล่งอื่นที่ Plugin นี้ suppress ด้วยเหตุผลเฉพาะผู้ให้บริการ                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | แค็ตตาล็อกของผู้ให้บริการสามารถอ่านจาก metadata manifest, refresh เข้า cache, หรือต้องใช้ runtime หรือไม่ |

`aliases` มีส่วนร่วมในการค้นหาความเป็นเจ้าของผู้ให้บริการสำหรับการวางแผน model-catalog
เป้าหมาย alias ต้องเป็นผู้ให้บริการระดับบนสุดที่ Plugin เดียวกันเป็นเจ้าของ เมื่อรายการที่กรองตาม
ผู้ให้บริการใช้ alias OpenClaw สามารถอ่าน manifest ที่เป็นเจ้าของและ
ใช้ override API/base URL ของ alias ได้โดยไม่ต้องโหลด runtime ของผู้ให้บริการ
Aliases จะไม่ขยายรายการแค็ตตาล็อกแบบไม่กรอง รายการแบบกว้างจะ emit เฉพาะแถวของ
ผู้ให้บริการ canonical ที่เป็นเจ้าของเท่านั้น

`suppressions` แทนที่ hook runtime ของผู้ให้บริการ `suppressBuiltInModel` แบบเก่า
รายการ suppression จะถูกใช้เฉพาะเมื่อ Plugin เป็นเจ้าของผู้ให้บริการ หรือ
ประกาศเป็น key `modelCatalog.aliases` ที่ชี้ไปยังผู้ให้บริการที่เป็นเจ้าของ Hook
suppression ขณะ runtime จะไม่ถูกเรียกอีกต่อไประหว่างการ resolve โมเดล

ฟิลด์ของผู้ให้บริการ:

| ฟิลด์     | ประเภท                     | ความหมาย                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | base URL เริ่มต้นแบบไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้    |
| `api`     | `ModelApi`               | adapter API เริ่มต้นแบบไม่บังคับสำหรับโมเดลในแค็ตตาล็อกผู้ให้บริการนี้ |
| `headers` | `Record<string, string>` | header แบบคงที่ที่ไม่บังคับซึ่งใช้กับแค็ตตาล็อกผู้ให้บริการนี้      |
| `models`  | `object[]`               | แถวโมเดลที่จำเป็น แถวที่ไม่มี `id` จะถูกละเว้น            |

ฟิลด์ของโมเดล:

| ฟิลด์           | ประเภท                                                           | ความหมาย                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | id โมเดลภายในผู้ให้บริการ โดยไม่มี prefix `provider/`                    |
| `name`          | `string`                                                       | ชื่อที่แสดงแบบไม่บังคับ                                                      |
| `api`           | `ModelApi`                                                     | override API รายโมเดลแบบไม่บังคับ                                            |
| `baseUrl`       | `string`                                                       | override base URL รายโมเดลแบบไม่บังคับ                                       |
| `headers`       | `Record<string, string>`                                       | header แบบคงที่รายโมเดลแบบไม่บังคับ                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | modality ที่โมเดลรับได้                                               |
| `reasoning`     | `boolean`                                                      | โมเดลเปิดเผยพฤติกรรม reasoning หรือไม่                               |
| `contextWindow` | `number`                                                       | context window ดั้งเดิมของผู้ให้บริการ                                             |
| `contextTokens` | `number`                                                       | เพดาน context ขณะ runtime ที่มีผลแบบไม่บังคับเมื่อแตกต่างจาก `contextWindow` |
| `maxTokens`     | `number`                                                       | จำนวน token เอาต์พุตสูงสุดเมื่อทราบ                                           |
| `cost`          | `object`                                                       | ราคาต่อหนึ่งล้าน token เป็น USD แบบไม่บังคับ รวมถึง `tieredPricing` แบบไม่บังคับ |
| `compat`        | `object`                                                       | flag ความเข้ากันได้แบบไม่บังคับที่ตรงกับความเข้ากันได้ของ config โมเดล OpenClaw  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | สถานะรายการ Suppress เฉพาะเมื่อแถวนั้นต้องไม่ปรากฏเลย          |
| `statusReason`  | `string`                                                       | เหตุผลแบบไม่บังคับที่แสดงพร้อมสถานะที่ไม่ใช่ available                            |
| `replaces`      | `string[]`                                                     | id โมเดลภายในผู้ให้บริการรุ่นเก่าที่โมเดลนี้มาแทนที่                       |
| `replacedBy`    | `string`                                                       | id โมเดลภายในผู้ให้บริการที่ใช้แทนสำหรับแถว deprecated                    |
| `tags`          | `string[]`                                                     | tag ที่เสถียรซึ่งใช้โดยตัวเลือกและตัวกรอง                                    |

ฟิลด์ suppression:

| ฟิลด์                      | ประเภท       | ความหมาย                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | id ผู้ให้บริการสำหรับแถว upstream ที่จะ suppress ต้องเป็นของ Plugin นี้หรือประกาศเป็น alias ที่เป็นเจ้าของ |
| `model`                    | `string`   | id โมเดลภายในผู้ให้บริการที่จะ suppress                                                                      |
| `reason`                   | `string`   | ข้อความแบบไม่บังคับที่แสดงเมื่อมีการร้องขอแถวที่ถูก suppress โดยตรง                                     |
| `when.baseUrlHosts`        | `string[]` | รายการ host ของ base URL ผู้ให้บริการที่มีผลแบบไม่บังคับ ซึ่งจำเป็นก่อน suppression จะมีผล               |
| `when.providerConfigApiIn` | `string[]` | รายการค่า `api` ของ provider-config แบบ exact ที่ไม่บังคับ ซึ่งจำเป็นก่อน suppression จะมีผล              |

อย่าใส่ข้อมูลที่มีเฉพาะตอนรันไทม์ไว้ใน `modelCatalog` ใช้ `static` เฉพาะเมื่อ
แถวของ manifest สมบูรณ์พอให้พื้นผิวรายการและตัวเลือกที่กรองตามผู้ให้บริการข้าม
การค้นพบผ่าน registry/runtime ได้ ใช้ `refreshable` เมื่อแถวของ manifest มีประโยชน์
ในฐานะ seed หรือส่วนเสริมที่แสดงรายการได้ แต่การ refresh/cache สามารถเพิ่มแถวเพิ่มเติมได้ภายหลัง
แถวแบบ refreshable ไม่ถือเป็นแหล่งข้อมูลที่เชื่อถือได้โดยตัวเอง ใช้ `runtime` เมื่อ OpenClaw
ต้องโหลดรันไทม์ของผู้ให้บริการเพื่อรู้รายการ

## ข้อมูลอ้างอิง `modelIdNormalization`

ใช้ `modelIdNormalization` สำหรับการล้าง model-id แบบประหยัดที่ผู้ให้บริการเป็นเจ้าของ ซึ่งต้อง
เกิดขึ้นก่อนรันไทม์ของผู้ให้บริการโหลด วิธีนี้เก็บ alias เช่นชื่อโมเดลแบบสั้น
id เก่าภายในผู้ให้บริการ และกฎ prefix ของ proxy ไว้ใน manifest ของ Plugin เจ้าของ
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

| ฟิลด์                               | ชนิดข้อมูล              | ความหมาย                                                                                 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | alias ของ model-id แบบตรงตัวโดยไม่สนตัวพิมพ์เล็กใหญ่ ค่าจะถูกส่งคืนตามที่เขียนไว้       |
| `stripPrefixes`                      | `string[]`              | prefix ที่ต้องลบก่อนค้นหา alias มีประโยชน์สำหรับการซ้ำซ้อนแบบเก่าของผู้ให้บริการ/โมเดล |
| `prefixWhenBare`                     | `string`                | prefix ที่จะเพิ่มเมื่อ id โมเดลที่ normalize แล้วไม่มี `/` อยู่แล้ว                      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | กฎ prefix ของ bare-id แบบมีเงื่อนไขหลังค้นหา alias โดยอ้างอิง `modelPrefix` และ `prefix` |

## ข้อมูลอ้างอิง `providerEndpoints`

ใช้ `providerEndpoints` สำหรับการจัดหมวดหมู่ endpoint ที่นโยบายคำขอทั่วไปต้องรู้
ก่อนรันไทม์ของผู้ให้บริการโหลด แกนหลักยังคงเป็นเจ้าของความหมายของแต่ละ
`endpointClass`; manifest ของ Plugin เป็นเจ้าของ metadata ของ host และ base URL

ฟิลด์ของ endpoint:

| ฟิลด์                         | ชนิดข้อมูล | ความหมาย                                                                                        |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | คลาส endpoint ของแกนหลักที่รู้จัก เช่น `openrouter`, `moonshot-native` หรือ `google-vertex`   |
| `hosts`                        | `string[]` | hostname แบบตรงตัวที่ map ไปยังคลาส endpoint                                                   |
| `hostSuffixes`                 | `string[]` | suffix ของ host ที่ map ไปยังคลาส endpoint นำหน้าด้วย `.` สำหรับการจับคู่เฉพาะ suffix โดเมน |
| `baseUrls`                     | `string[]` | base URL ของ HTTP(S) ที่ normalize แล้วแบบตรงตัว ซึ่ง map ไปยังคลาส endpoint                  |
| `googleVertexRegion`           | `string`   | ภูมิภาค Google Vertex แบบ static สำหรับ global host แบบตรงตัว                                 |
| `googleVertexRegionHostSuffix` | `string`   | suffix ที่จะตัดออกจาก host ที่ตรงกันเพื่อเปิดเผย prefix ภูมิภาค Google Vertex                |

## ข้อมูลอ้างอิง `providerRequest`

ใช้ `providerRequest` สำหรับ metadata ความเข้ากันได้ของคำขอแบบประหยัดที่นโยบาย
คำขอทั่วไปต้องใช้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ เก็บการเขียน payload ใหม่ที่เฉพาะพฤติกรรม
ไว้ใน hook รันไทม์ของผู้ให้บริการหรือ helper ที่ใช้ร่วมกันของตระกูลผู้ให้บริการ

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

| ฟิลด์                | ชนิดข้อมูล   | ความหมาย                                                                                 |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | ป้ายชื่อตระกูลผู้ให้บริการที่ใช้ในการตัดสินใจและวินิจฉัยความเข้ากันได้ของคำขอทั่วไป |
| `compatibilityFamily` | `"moonshot"` | bucket ความเข้ากันได้ของตระกูลผู้ให้บริการแบบไม่บังคับสำหรับ helper คำขอที่ใช้ร่วมกัน |
| `openAICompletions`   | `object`     | flag ของคำขอ completions ที่เข้ากันได้กับ OpenAI ปัจจุบันคือ `supportsStreamingUsage` |

## ข้อมูลอ้างอิง `modelPricing`

ใช้ `modelPricing` เมื่อผู้ให้บริการต้องควบคุมพฤติกรรมราคาใน control-plane ก่อน
รันไทม์โหลด cache ราคาของ Gateway จะอ่าน metadata นี้โดยไม่ import
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

| ฟิลด์       | ชนิดข้อมูล        | ความหมาย                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | ตั้งเป็น `false` สำหรับผู้ให้บริการ local/self-hosted ที่ไม่ควรดึงราคาจาก OpenRouter หรือ LiteLLM เลย |
| `openRouter` | `false \| object` | การ map การค้นหาราคา OpenRouter ค่า `false` จะปิดการค้นหา OpenRouter สำหรับผู้ให้บริการนี้           |
| `liteLLM`    | `false \| object` | การ map การค้นหาราคา LiteLLM ค่า `false` จะปิดการค้นหา LiteLLM สำหรับผู้ให้บริการนี้                 |

ฟิลด์ของแหล่งข้อมูล:

| ฟิลด์                     | ชนิดข้อมูล         | ความหมาย                                                                                                             |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | id ผู้ให้บริการใน catalog ภายนอกเมื่อแตกต่างจาก id ผู้ให้บริการของ OpenClaw เช่น `z-ai` สำหรับผู้ให้บริการ `zai` |
| `passthroughProviderModel` | `boolean`          | ปฏิบัติต่อ id โมเดลที่มี slash เป็นอ้างอิงผู้ให้บริการ/โมเดลแบบซ้อน มีประโยชน์สำหรับผู้ให้บริการ proxy เช่น OpenRouter |
| `modelIdTransforms`        | `"version-dots"[]` | variant เพิ่มเติมของ model-id ใน catalog ภายนอก `version-dots` จะลอง id เวอร์ชันที่มีจุด เช่น `claude-opus-4.6` |

### ดัชนีผู้ให้บริการของ OpenClaw

ดัชนีผู้ให้บริการของ OpenClaw คือ metadata แบบ preview ที่ OpenClaw เป็นเจ้าของสำหรับผู้ให้บริการ
ที่อาจยังไม่ได้ติดตั้ง Plugin ไว้ ดัชนีนี้ไม่ใช่ส่วนหนึ่งของ manifest ของ Plugin
manifest ของ Plugin ยังคงเป็นแหล่งอ้างอิงสำหรับ Plugin ที่ติดตั้งแล้ว ดัชนีผู้ให้บริการคือ
สัญญา fallback ภายในที่พื้นผิวตัวเลือกโมเดลของผู้ให้บริการที่ติดตั้งได้ในอนาคตและก่อนติดตั้ง
จะใช้เมื่อยังไม่ได้ติดตั้ง Plugin ของผู้ให้บริการ

ลำดับแหล่งอ้างอิงของ catalog:

1. การตั้งค่าของผู้ใช้
2. `modelCatalog` ใน manifest ของ Plugin ที่ติดตั้งแล้ว
3. cache catalog โมเดลจากการ refresh อย่างชัดเจน
4. แถว preview ในดัชนีผู้ให้บริการของ OpenClaw

ดัชนีผู้ให้บริการต้องไม่มี secret, สถานะเปิดใช้งาน, hook รันไทม์ หรือ
ข้อมูลโมเดลสดที่เฉพาะบัญชี catalog แบบ preview ของดัชนีใช้รูปแบบแถวผู้ให้บริการ
`modelCatalog` เดียวกับ manifest ของ Plugin แต่ควรจำกัดไว้ที่
metadata สำหรับแสดงผลที่เสถียร เว้นแต่ตั้งใจจัดให้ฟิลด์ adapter รันไทม์ เช่น `api`,
`baseUrl`, ราคา หรือ flag ความเข้ากันได้ สอดคล้องกับ
manifest ของ Plugin ที่ติดตั้งแล้ว ผู้ให้บริการที่มีการค้นพบ `/models` แบบสดควร
เขียนแถวที่ refresh แล้วผ่าน path cache catalog โมเดลอย่างชัดเจนแทนการ
ทำให้การแสดงรายการปกติหรือ onboarding เรียก API ของผู้ให้บริการ

รายการในดัชนีผู้ให้บริการอาจมี metadata ของ Plugin ที่ติดตั้งได้สำหรับผู้ให้บริการ
ที่ย้ายออกจากแกนหลักหรือยังไม่ได้ติดตั้งด้วย metadata นี้
สะท้อนรูปแบบ catalog ของช่องทาง: ชื่อ package, spec การติดตั้ง npm,
integrity ที่คาดหวัง และป้ายตัวเลือก auth แบบประหยัด เพียงพอสำหรับแสดง
ตัวเลือกการตั้งค่าที่ติดตั้งได้ เมื่อ Plugin ติดตั้งแล้ว manifest ของมันจะชนะ และ
รายการดัชนีผู้ให้บริการจะถูกละเว้นสำหรับผู้ให้บริการนั้น

key ความสามารถระดับบนแบบ legacy เลิกใช้แล้ว ใช้ `openclaw doctor --fix` เพื่อ
ย้าย `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` และ `webSearchProviders` ไปไว้ใต้ `contracts`; การโหลด
manifest ตามปกติจะไม่ถือว่าฟิลด์ระดับบนเหล่านั้นเป็นเจ้าของความสามารถอีกต่อไป

## Manifest เทียบกับ package.json

สองไฟล์นี้ทำหน้าที่ต่างกัน:

| ไฟล์                  | ใช้สำหรับ                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | การค้นพบ การตรวจสอบการตั้งค่า metadata ตัวเลือก auth และ hint ของ UI ที่ต้องมีอยู่ก่อนโค้ด Plugin ทำงาน                         |
| `package.json`         | metadata ของ npm การติดตั้ง dependency และบล็อก `openclaw` ที่ใช้สำหรับ entrypoint, การกั้นการติดตั้ง, setup หรือ metadata catalog |

หากไม่แน่ใจว่า metadata ชิ้นหนึ่งควรอยู่ที่ใด ให้ใช้กฎนี้:

- ถ้า OpenClaw ต้องรู้ก่อนโหลดโค้ด Plugin ให้ใส่ไว้ใน `openclaw.plugin.json`
- ถ้าเกี่ยวกับ packaging, ไฟล์ entry หรือพฤติกรรมการติดตั้ง npm ให้ใส่ไว้ใน `package.json`

### ฟิลด์ package.json ที่มีผลต่อการค้นพบ

metadata ของ Plugin บางอย่างก่อนรันไทม์ตั้งใจให้อยู่ใน `package.json` ใต้บล็อก
`openclaw` แทนที่จะอยู่ใน `openclaw.plugin.json`

ตัวอย่างสำคัญ:

| ฟิลด์                                                             | ความหมาย                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ประกาศจุดเข้าใช้งาน Plugin แบบเนทีฟ ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin                                                                                                   |
| `openclaw.runtimeExtensions`                                      | ประกาศจุดเข้าใช้งานรันไทม์ JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin                                                                 |
| `openclaw.setupEntry`                                             | จุดเข้าใช้งานเฉพาะการตั้งค่าแบบเบา ใช้ระหว่างการเริ่มใช้งาน การเริ่มต้นช่องทางแบบหน่วงเวลา และการค้นหาสถานะช่องทาง/SecretRef แบบอ่านอย่างเดียว ต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin |
| `openclaw.runtimeSetupEntry`                                      | ประกาศจุดเข้าใช้งานการตั้งค่า JavaScript ที่ build แล้วสำหรับแพ็กเกจที่ติดตั้ง ต้องมี `setupEntry`, ต้องมีอยู่จริง และต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin                         |
| `openclaw.channel`                                                | เมตาดาทาแค็ตตาล็อกช่องทางแบบเบา เช่น ป้ายกำกับ พาธเอกสาร นามแฝง และข้อความสำหรับการเลือก                                                                                                 |
| `openclaw.channel.commands`                                       | เมตาดาทาคำสั่งเนทีฟแบบคงที่และค่าเริ่มต้นอัตโนมัติของ Skills เนทีฟที่ใช้โดยพื้นผิว config, audit และรายการคำสั่งก่อนที่รันไทม์ช่องทางจะโหลด                                          |
| `openclaw.channel.configuredState`                                | เมตาดาทาตัวตรวจสอบสถานะการตั้งค่าแบบเบาที่ตอบได้ว่า "มีการตั้งค่าเฉพาะ env อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางเต็ม                                         |
| `openclaw.channel.persistedAuthState`                             | เมตาดาทาตัวตรวจสอบ auth ที่บันทึกคงอยู่แบบเบาที่ตอบได้ว่า "มีอะไรที่ลงชื่อเข้าใช้อยู่แล้วหรือไม่?" โดยไม่ต้องโหลดรันไทม์ช่องทางเต็ม                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | คำใบ้สำหรับการติดตั้ง/อัปเดต Plugin ที่ bundled และที่เผยแพร่ภายนอก                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | พาธการติดตั้งที่ต้องการเมื่อมีแหล่งติดตั้งหลายแหล่งให้ใช้                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | เวอร์ชันโฮสต์ OpenClaw ต่ำสุดที่รองรับ โดยใช้ semver floor เช่น `>=2026.3.22` หรือ `>=2026.5.1-beta.1`                                                                             |
| `openclaw.install.expectedIntegrity`                              | สตริง integrity ของ npm dist ที่คาดไว้ เช่น `sha512-...`; โฟลว์การติดตั้งและอัปเดตจะตรวจสอบอาร์ติแฟกต์ที่ดึงมากับค่านี้                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | อนุญาตพาธการกู้คืนด้วยการติดตั้ง Plugin ที่ bundled ใหม่แบบจำกัด เมื่อ config ไม่ถูกต้อง                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | ให้พื้นผิวช่องทางเฉพาะการตั้งค่าโหลดก่อน Plugin ช่องทางเต็มระหว่างการเริ่มต้น                                                                                                 |

เมตาดาทา manifest ตัดสินใจว่าตัวเลือก provider/ช่องทาง/การตั้งค่าใดจะปรากฏใน
การเริ่มใช้งานก่อนที่รันไทม์จะโหลด `package.json#openclaw.install` บอก
การเริ่มใช้งานว่าจะดึงหรือเปิดใช้ Plugin นั้นอย่างไรเมื่อผู้ใช้เลือกหนึ่งใน
ตัวเลือกเหล่านั้น อย่าย้ายคำใบ้การติดตั้งไปไว้ใน `openclaw.plugin.json`

`openclaw.install.minHostVersion` ถูกบังคับใช้ระหว่างการติดตั้งและการโหลด
registry manifest สำหรับแหล่ง Plugin ที่ไม่ได้ bundled ค่าที่ไม่ถูกต้องจะถูกปฏิเสธ;
ค่าที่ใหม่กว่าแต่ถูกต้องจะข้าม Plugin ภายนอกบนโฮสต์ที่เก่ากว่า แหล่ง Plugin
ที่ bundled จะถือว่าเป็นเวอร์ชันเดียวกับ checkout ของโฮสต์

การ pin เวอร์ชัน npm แบบเจาะจงมีอยู่แล้วใน `npmSpec` เช่น
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` รายการแค็ตตาล็อกภายนอกอย่างเป็นทางการ
ควรจับคู่ spec แบบเจาะจงกับ `expectedIntegrity` เพื่อให้โฟลว์อัปเดตล้มเหลวแบบปิด
หากอาร์ติแฟกต์ npm ที่ดึงมาไม่ตรงกับ release ที่ pin อีกต่อไป
การเริ่มใช้งานแบบโต้ตอบยังคงเสนอ npm spec จาก registry ที่เชื่อถือ รวมถึงชื่อ
แพ็กเกจเปล่าและ dist-tag เพื่อความเข้ากันได้ การวินิจฉัยแค็ตตาล็อกสามารถ
แยกแยะระหว่างแหล่งที่เจาะจง, ลอยตัว, pin ด้วย integrity, ขาด integrity, ชื่อแพ็กเกจ
ไม่ตรงกัน และ default-choice ไม่ถูกต้อง นอกจากนี้ยังเตือนเมื่อมี
`expectedIntegrity` แต่ไม่มีแหล่ง npm ที่ถูกต้องให้ pin ได้
เมื่อมี `expectedIntegrity`
โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้ค่านั้น; เมื่อไม่มี การ resolve registry จะถูก
บันทึกโดยไม่มี integrity pin

Plugin ช่องทางควรมี `openclaw.setupEntry` เมื่อสถานะ รายการช่องทาง
หรือการสแกน SecretRef จำเป็นต้องระบุบัญชีที่ตั้งค่าไว้โดยไม่โหลดรันไทม์เต็ม
จุดเข้าใช้งานการตั้งค่าควรเปิดเผยเมตาดาทาช่องทางพร้อม config, สถานะ และ
adapter secrets ที่ปลอดภัยสำหรับการตั้งค่า; เก็บไคลเอนต์เครือข่าย, listener ของ Gateway และ
รันไทม์ transport ไว้ในจุดเข้าใช้งาน extension หลัก

ฟิลด์จุดเข้าใช้งานรันไทม์ไม่ override การตรวจสอบขอบเขตแพ็กเกจสำหรับฟิลด์
จุดเข้าใช้งานซอร์ส ตัวอย่างเช่น `openclaw.runtimeExtensions` ไม่สามารถทำให้
พาธ `openclaw.extensions` ที่หลุดออกนอกขอบเขตโหลดได้

`openclaw.install.allowInvalidConfigRecovery` ถูกตั้งใจให้แคบโดยเฉพาะ มัน
ไม่ได้ทำให้ config ที่เสียแบบใดก็ได้ติดตั้งได้ ปัจจุบันอนุญาตเฉพาะโฟลว์ติดตั้ง
ให้กู้คืนจากความล้มเหลวเฉพาะจากการอัปเกรด Plugin ที่ bundled ที่ค้างอยู่ เช่น
พาธ Plugin ที่ bundled หายไป หรือรายการ `channels.<id>` ที่ค้างสำหรับ
Plugin ที่ bundled เดียวกันนั้น ข้อผิดพลาด config ที่ไม่เกี่ยวข้องยังคงบล็อกการติดตั้งและส่งผู้ดูแล
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

ใช้เมื่อโฟลว์การตั้งค่า, doctor, สถานะ หรือ presence แบบอ่านอย่างเดียวต้องการ probe
auth แบบใช่/ไม่ใช่ที่เบา ก่อนที่ Plugin ช่องทางเต็มจะโหลด สถานะ auth ที่บันทึกคงอยู่ไม่ใช่
สถานะช่องทางที่ตั้งค่าแล้ว: อย่าใช้เมตาดาทานี้เพื่อเปิดใช้ Plugin โดยอัตโนมัติ,
ซ่อม dependency รันไทม์ หรือชี้ขาดว่ารันไทม์ช่องทางควรโหลดหรือไม่
export เป้าหมายควรเป็นฟังก์ชันขนาดเล็กที่อ่านเฉพาะสถานะที่บันทึกคงอยู่; อย่า
ส่งผ่าน barrel ของรันไทม์ช่องทางเต็ม

`openclaw.channel.configuredState` ใช้รูปแบบเดียวกันสำหรับการตรวจสอบการตั้งค่า
เฉพาะ env แบบเบา:

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

ใช้เมื่อช่องทางสามารถตอบสถานะการตั้งค่าจาก env หรืออินพุตขนาดเล็กอื่นที่ไม่ใช่รันไทม์
ได้ หากการตรวจสอบต้องการการ resolve config แบบเต็มหรือรันไทม์ช่องทางจริง
ให้เก็บตรรกะนั้นไว้ใน hook `config.hasConfiguredState` ของ Plugin แทน

## ลำดับความสำคัญในการค้นพบ (id Plugin ซ้ำ)

OpenClaw ค้นพบ Plugin จาก root หลายแห่ง (bundled, การติดตั้งแบบ global, workspace, พาธที่เลือกจาก config แบบชัดเจน) หากการค้นพบสองรายการใช้ `id` เดียวกัน จะเก็บเฉพาะ manifest ที่มี **ลำดับความสำคัญสูงสุด**; รายการซ้ำที่มีลำดับความสำคัญต่ำกว่าจะถูกทิ้งแทนที่จะโหลดข้างกัน

ลำดับความสำคัญ จากสูงสุดไปต่ำสุด:

1. **เลือกจาก config** — พาธที่ pin ไว้อย่างชัดเจนใน `plugins.entries.<id>`
2. **Bundled** — Plugin ที่มาพร้อมกับ OpenClaw
3. **การติดตั้งแบบ global** — Plugin ที่ติดตั้งลงใน root Plugin แบบ global ของ OpenClaw
4. **Workspace** — Plugin ที่ค้นพบโดยสัมพันธ์กับ workspace ปัจจุบัน

ผลที่ตามมา:

- สำเนา fork หรือสำเนาเก่าของ Plugin ที่ bundled ที่อยู่ใน workspace จะไม่ shadow build ที่ bundled
- หากต้องการ override Plugin ที่ bundled ด้วยตัว local จริง ๆ ให้ pin ผ่าน `plugins.entries.<id>` เพื่อให้ชนะด้วยลำดับความสำคัญ แทนการพึ่งพาการค้นพบจาก workspace
- การทิ้งรายการซ้ำจะถูกบันทึก log เพื่อให้ Doctor และการวินิจฉัยการเริ่มต้นชี้ไปยังสำเนาที่ถูกทิ้งได้
- override รายการซ้ำที่เลือกจาก config จะถูกอธิบายในการวินิจฉัยว่าเป็น override แบบชัดเจน แต่ยังคงเตือนเพื่อให้ fork เก่าและ shadow ที่เกิดโดยไม่ตั้งใจยังมองเห็นได้

## ข้อกำหนดของ JSON Schema

- **ทุก Plugin ต้องมาพร้อม JSON Schema** แม้ว่าจะไม่รับ config ก็ตาม
- schema ว่างเป็นสิ่งที่ยอมรับได้ (เช่น `{ "type": "object", "additionalProperties": false }`)
- schema ถูกตรวจสอบความถูกต้องตอนอ่าน/เขียน config ไม่ใช่ตอนรันไทม์
- เมื่อขยายหรือ fork Plugin ที่ bundled ด้วยคีย์ config ใหม่ ให้อัปเดต `configSchema` ใน `openclaw.plugin.json` ของ Plugin นั้นพร้อมกัน schema ของ Plugin ที่ bundled เป็นแบบเข้มงวด ดังนั้นการเพิ่ม `plugins.entries.<id>.config.myNewKey` ใน config ผู้ใช้โดยไม่เพิ่ม `myNewKey` ลงใน `configSchema.properties` จะถูกปฏิเสธก่อนที่รันไทม์ Plugin จะโหลด

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
- หากติดตั้ง Plugin แล้วแต่ manifest หรือ schema เสียหรือขาดหาย
  การตรวจสอบความถูกต้องจะล้มเหลว และ Doctor จะรายงานข้อผิดพลาดของ Plugin
- หากมี config ของ Plugin แต่ Plugin ถูก **ปิดใช้งาน** config จะถูกเก็บไว้และ
  **คำเตือน** จะแสดงใน Doctor + logs

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration) สำหรับ schema `plugins.*` ฉบับเต็ม

## หมายเหตุ

- manifest เป็นสิ่งที่**จำเป็นสำหรับ Plugin ดั้งเดิมของ OpenClaw** รวมถึงการโหลดจากระบบไฟล์ภายในเครื่อง runtime ยังคงโหลดโมดูล Plugin แยกต่างหาก ส่วน manifest ใช้สำหรับการค้นพบ + การตรวจสอบความถูกต้องเท่านั้น
- manifest ดั้งเดิมจะถูกแยกวิเคราะห์ด้วย JSON5 ดังนั้นจึงรองรับความคิดเห็น จุลภาคท้ายรายการ และคีย์ที่ไม่ใส่เครื่องหมายคำพูด ตราบใดที่ค่าสุดท้ายยังคงเป็นออบเจ็กต์
- ตัวโหลด manifest จะอ่านเฉพาะฟิลด์ manifest ที่มีเอกสารกำกับไว้เท่านั้น หลีกเลี่ยงคีย์ระดับบนสุดแบบกำหนดเอง
- `channels`, `providers`, `cliBackends` และ `skills` สามารถละไว้ทั้งหมดได้เมื่อ Plugin ไม่ต้องใช้
- `providerDiscoveryEntry` ต้องคงความเบาและไม่ควรนำเข้าโค้ด runtime ขนาดใหญ่ ใช้สำหรับเมตาดาทาแค็ตตาล็อกผู้ให้บริการแบบสแตติกหรือตัวอธิบายการค้นพบแบบจำกัด ไม่ใช่การประมวลผลในช่วงเวลาคำขอ
- ประเภท Plugin แบบเอกสิทธิ์จะถูกเลือกผ่าน `plugins.slots.*`: `kind: "memory"` ผ่าน `plugins.slots.memory`, `kind: "context-engine"` ผ่าน `plugins.slots.contextEngine` (ค่าเริ่มต้น `legacy`)
- ประกาศประเภท Plugin แบบเอกสิทธิ์ใน manifest นี้ `OpenClawPluginDefinition.kind` ในรายการเข้า runtime เลิกใช้แล้ว และยังคงมีอยู่เฉพาะเป็นทางเลือกสำรองเพื่อความเข้ากันได้สำหรับ Plugin รุ่นเก่า
- เมตาดาทา env-var (`setup.providers[].envVars`, `providerAuthEnvVars` ที่เลิกใช้แล้ว และ `channelEnvVars`) เป็นเชิงประกาศเท่านั้น สถานะ การตรวจสอบ การตรวจสอบความถูกต้องของการส่งมอบ cron และพื้นผิวแบบอ่านอย่างเดียวอื่นๆ ยังคงใช้นโยบายความเชื่อถือของ Plugin และการเปิดใช้งานจริงก่อนถือว่า env var ถูกกำหนดค่าแล้ว
- สำหรับเมตาดาทาตัวช่วยตั้งค่า runtime ที่ต้องใช้โค้ดผู้ให้บริการ โปรดดู [hook runtime ของผู้ให้บริการ](/th/plugins/architecture-internals#provider-runtime-hooks)
- หาก Plugin ของคุณพึ่งพาโมดูลดั้งเดิม ให้จัดทำเอกสารขั้นตอนการ build และข้อกำหนด allowlist ของตัวจัดการแพ็กเกจใดๆ (เช่น pnpm `allow-build-scripts` + `pnpm rebuild <package>`)

## ที่เกี่ยวข้อง

<CardGroup cols={3}>
  <Card title="การสร้าง Plugin" href="/th/plugins/building-plugins" icon="rocket">
    เริ่มต้นใช้งาน Plugin
  </Card>
  <Card title="สถาปัตยกรรม Plugin" href="/th/plugins/architecture" icon="diagram-project">
    สถาปัตยกรรมภายในและโมเดลความสามารถ
  </Card>
  <Card title="ภาพรวม SDK" href="/th/plugins/sdk-overview" icon="book">
    เอกสารอ้างอิง SDK ของ Plugin และการนำเข้า subpath
  </Card>
</CardGroup>
