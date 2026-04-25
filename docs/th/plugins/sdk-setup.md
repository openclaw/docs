---
read_when:
    - คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจความแตกต่างระหว่าง `setup-entry.ts` กับ `index.ts`
    - คุณกำลังกำหนด config schemas ของ Plugin หรือข้อมูลเมตา `openclaw` ใน `package.json`
sidebarTitle: Setup and Config
summary: วิซาร์ดการตั้งค่า `setup-entry.ts` config schemas และข้อมูลเมตาใน `package.json`
title: การตั้งค่าและ config ของ Plugin
x-i18n:
    generated_at: "2026-04-25T13:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

เอกสารอ้างอิงสำหรับการแพ็กเกจ Plugin (ข้อมูลเมตาใน `package.json`), manifests
(`openclaw.plugin.json`), setup entries และ config schemas

<Tip>
  **กำลังมองหาคู่มือแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบทการใช้งาน:
  [Channel Plugins](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ
  [Provider Plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## ข้อมูลเมตาของแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า
Plugin ของคุณให้ความสามารถอะไรบ้าง:

**Channel plugin:**

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
      "blurb": "คำอธิบายสั้น ๆ ของแชนเนล"
    }
  }
}
```

**Provider plugin / baseline สำหรับการเผยแพร่บน ClawHub:**

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

หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build`
เหล่านั้นเป็นสิ่งจำเป็น snippets สำหรับการเผยแพร่แบบ canonical อยู่ใน
`docs/snippets/plugin-publish/`

### ฟิลด์ `openclaw`

| ฟิลด์        | ชนิด       | คำอธิบาย                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ไฟล์ entry point (relative จาก package root)                                                                                |
| `setupEntry` | `string`   | entry แบบเบาเฉพาะสำหรับ setup (ไม่บังคับ)                                                                                     |
| `channel`    | `object`   | ข้อมูลเมตาในแค็ตตาล็อกของแชนเนลสำหรับพื้นผิว setup, picker, quickstart และ status                                                 |
| `providers`  | `string[]` | provider ids ที่ Plugin นี้ลงทะเบียน                                                                                      |
| `install`    | `object`   | install hints: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | แฟล็กพฤติกรรมขณะเริ่มต้น                                                                                                      |

### `openclaw.channel`

`openclaw.channel` คือข้อมูลเมตาของแพ็กเกจแบบประหยัดสำหรับพื้นผิว discovery และ setup
ของแชนเนล ก่อนที่รันไทม์จะถูกโหลด

| ฟิลด์                                  | ชนิด       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | channel id แบบ canonical                                                         |
| `label`                                | `string`   | ป้ายกำกับหลักของแชนเนล                                                        |
| `selectionLabel`                       | `string`   | ป้ายกำกับใน picker/setup เมื่อต้องการให้ต่างจาก `label`                        |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแค็ตตาล็อกแชนเนลและพื้นผิวสถานะที่มีรายละเอียดมากขึ้น       |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์ใน setup และการเลือก                                      |
| `docsLabel`                            | `string`   | ป้ายกำกับที่ใช้ override สำหรับลิงก์เอกสาร เมื่อต้องการให้ต่างจาก channel id |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                         |
| `order`                                | `number`   | ลำดับการเรียงในแค็ตตาล็อกของแชนเนล                                               |
| `aliases`                              | `string[]` | aliases เพิ่มเติมสำหรับการค้นหาในการเลือกแชนเนล                                   |
| `preferOver`                           | `string[]` | plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่าซึ่งแชนเนลนี้ควรอยู่เหนือกว่า                |
| `systemImage`                          | `string`   | ชื่อ icon/system-image แบบไม่บังคับสำหรับแค็ตตาล็อก UI ของแชนเนล                      |
| `selectionDocsPrefix`                  | `string`   | ข้อความ prefix ก่อนลิงก์เอกสารในพื้นผิวการเลือก                          |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรง แทนลิงก์เอกสารแบบมีป้ายกำกับในข้อความสำหรับการเลือก |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ผนวกในข้อความสำหรับการเลือก                               |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่าแชนเนลรองรับ Markdown สำหรับการตัดสินใจด้านการจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นของแชนเนลสำหรับพื้นผิว setup, รายการที่กำหนดค่าแล้ว และ docs   |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้แชนเนลนี้ใช้โฟลว์ setup `allowFrom` แบบ quickstart มาตรฐาน         |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ bind บัญชีแบบ explicit แม้จะมีเพียงบัญชีเดียว           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ให้ความสำคัญกับ session lookup เมื่อ resolve announce targets สำหรับแชนเนลนี้       |

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
      "blurb": "การเชื่อมต่อแชตแบบ self-hosted ที่อิง Webhook",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "คู่มือ:",
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

- `configured`: รวมแชนเนลไว้ในพื้นผิวรายการแบบ configured/status
- `setup`: รวมแชนเนลไว้ในตัวเลือก setup/configure แบบอินเทอร์แอคทีฟ
- `docs`: ทำเครื่องหมายว่าแชนเนลนี้เปิดเผยสู่สาธารณะสำหรับพื้นผิว docs/navigation

`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias แบบเดิม แนะนำให้ใช้
`exposure`

### `openclaw.install`

`openclaw.install` เป็นข้อมูลเมตาของแพ็กเกจ ไม่ใช่ข้อมูลเมตาของ manifest

| ฟิลด์                        | ชนิด                 | ความหมาย                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec แบบ canonical สำหรับโฟลว์ติดตั้ง/อัปเดต                                     |
| `localPath`                  | `string`             | พาธติดตั้งภายในเครื่องสำหรับการพัฒนาหรือที่มาพร้อมระบบ                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ควรเลือกเป็นค่าเริ่มต้นเมื่อมีทั้งสองแบบ                                |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับ ในรูปแบบ `>=x.y.z`                        |
| `expectedIntegrity`          | `string`             | สตริง npm dist integrity ที่คาดหวัง โดยปกติเป็น `sha512-...` สำหรับการติดตั้งแบบ pinned   |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้โฟลว์ติดตั้ง bundled-plugin ใหม่กู้คืนจากความล้มเหลว config แบบ stale บางกรณี |

onboarding แบบอินเทอร์แอคทีฟยังใช้ `openclaw.install` สำหรับพื้นผิว
install-on-demand ด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก provider auth หรือข้อมูลเมตา
ของ channel setup/catalog ก่อนรันไทม์โหลด onboarding ก็สามารถแสดงตัวเลือกนั้น
พรอมต์ให้เลือก npm หรือ local install ติดตั้งหรือเปิดใช้ Plugin จากนั้นจึงดำเนินโฟลว์ที่เลือกต่อได้
ตัวเลือก onboarding แบบ npm ต้องใช้ข้อมูลเมตาในแค็ตตาล็อกที่เชื่อถือได้พร้อม `npmSpec`
จากรีจิสทรี; exact versions และ `expectedIntegrity` เป็นหมุดแบบไม่บังคับ หาก
มี `expectedIntegrity` อยู่ โฟลว์ติดตั้ง/อัปเดตจะบังคับใช้ค่านั้น ให้เก็บข้อมูลเมตา
ประเภท "ควรแสดงอะไร" ไว้ใน `openclaw.plugin.json` และข้อมูลเมตาประเภท "ติดตั้งอย่างไร"
ไว้ใน `package.json`

หากมีการตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลด manifest-registry จะบังคับใช้
ค่านี้ โฮสต์ที่เก่ากว่าจะข้าม Plugin ไป; สตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ

สำหรับการติดตั้ง npm แบบ pinned ให้คงเวอร์ชัน exact ไว้ใน `npmSpec` และเพิ่ม
integrity ของอาร์ติแฟกต์ที่คาดหวัง:

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

`allowInvalidConfigRecovery` ไม่ใช่การข้ามปัญหา config ที่เสียทั้งหมดแบบทั่วไป มันมีไว้
สำหรับการกู้คืน bundled-plugin แบบแคบเท่านั้น เพื่อให้การติดตั้งใหม่/setup สามารถซ่อมแซม
สิ่งตกค้างจากการอัปเกรดที่รู้จัก เช่น พาธ bundled plugin ที่หายไป หรือรายการ `channels.<id>`
ที่ล้าสมัยสำหรับ Plugin เดียวกันนั้น หาก config เสียจากสาเหตุอื่นที่ไม่เกี่ยวข้อง การติดตั้ง
จะยังคงล้มเหลวแบบ fail closed และบอกให้โอเปอเรเตอร์รัน `openclaw doctor --fix`

### Deferred full load

channel plugins สามารถเลือกใช้ deferred loading ด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วง startup
ก่อนเริ่มรับการเชื่อมต่อ แม้จะเป็นแชนเนลที่กำหนดค่าไว้แล้วก็ตาม จากนั้น full entry จะถูกโหลดหลังจาก
gateway เริ่มรับการเชื่อมต่อแล้ว

<Warning>
  เปิดใช้ deferred loading เฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่
  gateway ต้องการก่อนที่จะเริ่มรับการเชื่อมต่อ (การลงทะเบียนแชนเนล, HTTP routes,
  gateway methods) หาก full entry เป็นเจ้าของ capability ที่จำเป็นใน startup ให้คง
  พฤติกรรมค่าเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียน gateway RPC methods ด้วย ให้คงไว้บน
prefix ที่เฉพาะกับ Plugin ส่วน namespaces ของ core admin ที่สงวนไว้ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve
เป็น `operator.admin` เสมอ

## manifest ของ Plugin

native plugin ทุกตัวต้องมี `openclaw.plugin.json` อยู่ที่ package root
OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบ config โดยไม่ต้องรันโค้ดของ Plugin

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "เพิ่มความสามารถของ My Plugin ให้กับ OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "ความลับสำหรับยืนยัน Webhook"
      }
    }
  }
}
```

สำหรับ channel plugins ให้เพิ่ม `kind` และ `channels`:

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

แม้ plugins ที่ไม่มี config ก็ต้องมี schema อยู่ด้วย schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Plugin Manifest](/th/plugins/manifest) สำหรับเอกสารอ้างอิง schema แบบเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub ที่เฉพาะสำหรับ package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

alias การเผยแพร่แบบเดิมที่ใช้กับ skills เท่านั้นมีไว้สำหรับ Skills ส่วนแพ็กเกจ Plugin
ควรใช้ `clawhub package publish` เสมอ

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกที่เบากว่า `index.ts` ซึ่ง
OpenClaw จะโหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิว setup (onboarding, config repair,
การตรวจสอบ channel ที่ถูกปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ด runtime ที่หนัก (ไลบรารีเข้ารหัส, การลงทะเบียน CLI,
background services) ระหว่างโฟลว์ setup

สำหรับ bundled workspace channels ที่เก็บ exports ซึ่งปลอดภัยสำหรับ setup ไว้ใน sidecar modules สามารถ
ใช้ `defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทน
`defineSetupPluginEntry(...)` ได้ สัญญาแบบ bundled นี้ยังรองรับ
export `runtime` แบบไม่บังคับ เพื่อให้การเดินสาย runtime ระหว่าง setup คงความเบาและชัดเจน

**เมื่อใดที่ OpenClaw จะใช้ `setupEntry` แทน full entry:**

- แชนเนลถูกปิดใช้งาน แต่ยังต้องใช้พื้นผิว setup/onboarding
- แชนเนลถูกเปิดใช้งานแล้ว แต่ยังไม่ถูกกำหนดค่า
- เปิดใช้ deferred loading (`deferConfiguredChannelFullLoadUntilAfterListen`)

**สิ่งที่ `setupEntry` ต้องลงทะเบียน:**

- ออบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
- HTTP routes ใด ๆ ที่จำเป็นก่อน gateway เริ่มรับการเชื่อมต่อ
- gateway methods ใด ๆ ที่จำเป็นระหว่าง startup

gateway methods สำหรับ startup เหล่านั้นก็ควรหลีกเลี่ยง namespaces ของ core admin
ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

**สิ่งที่ `setupEntry` ไม่ควรมี:**

- การลงทะเบียน CLI
- background services
- runtime imports ที่หนัก (crypto, SDKs)
- gateway methods ที่จำเป็นเฉพาะหลัง startup

### imports ของตัวช่วย setup แบบแคบ

สำหรับเส้นทาง setup-only แบบ hot ให้เลือกใช้ seams ของ setup helper แบบแคบแทน
umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิว setup:

| Import path                        | ใช้สำหรับ                                                                                | exports หลัก                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วย runtime ระหว่าง setup ที่ยังคงพร้อมใช้งานใน `setupEntry` / deferred channel startup | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | account setup adapters ที่รับรู้สภาพแวดล้อม                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ตัวช่วยสำหรับ setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการ toolbox สำหรับ setup แบบใช้ร่วมกันทั้งหมด
รวมถึงตัวช่วย patch config เช่น
`moveSingleAccountChannelSectionToDefaultAccount(...)`

setup patch adapters ยังคงปลอดภัยสำหรับเส้นทาง hot ขณะ import การค้นหา bundled
single-account promotion contract-surface เป็นแบบ lazy ดังนั้นการ import
`plugin-sdk/setup-runtime` จะไม่โหลด bundled contract-surface discovery ล่วงหน้า
ก่อนที่ adapter จะถูกใช้งานจริง

### single-account promotion ที่แชนเนลเป็นเจ้าของ

เมื่อแชนเนลอัปเกรดจาก single-account top-level config ไปเป็น
`channels.<id>.accounts.*`, พฤติกรรมแบบ shared โดยค่าเริ่มต้นคือย้ายค่า
ที่อยู่ในขอบเขตของบัญชีซึ่งถูกโปรโมตไปไว้ใน `accounts.default`

bundled channels สามารถทำให้ promotion นี้แคบลงหรือ override ได้ผ่าน setup
contract surface ของตน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปใน
  บัญชีที่ถูกโปรโมต
- `namedAccountPromotionKeys`: เมื่อมี named accounts อยู่แล้ว จะย้ายเพียงคีย์เหล่านี้
  เข้าไปในบัญชีที่ถูกโปรโมต; ส่วนคีย์นโยบาย/การส่งมอบแบบใช้ร่วมกันยังคงอยู่ที่รากของแชนเนล
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะได้รับค่าที่ถูกโปรโมต

Matrix คือตัวอย่าง bundled ปัจจุบัน หากมี named Matrix account อยู่แล้วเพียงหนึ่งบัญชี
หรือหาก `defaultAccount` ชี้ไปยังคีย์ non-canonical ที่มีอยู่ เช่น
`Ops`, promotion จะคงบัญชีนั้นไว้ แทนการสร้าง
รายการ `accounts.default` ใหม่

## Config schema

config ของ Plugin จะถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้
กำหนดค่า plugins ผ่าน:

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

Plugin ของคุณจะได้รับ config นี้ในรูปของ `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับ config ที่เฉพาะกับแชนเนล ให้ใช้ส่วน config ของแชนเนลแทน:

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

### การสร้าง channel config schemas

ใช้ `buildChannelConfigSchema` เพื่อแปลง Zod schema ให้เป็น
wrapper `ChannelConfigSchema` ที่ใช้โดย config artifacts ซึ่ง Plugin เป็นเจ้าของ:

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

สำหรับ third-party plugins สัญญา cold-path ยังคงเป็น manifest ของ Plugin:
ให้ mirror JSON Schema ที่สร้างขึ้นไปยัง `openclaw.plugin.json#channelConfigs` เพื่อให้
config schema, setup และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้อง
โหลดโค้ด runtime

## วิซาร์ดการตั้งค่า

channel plugins สามารถให้วิซาร์ด setup แบบอินเทอร์แอคทีฟสำหรับ `openclaw onboard`
ได้ ตัววิซาร์ดคือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "เชื่อมต่อแล้ว",
    unconfiguredLabel: "ยังไม่ได้กำหนดค่า",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "ใช้ MY_CHANNEL_BOT_TOKEN จากสภาพแวดล้อมหรือไม่?",
      keepPrompt: "คง token ปัจจุบันไว้หรือไม่?",
      inputPrompt: "ป้อน bot token ของคุณ:",
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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ
ดู bundled plugin packages (เช่น Discord plugin ที่ `src/channel.setup.ts`) สำหรับ
ตัวอย่างแบบเต็ม

สำหรับพรอมต์ DM allowlist ที่ต้องการเพียงโฟลว์มาตรฐาน
`note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ setup helpers แบบใช้ร่วมกันจาก
`openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` และ
`createNestedChannelParsedAllowFromPrompt(...)`

สำหรับบล็อกสถานะ setup ของแชนเนลที่แตกต่างกันเพียง labels, scores และบรรทัดเสริมแบบไม่บังคับ ให้ใช้ `createStandardChannelSetupStatus(...)` จาก
`openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` แบบเดียวกันด้วยมือใน
แต่ละ Plugin

สำหรับพื้นผิว setup แบบไม่บังคับที่ควรปรากฏเฉพาะในบางบริบท ให้ใช้
`createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` ยังเปิดเผย builders ระดับล่าง
`createOptionalChannelSetupAdapter(...)` และ
`createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของ
พื้นผิว optional-install นั้น

adapter/wizard แบบไม่บังคับที่ถูกสร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง
พวกมันนำข้อความเดียวกันเรื่อง install-required กลับมาใช้ซ้ำใน `validateInput`,
`applyAccountConfig` และ `finalize` และจะผนวกลิงก์เอกสารเมื่อมีการตั้งค่า `docsPath`

สำหรับ setup UIs ที่อิงไบนารี ให้เลือกใช้ delegated helpers แบบใช้ร่วมกันแทนการ
คัดลอก glue สำหรับไบนารี/สถานะแบบเดียวกันลงในทุกแชนเนล:

- `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเพียง labels,
  hints, scores และการตรวจจับไบนารี
- `createCliPathTextInput(...)` สำหรับ text inputs ที่อิงพาธ
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ
  `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยัง full wizard ที่หนักกว่าภายหลังแบบ lazy
- `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องเพียง
  ส่งต่อการตัดสินใจ `textInputs[*].shouldPrompt`

## การเผยแพร่และการติดตั้ง

**External plugins:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) หรือ npm แล้วติดตั้ง:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw จะลอง ClawHub ก่อน และ fallback ไปยัง npm โดยอัตโนมัติ คุณยังสามารถ
บังคับให้ใช้ ClawHub แบบ explicit ได้:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

ไม่มี override แบบ `npm:` ที่สอดคล้องกัน ให้ใช้ npm package spec ปกติเมื่อคุณ
ต้องการเส้นทาง npm หลังจาก fallback จาก ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**In-repo plugins:** วางไว้ใต้ workspace tree ของ bundled plugin แล้วระบบจะค้นพบโดยอัตโนมัติ
ระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้ด้วย:**

```bash
openclaw plugins install <package-name>
```

<Info>
  สำหรับการติดตั้งจาก npm, `openclaw plugins install` จะรัน
  `npm install --ignore-scripts` (ไม่มี lifecycle scripts) ให้คง dependency
  trees ของ Plugin เป็น pure JS/TS และหลีกเลี่ยง packages ที่ต้อง build ผ่าน `postinstall`
</Info>

bundled plugins ที่ OpenClaw เป็นเจ้าของเป็นข้อยกเว้นเดียวสำหรับการซ่อมแซมในช่วง startup: เมื่อ
การติดตั้งแบบแพ็กเกจพบว่ามี Plugin ที่ถูกเปิดใช้งานผ่าน plugin config, legacy channel config หรือ manifest แบบ default-enabled ที่มาพร้อมระบบ startup จะติดตั้ง runtime dependencies ที่หายไปของ Plugin นั้นก่อน import
third-party plugins ไม่ควรพึ่งการติดตั้งระหว่าง startup; ให้ใช้ตัวติดตั้ง Plugin แบบ explicit ต่อไป

## ที่เกี่ยวข้อง

- [SDK entry points](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
- [Plugin manifest](/th/plugins/manifest) — เอกสารอ้างอิง schema ของ manifest แบบเต็ม
- [Building plugins](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
