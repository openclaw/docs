---
read_when:
    - คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจความแตกต่างระหว่าง `setup-entry.ts` กับ `index.ts`
    - คุณกำลังกำหนดสคีมาคอนฟิกของ Plugin หรือเมทาดาทา `openclaw` ใน `package.json`
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, `setup-entry.ts`, สคีมาคอนฟิก และเมทาดาทา `package.json`
title: การตั้งค่าและคอนฟิกของ Plugin
x-i18n:
    generated_at: "2026-04-26T11:38:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (เมทาดาทา `package.json`), manifest (`openclaw.plugin.json`), setup entry และสคีมาคอนฟิก

<Tip>
**กำลังมองหาคำแนะนำแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบทการใช้งานจริง: [Channel plugins](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Provider plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมทาดาทาแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า Plugin ของคุณมีความสามารถอะไรบ้าง:

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
  <Tab title="Provider plugin / ค่าพื้นฐานของ ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นเป็นข้อกำหนดบังคับ snippet สำหรับการเผยแพร่ที่เป็นทางการอยู่ที่ `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์ entry point (อ้างอิงจากรากของแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  entry แบบเบาสำหรับการตั้งค่าเท่านั้น (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาทาแค็ตตาล็อก channel สำหรับพื้นผิวของการตั้งค่า ตัวเลือก quickstart และสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  provider id ที่ลงทะเบียนโดย Plugin นี้
</ParamField>
<ParamField path="install" type="object">
  คำแนะนำการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กพฤติกรรมการเริ่มต้นระบบ
</ParamField>

### `openclaw.channel`

`openclaw.channel` คือเมทาดาทาแพ็กเกจที่มีต้นทุนต่ำ สำหรับการค้นหา channel และพื้นผิวการตั้งค่าก่อนที่ runtime จะถูกโหลด

| ฟิลด์                                  | ชนิด       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `id`                                   | `string`   | channel id มาตรฐาน                                                      |
| `label`                                | `string`   | ป้ายชื่อหลักของ channel                                                 |
| `selectionLabel`                       | `string`   | ป้ายชื่อในตัวเลือก/การตั้งค่า เมื่อควรแตกต่างจาก `label`                |
| `detailLabel`                          | `string`   | ป้ายรายละเอียดรองสำหรับแค็ตตาล็อก channel และพื้นผิวสถานะที่มีข้อมูลมากขึ้น |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                               |
| `docsLabel`                            | `string`   | ป้ายชื่อแทนที่สำหรับลิงก์เอกสาร เมื่อควรต่างจาก channel id             |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                |
| `order`                                | `number`   | ลำดับการเรียงในแค็ตตาล็อก channel                                       |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับการค้นหา channel                                    |
| `preferOver`                           | `string[]` | plugin/channel id ที่มีลำดับความสำคัญต่ำกว่าซึ่ง channel นี้ควรอยู่เหนือกว่า |
| `systemImage`                          | `string`   | ชื่อไอคอน/ภาพระบบแบบไม่บังคับสำหรับแค็ตตาล็อก UI ของ channel           |
| `selectionDocsPrefix`                  | `string`   | ข้อความคำนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                             |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารแบบมีป้ายชื่อในข้อความการเลือก        |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                            |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่า channel รองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นของ channel สำหรับพื้นผิวการตั้งค่า รายการที่กำหนดค่าแล้ว และเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | เปิดให้ channel นี้ใช้โฟลว์การตั้งค่า `allowFrom` แบบ quickstart มาตรฐาน |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้ว่าจะมีเพียงบัญชีเดียว                  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ให้ใช้การค้นหาเซสชันก่อนเมื่อ resolve announce target ของ channel นี้    |

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

- `configured`: รวม channel นี้ไว้ในพื้นผิวรายการแบบ configured/status
- `setup`: รวม channel นี้ไว้ในตัวเลือกแบบโต้ตอบสำหรับการตั้งค่า/กำหนดค่า
- `docs`: ทำเครื่องหมายว่า channel นี้เป็นส่วนที่เปิดเผยต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับเป็น alias แบบเดิม ให้เลือกใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` เป็นเมทาดาทาของแพ็กเกจ ไม่ใช่เมทาดาทาของ manifest

| ฟิลด์                        | ชนิด                 | ความหมาย                                                                    |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec มาตรฐานสำหรับโฟลว์การติดตั้ง/อัปเดต                               |
| `localPath`                  | `string`             | พาธการติดตั้งแบบในเครื่องหรือแบบบันเดิล                                     |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีทั้งสองแบบ                                    |
| `minHostVersion`             | `string`             | เวอร์ชันขั้นต่ำของ OpenClaw ที่รองรับ ในรูปแบบ `>=x.y.z`                    |
| `expectedIntegrity`          | `string`             | สตริง integrity ของ npm dist ที่คาดไว้ โดยทั่วไปเป็น `sha512-...` สำหรับการติดตั้งแบบปักหมุด |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้โฟลว์ติดตั้ง Plugin ที่บันเดิลมาซ้ำสามารถกู้คืนจากความล้มเหลวของคอนฟิกเก่าบางกรณีได้ |

<AccordionGroup>
  <Accordion title="พฤติกรรม onboarding">
    onboarding แบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิวติดตั้งตามต้องการด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของ provider หรือเมทาดาทาการตั้งค่า/แค็ตตาล็อกของ channel ก่อนที่ runtime จะโหลด onboarding สามารถแสดงตัวเลือกนั้น พร้อมถามว่าจะติดตั้งจาก npm หรือ local จากนั้นติดตั้งหรือเปิดใช้ Plugin และดำเนินโฟลว์ที่เลือกต่อ ตัวเลือก onboarding ผ่าน npm ต้องใช้เมทาดาทาแค็ตตาล็อกที่เชื่อถือได้พร้อม `npmSpec` จากรีจิสทรี; เวอร์ชันแบบเจาะจงและ `expectedIntegrity` เป็นตัวปักหมุดแบบไม่บังคับ หากมี `expectedIntegrity` อยู่ โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้ค่าเหล่านั้น ให้เก็บเมทาดาทาประเภท "จะแสดงอะไร" ไว้ใน `openclaw.plugin.json` และเมทาดาทาประเภท "จะติดตั้งอย่างไร" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="การบังคับใช้ minHostVersion">
    หากตั้งค่า `minHostVersion` ไว้ ทั้งการติดตั้งและการโหลดรีจิสทรี manifest จะบังคับใช้ค่านี้ host ที่เก่ากว่าจะข้าม Plugin นั้นไป และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ
  </Accordion>
  <Accordion title="การติดตั้ง npm แบบปักหมุด">
    สำหรับการติดตั้ง npm แบบปักหมุด ให้คงเวอร์ชันแบบเจาะจงไว้ใน `npmSpec` และเพิ่ม integrity ของอาร์ติแฟกต์ที่คาดไว้:

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
  <Accordion title="ขอบเขตของ allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` ไม่ใช่ทางลัดทั่วไปสำหรับคอนฟิกที่เสียหาย มันมีไว้สำหรับการกู้คืนแบบเฉพาะเจาะจงของ Plugin ที่บันเดิลมาเท่านั้น เพื่อให้การติดตั้งซ้ำ/การตั้งค่าสามารถซ่อมของตกค้างจากการอัปเกรดที่ทราบได้ เช่น พาธของ Plugin ที่บันเดิลมาหายไป หรือรายการ `channels.<id>` ที่ค้างจาก Plugin เดียวกัน หากคอนฟิกเสียหายด้วยสาเหตุอื่น การติดตั้งจะยังคงล้มเหลวแบบ fail closed และแจ้งให้ผู้ดูแลระบบรัน `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนการโหลดแบบเต็ม

Channel plugins สามารถเลือกใช้การโหลดแบบเลื่อนได้ด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ในช่วงเริ่มต้นก่อน listen แม้กับ channel ที่กำหนดค่าไว้แล้ว entry แบบเต็มจะถูกโหลดหลังจาก gateway เริ่ม listen แล้ว

<Warning>
ให้เปิดใช้ deferred loading เฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ gateway ต้องใช้ก่อนเริ่ม listen แล้วเท่านั้น (การลงทะเบียน channel, HTTP routes, เมธอดของ gateway) หาก entry แบบเต็มเป็นเจ้าของความสามารถตอนเริ่มต้นที่จำเป็น ให้คงพฤติกรรมค่าเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียนเมธอด Gateway RPC ให้คงเมธอดเหล่านั้นไว้ภายใต้ prefix ที่เฉพาะกับ Plugin namespace ผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve ไปยัง `operator.admin` เสมอ

## manifest ของ Plugin

Plugin native ทุกตัวต้องมี `openclaw.plugin.json` อยู่ที่รากของแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบคอนฟิกโดยไม่ต้องรันโค้ดของ Plugin

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

สำหรับ Channel plugins ให้เพิ่ม `kind` และ `channels`:

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

แม้แต่ Plugin ที่ไม่มีคอนฟิกก็ต้องมี schema schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Plugin manifest](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง schema แบบเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub ที่เฉพาะกับแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias การเผยแพร่แบบเดิมที่ใช้ได้เฉพาะ Skills มีไว้สำหรับ Skills เท่านั้น แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาของ `index.ts` ที่ OpenClaw จะโหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่าเท่านั้น (onboarding, การซ่อมคอนฟิก, การตรวจสอบ channel ที่ถูกปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ด runtime ที่มีน้ำหนักมาก (ไลบรารี crypto, การลงทะเบียน CLI, background services) ระหว่างโฟลว์การตั้งค่า

สำหรับ bundled workspace channel ที่เก็บ export ที่ปลอดภัยต่อการตั้งค่าไว้ใน sidecar module สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ contract สำหรับ bundled นี้ยังรองรับ export `runtime` แบบไม่บังคับ เพื่อให้การเชื่อมต่อ runtime ตอนตั้งค่ายังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อใดที่ OpenClaw ใช้ setupEntry แทน full entry">
    - channel ถูกปิดใช้งาน แต่ยังต้องใช้พื้นผิวการตั้งค่า/onboarding
    - channel ถูกเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า
    - เปิดใช้ deferred loading (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
    - HTTP route ใด ๆ ที่จำเป็นก่อน gateway listen
    - gateway method ใด ๆ ที่จำเป็นระหว่างการเริ่มต้นระบบ

    gateway method สำหรับช่วงเริ่มต้นเหล่านั้นยังควรหลีกเลี่ยง namespace ผู้ดูแลระบบของ core ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวม">
    - การลงทะเบียน CLI
    - background services
    - import runtime ที่มีน้ำหนักมาก (crypto, SDK ต่าง ๆ)
    - gateway method ที่จำเป็นเฉพาะหลังเริ่มต้นระบบ

  </Accordion>
</AccordionGroup>

### import ของ setup helper แบบเจาะจง

สำหรับพาธร้อนที่ใช้เฉพาะการตั้งค่า ให้เลือกใช้ seam ของ setup helper แบบเจาะจงแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิวการตั้งค่า:

| พาธ import                        | ใช้สำหรับ                                                                                | export หลัก                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper ของ runtime ตอนตั้งค่าที่พร้อมใช้งานได้ใน `setupEntry` / deferred channel startup | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter สำหรับการตั้งค่าบัญชีที่รับรู้ environment                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                    |
| `plugin-sdk/setup-tools`           | helper สำหรับ setup/install CLI/archive/docs                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                            |

ให้ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการชุดเครื่องมือการตั้งค่าร่วมแบบครบชุด รวมถึง helper สำหรับการแพตช์ config เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

adapter สำหรับ setup patch ยังคงปลอดภัยต่อ hot path ตอน import การค้นหาพื้นผิว contract ของ bundled single-account promotion ภายในจะเป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการค้นหาพื้นผิว contract ของ bundled ล่วงหน้าก่อนที่จะมีการใช้งาน adapter จริง

### single-account promotion ที่ channel เป็นเจ้าของ

เมื่อ channel อัปเกรดจาก config ระดับบนสุดแบบ single-account ไปเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมค่าเริ่มต้นคือย้ายค่าที่อยู่ในขอบเขตบัญชีซึ่งถูกโปรโมตไปไว้ใน `accounts.default`

bundled channel สามารถทำให้ promotion นี้แคบลงหรือแทนที่ได้ผ่านพื้นผิว contract สำหรับ setup ของมัน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปยังบัญชีที่ถูกโปรโมต
- `namedAccountPromotionKeys`: เมื่อมี named account อยู่แล้ว จะย้ายเฉพาะคีย์เหล่านี้เข้าไปยังบัญชีที่ถูกโปรโมต; คีย์ด้านนโยบาย/การส่งมอบที่ใช้ร่วมกันจะคงอยู่ที่รากของ channel
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่ใดควรได้รับค่าที่ถูกโปรโมต

<Note>
Matrix คือตัวอย่าง bundled ปัจจุบัน หากมี named Matrix account อยู่แล้วเพียงหนึ่งบัญชี หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่และไม่ใช่ canonical เช่น `Ops` การโปรโมตจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่
</Note>

## สคีมาคอนฟิก

คอนฟิกของ Plugin จะถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้กำหนดค่า Plugin ผ่าน:

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

Plugin ของคุณจะได้รับคอนฟิกนี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับคอนฟิกเฉพาะ channel ให้ใช้ส่วนคอนฟิกของ channel แทน:

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

### การสร้างสคีมาคอนฟิกของ channel

ใช้ `buildChannelConfigSchema` เพื่อแปลงสคีมา Zod ให้เป็น wrapper `ChannelConfigSchema` ที่ใช้โดยอาร์ติแฟกต์คอนฟิกที่ Plugin เป็นเจ้าของ:

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

สำหรับ Plugin ภายนอก contract ของ cold path ยังคงเป็น manifest ของ Plugin: ให้สะท้อน JSON Schema ที่สร้างแล้วไปยัง `openclaw.plugin.json#channelConfigs` เพื่อให้สคีมาคอนฟิก การตั้งค่า และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## วิซาร์ดการตั้งค่า

Channel plugins สามารถมีวิซาร์ดการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ วิซาร์ดนี้คือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ โปรดดูแพ็กเกจ Plugin ที่บันเดิลมา (เช่น Discord plugin `src/channel.setup.ts`) สำหรับตัวอย่างเต็ม

<AccordionGroup>
  <Accordion title="พรอมป์ต์ allowFrom แบบใช้ร่วมกัน">
    สำหรับพรอมป์ต์ allowlist ของ DM ที่ต้องการเพียงโฟลว์มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ setup helper แบบใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่า channel มาตรฐาน">
    สำหรับบล็อกสถานะของการตั้งค่า channel ที่ต่างกันแค่ป้ายชื่อ คะแนน และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` แบบเดิมซ้ำในแต่ละ Plugin
  </Accordion>
  <Accordion title="พื้นผิวการตั้งค่า channel แบบไม่บังคับ">
    สำหรับพื้นผิวการตั้งค่าแบบไม่บังคับที่ควรแสดงเฉพาะในบางบริบท ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` ยังเปิดเผยตัวสร้างระดับล่าง `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของพื้นผิวการติดตั้งแบบไม่บังคับนั้น

    adapter/wizard แบบไม่บังคับที่สร้างขึ้นจะล้มเหลวแบบ fail closed กับการเขียนคอนฟิกจริง โดยจะใช้ข้อความเดียวกันเรื่องต้องติดตั้งก่อนซ้ำใน `validateInput`, `applyAccountConfig` และ `finalize` และจะต่อท้ายลิงก์เอกสารเมื่อมีการตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="helper สำหรับการตั้งค่าที่อิงกับไบนารี">
    สำหรับ UI การตั้งค่าที่อิงกับไบนารี ให้เลือกใช้ helper แบบ delegated ที่ใช้ร่วมกัน แทนการคัดลอกโค้ดเชื่อมสถานะ/ไบนารีแบบเดิมไปใส่ทุก channel:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเฉพาะป้ายชื่อ คำแนะนำ คะแนน และการตรวจจับไบนารี
    - `createCliPathTextInput(...)` สำหรับ text input ที่อิงกับพาธ
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยัง full wizard ที่หนักกว่าด้วยวิธี lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องส่งต่อเฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) หรือ npm แล้วติดตั้ง:

<Tabs>
  <Tab title="อัตโนมัติ (ClawHub แล้วจึง npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw จะลอง ClawHub ก่อน และ fallback ไปยัง npm โดยอัตโนมัติ

  </Tab>
  <Tab title="ClawHub เท่านั้น">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    ไม่มีการแทนที่ `npm:` ที่ตรงกัน ให้ใช้ npm package spec ปกติเมื่อคุณต้องการเส้นทาง npm หลังจาก ClawHub fallback:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ในรีโป:** วางไว้ใต้โครงสร้าง bundled plugin workspace แล้วระบบจะค้นพบอัตโนมัติระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้ด้วย:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มาจาก npm คำสั่ง `openclaw plugins install` จะรัน `npm install --ignore-scripts` ของโปรเจกต์ภายในเครื่อง (ไม่มี lifecycle scripts) โดยไม่สนใจการตั้งค่า npm install แบบ global ที่สืบทอดมา ให้คง dependency tree ของ Plugin เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้การ build ผ่าน `postinstall`
</Info>

<Note>
Plugin ที่ OpenClaw เป็นเจ้าของและบันเดิลมาเป็นข้อยกเว้นเพียงกรณีเดียวสำหรับการซ่อมแซมตอนเริ่มต้นระบบ: เมื่อการติดตั้งแบบแพ็กเกจพบว่า Plugin ดังกล่าวถูกเปิดใช้งานผ่านคอนฟิก Plugin, คอนฟิก channel แบบเดิม หรือ manifest แบบบันเดิลที่เปิดใช้เป็นค่าเริ่มต้น ระบบเริ่มต้นจะติดตั้ง runtime dependency ที่ขาดหายไปของ Plugin นั้นก่อน import ส่วน Plugin ภายนอกไม่ควรพึ่งพาการติดตั้งตอนเริ่มต้นระบบ; ให้ใช้ตัวติดตั้ง Plugin แบบ explicit ต่อไป
</Note>

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นแบบทีละขั้นตอน
- [manifest ของ Plugin](/th/plugins/manifest) — ข้อมูลอ้างอิง schema ของ manifest แบบเต็ม
- [SDK entry points](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
