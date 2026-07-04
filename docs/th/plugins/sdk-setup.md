---
read_when:
    - คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจ setup-entry.ts กับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมตาดาต้า openclaw ใน package.json
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, สคีมาคอนฟิก และเมตาดาต้า package.json
title: Plugin การตั้งค่าและการกำหนดค่า
x-i18n:
    generated_at: "2026-07-04T15:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (เมทาดาทา `package.json`), manifest (`openclaw.plugin.json`), รายการตั้งค่า และสคีมาคอนฟิก

<Tip>
**กำลังมองหาคำแนะนำทีละขั้นตอนอยู่หรือไม่** คู่มือวิธีทำอธิบายการแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมทาดาทาของแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า Plugin ของคุณให้อะไร:

<Tabs>
  <Tab title="Channel plugin">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นเป็นฟิลด์ที่จำเป็น ส่วน snippet สำหรับเผยแพร่ที่เป็นแหล่งอ้างอิงหลักอยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์จุดเข้าใช้งาน (สัมพันธ์กับรากแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  รายการเฉพาะการตั้งค่าแบบเบา (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาทาแค็ตตาล็อกช่องทางสำหรับพื้นผิวการตั้งค่า ตัวเลือก quickstart และสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  id ของผู้ให้บริการที่ Plugin นี้ลงทะเบียนไว้
</ParamField>
<ParamField path="install" type="object">
  คำใบ้การติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กลักษณะการทำงานตอนเริ่มต้น
</ParamField>

### `openclaw.channel`

`openclaw.channel` คือเมทาดาทาแพ็กเกจราคาถูกสำหรับการค้นพบช่องทางและพื้นผิวการตั้งค่าก่อนที่รันไทม์จะโหลด

| ฟิลด์                                  | ประเภท       | ความหมาย                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทางที่เป็นมาตรฐาน                                                      |
| `label`                                | `string`   | ป้ายชื่อช่องทางหลัก                                                           |
| `selectionLabel`                       | `string`   | ป้ายชื่อในตัวเลือก/การตั้งค่าเมื่อควรต่างจาก `label`                         |
| `detailLabel`                          | `string`   | ป้ายรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ขึ้น       |
| `docsPath`                             | `string`   | เส้นทางเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                                |
| `docsLabel`                            | `string`   | ป้ายชื่อทับค่าที่ใช้สำหรับลิงก์เอกสารเมื่อควรต่างจาก id ช่องทาง              |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับการเริ่มใช้งาน/แค็ตตาล็อก                                  |
| `order`                                | `number`   | ลำดับการจัดเรียงในแค็ตตาล็อกช่องทาง                                           |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับการค้นหาการเลือกช่องทาง                                  |
| `preferOver`                           | `string[]` | id Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า    |
| `systemImage`                          | `string`   | ชื่อไอคอน/ภาพระบบแบบไม่บังคับสำหรับแค็ตตาล็อก UI ของช่องทาง                  |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                                    |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงเส้นทางเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายชื่อในข้อความการเลือก         |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                                |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | การควบคุมการมองเห็นช่องทางสำหรับการตั้งค่า รายการที่คอนฟิกแล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้เข้าสู่โฟลว์การตั้งค่า quickstart `allowFrom` มาตรฐาน      |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีบัญชีอยู่เพียงบัญชีเดียว                    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ให้ความสำคัญกับการค้นหาเซสชันเมื่อแก้ target สำหรับประกาศของช่องทางนี้      |

ตัวอย่าง:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` รองรับ:

- `configured`: รวมช่องทางไว้ในพื้นผิวรายการแบบคอนฟิกแล้ว/สถานะ
- `setup`: รวมช่องทางไว้ในตัวเลือกการตั้งค่า/คอนฟิกแบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางว่าแสดงต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias แบบเดิม แนะนำให้ใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` คือเมทาดาทาแพ็กเกจ ไม่ใช่เมทาดาทา manifest

| ฟิลด์                        | ประเภท                                | ความหมาย                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | spec ClawHub ที่เป็นมาตรฐานสำหรับโฟลว์ติดตั้ง/อัปเดต และติดตั้งตามต้องการระหว่างเริ่มใช้งาน |
| `npmSpec`                    | `string`                            | spec npm ที่เป็นมาตรฐานสำหรับโฟลว์สำรองการติดตั้ง/อัปเดต                         |
| `localPath`                  | `string`                            | เส้นทางติดตั้งสำหรับการพัฒนาในเครื่องหรือแบบ bundled                             |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่แนะนำเมื่อมีหลายแหล่งให้ใช้                                        |
| `minHostVersion`             | `string`                            | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับในรูปแบบ `>=x.y.z` หรือ `>=x.y.z-prerelease`   |
| `expectedIntegrity`          | `string`                            | สตริง integrity ของ npm dist ที่คาดไว้ โดยปกติคือ `sha512-...` สำหรับการติดตั้งแบบปักหมุด |
| `allowInvalidConfigRecovery` | `boolean`                           | ให้โฟลว์ติดตั้ง Plugin แบบ bundled ซ้ำกู้คืนจากความล้มเหลวของคอนฟิกค้างบางกรณีได้ |
| `requiredPlatformPackages`   | `string[]`                          | alias npm เฉพาะแพลตฟอร์มที่จำเป็นซึ่งตรวจสอบระหว่างการติดตั้ง npm               |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    การเริ่มใช้งานแบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิวติดตั้งตามต้องการด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของผู้ให้บริการหรือเมทาดาทาการตั้งค่า/แค็ตตาล็อกช่องทางก่อนที่รันไทม์จะโหลด การเริ่มใช้งานสามารถแสดงตัวเลือกนั้น ถามหา ClawHub, npm หรือการติดตั้งในเครื่อง ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนินโฟลว์ที่เลือกต่อ ตัวเลือกการเริ่มใช้งาน ClawHub ใช้ `clawhubSpec` และจะถูกเลือกก่อนเมื่อมีอยู่ ตัวเลือก npm ต้องมีเมทาดาทาแค็ตตาล็อกที่เชื่อถือได้พร้อม registry `npmSpec` ส่วนเวอร์ชันแบบระบุแน่นอนและ `expectedIntegrity` เป็นการปักหมุด npm ที่ไม่บังคับ หากมี `expectedIntegrity` โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้กับ npm เก็บเมทาดาทา “จะแสดงอะไร” ไว้ใน `openclaw.plugin.json` และเมทาดาทา “จะติดตั้งอย่างไร” ไว้ใน `package.json`
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    หากตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลด manifest-registry แบบไม่ bundled จะบังคับใช้ โฮสต์รุ่นเก่าจะข้าม Plugin ภายนอก สตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ Plugin ซอร์สแบบ bundled ถือว่ามีเวอร์ชันเดียวกับ checkout ของโฮสต์
  </Accordion>
  <Accordion title="Pinned npm installs">
    สำหรับการติดตั้ง npm แบบปักหมุด ให้เก็บเวอร์ชันที่แน่นอนไว้ใน `npmSpec` และเพิ่ม integrity ของอาร์ติแฟกต์ที่คาดไว้:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` ไม่ใช่ทางข้ามทั่วไปสำหรับคอนฟิกที่เสีย ฟิลด์นี้มีไว้สำหรับการกู้คืน Plugin แบบ bundled ในขอบเขตแคบเท่านั้น เพื่อให้การติดตั้งซ้ำ/การตั้งค่าสามารถซ่อมเศษตกค้างจากการอัปเกรดที่รู้จัก เช่น เส้นทาง Plugin แบบ bundled ที่หายไป หรือรายการ `channels.<id>` ค้างสำหรับ Plugin เดียวกันนั้น หากคอนฟิกเสียด้วยเหตุผลที่ไม่เกี่ยวข้อง การติดตั้งยังคง fail closed และบอกให้ผู้ปฏิบัติงานรัน `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนโหลดเต็มรูปแบบ

Plugin ช่องทางสามารถเลือกใช้การเลื่อนโหลดได้ด้วย:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างเฟสเริ่มต้นก่อน listen แม้สำหรับช่องทางที่คอนฟิกไว้แล้ว รายการเต็มจะโหลดหลังจาก Gateway เริ่ม listen แล้ว

<Warning>
เปิดใช้การเลื่อนโหลดเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ Gateway ต้องใช้ก่อนเริ่ม listen (การลงทะเบียนช่องทาง, เส้นทาง HTTP, เมธอด Gateway) หากรายการเต็มเป็นเจ้าของความสามารถตอนเริ่มต้นที่จำเป็น ให้ใช้พฤติกรรมเริ่มต้นต่อไป
</Warning>

หากรายการตั้งค่า/รายการเต็มของคุณลงทะเบียนเมธอด RPC ของ Gateway ให้เก็บไว้บน prefix เฉพาะ Plugin namespace ผู้ดูแล core ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และจะแก้ไปที่ `operator.admin` เสมอ

## manifest ของ Plugin

Plugin แบบ native ทุกตัวต้องส่ง `openclaw.plugin.json` ในรากแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบคอนฟิกโดยไม่ต้องเรียกใช้โค้ด Plugin

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

สำหรับ Plugin ช่องทาง ให้เพิ่ม `kind` และ `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

แม้แต่ Plugin ที่ไม่มี config ก็ต้องมาพร้อม schema. schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [manifest ของ Plugin](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง schema ฉบับเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias เผยแพร่แบบเดิมที่มีเฉพาะ skill ใช้สำหรับ skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## จุดเข้าการตั้งค่า

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาสำหรับ `index.ts` ที่ OpenClaw โหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่าเท่านั้น (onboarding, การซ่อม config, การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ด runtime ที่หนัก (ไลบรารี crypto, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่าง flow การตั้งค่า

ช่องทางใน workspace ที่ bundle มาด้วย ซึ่งเก็บ export ที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ contract แบบ bundle นั้นยังรองรับ export `runtime` ที่เป็นทางเลือก เพื่อให้การต่อสาย runtime ณ เวลา setup ยังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry เต็ม">
    - ช่องทางถูกปิดใช้งานแต่ต้องใช้พื้นผิวการตั้งค่า/onboarding
    - ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า
    - เปิดใช้การโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - อ็อบเจกต์ Plugin ของช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - HTTP route ใดๆ ที่ต้องใช้ก่อน Gateway listen
    - เมธอด Gateway ใดๆ ที่จำเป็นระหว่าง startup

    เมธอด Gateway ตอน startup เหล่านั้นยังควรหลีกเลี่ยง namespace ผู้ดูแล core ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวมไว้">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - import runtime ที่หนัก (crypto, SDK)
    - เมธอด Gateway ที่จำเป็นหลัง startup เท่านั้น

  </Accordion>
</AccordionGroup>

### import helper การตั้งค่าแบบแคบ

สำหรับ path ที่ร้อนและใช้เฉพาะการตั้งค่า ให้เลือก seam helper การตั้งค่าแบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิวการตั้งค่า:

| path การ import                    | ใช้สำหรับ                                                                                 | export สำคัญ                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime ณ เวลา setup ที่ยังพร้อมใช้ใน `setupEntry` / startup ช่องทางแบบเลื่อนเวลา | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime`                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper สำหรับ setup/install CLI/archive/docs                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการชุดเครื่องมือการตั้งค่าที่แชร์ทั้งหมด รวมถึง helper สำหรับ config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

ใช้ `createSetupTranslator(...)` สำหรับข้อความ wizard การตั้งค่าแบบคงที่ โดยจะใช้ locale ของ
wizard CLI (`OPENCLAW_LOCALE` แล้วจึงใช้ตัวแปร locale ของระบบ) และ fallback
เป็นภาษาอังกฤษ เก็บข้อความการตั้งค่าเฉพาะ Plugin ไว้ในโค้ดที่ Plugin เป็นเจ้าของ และใช้
key catalog ที่แชร์เฉพาะสำหรับ label การตั้งค่าทั่วไป ข้อความสถานะ และข้อความการตั้งค่า
ของ Plugin ทางการที่ bundle มาด้วย

adapter patch การตั้งค่ายังคงปลอดภัยสำหรับ hot path เมื่อ import การ lookup contract-surface สำหรับการโปรโมต single-account ที่ bundle มาด้วยเป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลด bundled contract-surface discovery ล่วงหน้าก่อนที่ adapter จะถูกใช้งานจริง

### การโปรโมต single-account ที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนแบบ single-account ไปเป็น `channels.<id>.accounts.*` พฤติกรรมที่แชร์โดยค่าเริ่มต้นคือย้ายค่าที่มี scope เป็น account ที่ถูกโปรโมตไปยัง `accounts.default`

ช่องทางที่ bundle มาด้วยสามารถจำกัดหรือ override การโปรโมตนั้นผ่านพื้นผิว contract การตั้งค่าของตน:

- `singleAccountKeysToMove`: key ระดับบนเพิ่มเติมที่ควรย้ายเข้าไปใน account ที่ถูกโปรโมต
- `namedAccountPromotionKeys`: เมื่อมี named account อยู่แล้ว เฉพาะ key เหล่านี้เท่านั้นที่จะย้ายเข้าไปใน account ที่ถูกโปรโมต; key policy/delivery ที่แชร์จะอยู่ที่ root ของช่องทางต่อไป
- `resolveSingleAccountPromotionTarget(...)`: เลือก account ที่มีอยู่ซึ่งจะรับค่าที่ถูกโปรโมต

<Note>
Matrix คือตัวอย่างที่ bundle มาด้วยในปัจจุบัน หากมี named Matrix account อยู่แล้วเพียงหนึ่งรายการพอดี หรือหาก `defaultAccount` ชี้ไปยัง key ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การโปรโมตจะเก็บ account นั้นไว้แทนที่จะสร้าง entry `accounts.default` ใหม่
</Note>

## Config schema

config ของ Plugin จะถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้กำหนดค่า Plugin ผ่าน:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin ของคุณได้รับ config นี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับ config เฉพาะช่องทาง ให้ใช้ส่วน config ของช่องทางแทน:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### การสร้าง channel config schema

ใช้ `buildChannelConfigSchema` เพื่อแปลง Zod schema เป็น wrapper `ChannelConfigSchema` ที่ใช้โดย artifact config ที่ Plugin เป็นเจ้าของ:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

หากคุณเขียน contract เป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ helper โดยตรงเพื่อให้ OpenClaw ข้ามการแปลง Zod-to-JSON-Schema บน path metadata ได้:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

สำหรับ Plugin ภายนอก contract แบบ cold-path ยังคงเป็น manifest ของ Plugin: mirror JSON Schema ที่สร้างแล้วไปยัง `openclaw.plugin.json#channelConfigs` เพื่อให้ config schema, setup และพื้นผิว UI ตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## Wizard การตั้งค่า

Plugin ช่องทางสามารถจัดหา wizard การตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ wizard คืออ็อบเจกต์ `ChannelSetupWizard` บน `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

type `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่นๆ ดูตัวอย่างเต็มได้จากแพ็กเกจ Plugin ที่ bundle มาด้วย (เช่น Plugin Discord `src/channel.setup.ts`)

<AccordionGroup>
  <Accordion title="prompt allowFrom ที่แชร์">
    สำหรับ prompt allowlist ของ DM ที่ต้องใช้เฉพาะ flow มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือก helper การตั้งค่าที่แชร์จาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับ block สถานะการตั้งค่าช่องทางที่ต่างกันเพียง label, score และบรรทัดเพิ่มเติมที่เป็นทางเลือก ให้เลือก `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการเขียนอ็อบเจกต์ `status` แบบเดียวกันเองในแต่ละ Plugin
  </Accordion>
  <Accordion title="พื้นผิวการตั้งค่าช่องทางที่เป็นทางเลือก">
    สำหรับพื้นผิวการตั้งค่าที่เป็นทางเลือกซึ่งควรแสดงเฉพาะในบางบริบท ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` ยังเปิดเผย builder ระดับต่ำกว่าอย่าง `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของพื้นผิว optional-install นั้น

    adapter/wizard ที่สร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง โดยจะใช้ข้อความ install-required เดียวกันซ้ำใน `validateInput`, `applyAccountConfig` และ `finalize` และเพิ่มลิงก์ docs ต่อท้ายเมื่อมีการตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="helper การตั้งค่าที่มี binary รองรับ">
    สำหรับ UI การตั้งค่าที่มี binary รองรับ ให้เลือก helper แบบ delegated ที่แชร์ แทนการคัดลอก glue สำหรับ binary/status แบบเดียวกันเข้าไปในทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเฉพาะป้ายกำกับ คำใบ้ คะแนน และการตรวจจับไบนารี
    - `createCliPathTextInput(...)` สำหรับอินพุตข้อความที่อิงพาธ
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยังวิซาร์ดแบบเต็มที่หนักกว่าแบบ lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องมอบหมายเฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/clawhub) แล้วติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    สเป็กแพ็กเกจแบบเปล่าจะติดตั้งจาก npm ในช่วงเปลี่ยนผ่านตอนเปิดตัว

  </Tab>
  <Tab title="เฉพาะ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="สเป็กแพ็กเกจ npm">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไปยัง ClawHub หรือเมื่อคุณต้องใช้
    เส้นทางติดตั้ง npm โดยตรงระหว่างการย้าย:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ในรีโป:** วางไว้ใต้ทรีเวิร์กสเปซ Plugin ที่รวมมาในชุด และระบบจะค้นพบโดยอัตโนมัติระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มีแหล่งที่มาจาก npm, `openclaw plugins install` จะติดตั้งแพ็กเกจลงในโปรเจกต์แยกต่อ Plugin ภายใต้ `~/.openclaw/npm/projects` โดยปิดใช้สคริปต์ lifecycle รักษาทรี dependency ของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้อง build ผ่าน `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway ไม่ได้ติดตั้ง dependency ของ Plugin โฟลว์การติดตั้ง npm/git/ClawHub เป็นเจ้าของการปรับ dependency ให้ตรงกัน ส่วน Plugin ในเครื่องต้องติดตั้ง dependency ของตัวเองไว้แล้ว
</Note>

เมทาดาทาของแพ็กเกจที่รวมมาในชุดเป็นแบบระบุชัดเจน ไม่ได้อนุมานจาก JavaScript ที่ build แล้วตอนเริ่มต้น Gateway dependency สำหรับ runtime อยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของ dependency นั้น การเริ่มต้น OpenClaw แบบแพ็กเกจจะไม่ซ่อมหรือมิเรอร์ dependency ของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นแบบทีละขั้น
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — ข้อมูลอ้างอิงสคีมาแมนิเฟสต์ฉบับเต็ม
- [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
