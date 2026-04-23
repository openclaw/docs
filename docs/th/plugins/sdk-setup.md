---
read_when:
    - คุณกำลังเพิ่มตัวช่วยตั้งค่าให้กับ Plugin
    - คุณต้องการเข้าใจความแตกต่างระหว่าง `setup-entry.ts` กับ `index.ts`
    - คุณกำลังกำหนดสคีมา config ของ Plugin หรือข้อมูลเมตา openclaw ใน `package.json`
sidebarTitle: Setup and Config
summary: ตัวช่วยตั้งค่า, `setup-entry.ts`, สคีมาการกำหนดค่า และข้อมูลเมตาใน `package.json`
title: การตั้งค่าและ config ของ Plugin
x-i18n:
    generated_at: "2026-04-23T10:20:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# การตั้งค่าและ config ของ Plugin

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (ข้อมูลเมตาใน `package.json`), manifest
(`openclaw.plugin.json`), setup entry และสคีมา config

<Tip>
  **กำลังมองหาคำแนะนำแบบทีละขั้นตอนอยู่ใช่ไหม?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบทการใช้งาน:
  [Channel Plugins](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ
  [Provider Plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## ข้อมูลเมตาของแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ plugin ว่า
plugin ของคุณให้ความสามารถอะไรบ้าง:

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
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider plugin / ค่าพื้นฐานสำหรับการเผยแพร่บน ClawHub:**

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

หากคุณเผยแพร่ plugin ภายนอกบน ClawHub จำเป็นต้องมีฟิลด์ `compat` และ `build`
เหล่านั้น snippet มาตรฐานสำหรับการเผยแพร่อยู่ใน
`docs/snippets/plugin-publish/`

### ฟิลด์ `openclaw`

| Field        | Type       | คำอธิบาย                                                                                                              |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ไฟล์ entry point (อ้างอิงจากรากของแพ็กเกจ)                                                                           |
| `setupEntry` | `string`   | entry สำหรับ setup เท่านั้นที่มีน้ำหนักเบา (ไม่บังคับ)                                                               |
| `channel`    | `object`   | ข้อมูลเมตาแค็ตตาล็อก channel สำหรับพื้นผิว setup, picker, quickstart และสถานะ                                        |
| `providers`  | `string[]` | provider ids ที่ลงทะเบียนโดย plugin นี้                                                                               |
| `install`    | `object`   | คำใบ้การติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | แฟล็กพฤติกรรมการเริ่มต้นระบบ                                                                                         |

### `openclaw.channel`

`openclaw.channel` คือข้อมูลเมตาในแพ็กเกจที่มีน้ำหนักเบาสำหรับการค้นหา channel และพื้นผิว
การตั้งค่าก่อนที่รันไทม์จะโหลด

| Field                                  | Type       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `id`                                   | `string`   | channel id มาตรฐาน                                                      |
| `label`                                | `string`   | ป้ายชื่อหลักของ channel                                                 |
| `selectionLabel`                       | `string`   | ป้ายชื่อใน picker/setup เมื่อจำเป็นต้องต่างจาก `label`                 |
| `detailLabel`                          | `string`   | ป้ายชื่อรายละเอียดรองสำหรับแค็ตตาล็อก channel และพื้นผิวสถานะที่สมบูรณ์ขึ้น |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์ setup และ selection                                |
| `docsLabel`                            | `string`   | ป้ายชื่อที่ใช้แทนสำหรับลิงก์เอกสาร เมื่อจำเป็นต้องต่างจาก channel id     |
| `blurb`                                | `string`   | คำอธิบายสั้น ๆ สำหรับ onboarding/แค็ตตาล็อก                             |
| `order`                                | `number`   | ลำดับการเรียงในแค็ตตาล็อก channel                                       |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับการเลือก channel                                    |
| `preferOver`                           | `string[]` | plugin/channel ids ที่มีลำดับความสำคัญต่ำกว่าซึ่ง channel นี้ควรอยู่เหนือกว่า |
| `systemImage`                          | `string`   | ชื่อ icon/system-image เพิ่มเติมสำหรับแค็ตตาล็อก UI ของ channel          |
| `selectionDocsPrefix`                  | `string`   | ข้อความคำนำหน้าก่อนลิงก์เอกสารในพื้นผิว selection                      |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายชื่อในข้อความ selection      |
| `selectionExtras`                      | `string[]` | ข้อความสั้นเพิ่มเติมที่ต่อท้ายในข้อความ selection                       |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่า channel รองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นของ channel สำหรับ setup รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ channel นี้เข้าร่วมในโฟลว์ quickstart `allowFrom` มาตรฐาน     |
| `forceAccountBinding`                  | `boolean`  | บังคับให้มี account binding แบบ explicit แม้ว่าจะมีเพียงหนึ่งบัญชี      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ให้ใช้การค้นหา session ก่อนเมื่อ resolve announce targets สำหรับ channel นี้ |

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

- `configured`: รวม channel นี้ในพื้นผิวรายการแบบ configured/status
- `setup`: รวม channel นี้ใน picker สำหรับ setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายว่า channel นี้แสดงต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

ยังคงรองรับ `showConfigured` และ `showInSetup` ในฐานะ alias แบบเดิมอยู่ แนะนำให้ใช้
`exposure`

### `openclaw.install`

`openclaw.install` เป็นข้อมูลเมตาในแพ็กเกจ ไม่ใช่ข้อมูลเมตาใน manifest

| Field                        | Type                 | ความหมาย                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec มาตรฐานสำหรับโฟลว์การติดตั้ง/อัปเดต                                     |
| `localPath`                  | `string`             | พาธการติดตั้งแบบพัฒนาในเครื่องหรือแบบมากับระบบ                                   |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีให้เลือกทั้งสองแบบ                                  |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับ ในรูปแบบ `>=x.y.z`                            |
| `expectedIntegrity`          | `string`             | สตริง integrity ของ npm dist ที่คาดหวัง โดยทั่วไปคือ `sha512-...` สำหรับการติดตั้งแบบ pin |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้โฟลว์ติดตั้ง plugin ที่มากับระบบกู้คืนจากความล้มเหลวของ config เก่าบางประเภท |

Interactive onboarding ยังใช้ `openclaw.install` สำหรับพื้นผิว
การติดตั้งตามความต้องการอีกด้วย หาก plugin ของคุณเปิดเผยตัวเลือกการยืนยันตัวตนของ provider หรือข้อมูลเมตาการตั้งค่า/แค็ตตาล็อกของ channel ก่อนที่รันไทม์จะโหลด onboarding สามารถแสดงตัวเลือกนั้น ถามให้เลือกระหว่างการติดตั้งผ่าน npm หรือแบบ local ติดตั้งหรือเปิดใช้ plugin แล้วจึงดำเนินโฟลว์ที่เลือกต่อได้ ตัวเลือก onboarding ผ่าน npm ต้องอาศัยข้อมูลเมตาแค็ตตาล็อกที่เชื่อถือได้พร้อม `npmSpec` ของ registry การระบุเวอร์ชันแบบ exact และ `expectedIntegrity` เป็นการ pin เพิ่มเติมที่ไม่บังคับ หากมี `expectedIntegrity` อยู่ โฟลว์การติดตั้ง/อัปเดตจะบังคับใช้ค่าเหล่านั้น ให้เก็บข้อมูลเมตาแบบ "จะแสดงอะไร" ไว้ใน `openclaw.plugin.json` และเก็บข้อมูลเมตาแบบ "จะติดตั้งอย่างไร" ไว้ใน `package.json`

หากตั้งค่า `minHostVersion` ไว้ ทั้งการติดตั้งและการโหลด manifest-registry จะบังคับใช้ค่า
ดังกล่าว โฮสต์ที่เก่ากว่าจะข้าม plugin นี้ไป และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ

สำหรับการติดตั้ง npm แบบ pin ให้คงเวอร์ชันแบบ exact ไว้ใน `npmSpec` และเพิ่ม
artifact integrity ที่คาดหวัง:

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

`allowInvalidConfigRecovery` ไม่ใช่การข้าม config ที่เสียแบบทั่วไป แต่มีไว้
สำหรับการกู้คืน plugin ที่มากับระบบในกรณีแคบ ๆ เท่านั้น เพื่อให้การติดตั้งใหม่/การตั้งค่า
สามารถซ่อมแซมซากจากการอัปเกรดที่ทราบรูปแบบ เช่น พาธของ plugin ที่มากับระบบหายไป หรือรายการ `channels.<id>`
เก่าของ plugin เดิมนั้น หาก config เสียด้วยเหตุผลที่ไม่เกี่ยวข้อง การติดตั้ง
จะยังคง fail แบบปิดไว้และแจ้งให้ operator รัน `openclaw doctor --fix`

### การเลื่อนโหลดแบบเต็ม

Channel plugins สามารถเลือกใช้การโหลดแบบเลื่อนเวลาได้ด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ใน phase การเริ่มต้นระบบก่อน listen
แม้แต่สำหรับ channels ที่กำหนดค่าไว้แล้วก็ตาม ส่วน full entry จะถูกโหลดหลังจากที่
gateway เริ่ม listen แล้ว

<Warning>
  เปิดใช้การโหลดแบบเลื่อนเวลาเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่
  gateway ต้องใช้ก่อนเริ่ม listen แล้วเท่านั้น (การลงทะเบียน channel, HTTP routes,
  gateway methods) หาก full entry เป็นเจ้าของความสามารถตอนเริ่มต้นที่จำเป็น ให้คง
  พฤติกรรมค่าเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียน gateway RPC methods ให้คงไว้ภายใต้
prefix ที่เฉพาะกับ plugin namespaces ของแอดมินหลักที่สงวนไว้ (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และจะ resolve
เป็น `operator.admin` เสมอ

## Plugin manifest

ทุก native plugin ต้องมี `openclaw.plugin.json` อยู่ที่รากของแพ็กเกจ
OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบ config โดยไม่ต้อง execute โค้ดของ plugin

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

แม้แต่ plugins ที่ไม่มี config ก็ต้องมี schema ด้วย schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Plugin Manifest](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง schema ฉบับเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ plugin ให้ใช้คำสั่ง ClawHub ที่เฉพาะกับแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

alias การเผยแพร่แบบเดิมที่ใช้ได้เฉพาะ skill นั้นมีไว้สำหรับ Skills เท่านั้น แพ็กเกจ plugin ควร
ใช้ `clawhub package publish` เสมอ

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกที่มีน้ำหนักเบากว่า `index.ts` ซึ่ง
OpenClaw จะโหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่าเท่านั้น (onboarding, การซ่อมแซม config,
การตรวจสอบ channel ที่ถูกปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ดรันไทม์ที่มีน้ำหนักมาก (ไลบรารีเข้ารหัส, การลงทะเบียน CLI,
บริการเบื้องหลัง) ระหว่างโฟลว์การตั้งค่า

channels ใน bundled workspace ที่เก็บ export ที่ปลอดภัยสำหรับการตั้งค่าไว้ใน sidecar modules สามารถ
ใช้ `defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทน
`defineSetupPluginEntry(...)` ได้ สัญญา bundled นี้ยังรองรับ export `runtime`
แบบไม่บังคับด้วย เพื่อให้การผูกรันไทม์ในเวลาตั้งค่ายังคงเบาและชัดเจน

**เมื่อใดที่ OpenClaw ใช้ `setupEntry` แทน full entry:**

- channel ถูกปิดใช้งาน แต่ต้องการพื้นผิว setup/onboarding
- channel เปิดใช้งานอยู่แต่ยังไม่ได้กำหนดค่า
- เปิดใช้ deferred loading (`deferConfiguredChannelFullLoadUntilAfterListen`)

**สิ่งที่ `setupEntry` ต้องลงทะเบียน:**

- ออบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
- HTTP routes ใด ๆ ที่จำเป็นก่อน gateway listen
- gateway methods ใด ๆ ที่ต้องใช้ระหว่าง startup

gateway methods ระหว่าง startup เหล่านั้นยังคงควรหลีกเลี่ยง
namespaces ของ core admin ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

**สิ่งที่ `setupEntry` ไม่ควรรวมไว้:**

- การลงทะเบียน CLI
- บริการเบื้องหลัง
- การ import รันไทม์ที่มีน้ำหนักมาก (crypto, SDKs)
- gateway methods ที่จำเป็นเฉพาะหลัง startup

### การ import setup helper แบบเจาะจง

สำหรับเส้นทาง setup-only ที่ร้อน ให้เลือกใช้ seams ของ setup helper แบบเจาะจงแทน umbrella
`plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิว setup:

| Import path                        | ใช้สำหรับ                                                                                 | export หลัก                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วยรันไทม์ในเวลาตั้งค่าที่พร้อมใช้งานใน `setupEntry` / deferred channel startup      | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | account setup adapters ที่รับรู้สภาพแวดล้อม                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | ตัวช่วยสำหรับ setup/install CLI/archive/docs                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

ให้ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการ toolbox สำหรับ setup ที่ใช้ร่วมกันแบบเต็ม
รวมถึงตัวช่วยแพตช์ config เช่น
`moveSingleAccountChannelSectionToDefaultAccount(...)`

setup patch adapters ยังคงปลอดภัยสำหรับ hot path ตอน import พื้นผิวสัญญาการยกระดับแบบ single-account ของ bundled
จะถูกค้นหาแบบ lazy ดังนั้นการ import
`plugin-sdk/setup-runtime` จะไม่โหลดการค้นหาพื้นผิวสัญญาแบบ bundled ล่วงหน้าก่อนที่ adapter จะถูกใช้งานจริง

### การยกระดับ single-account ที่ channel เป็นเจ้าของ

เมื่อ channel อัปเกรดจาก config ระดับบนสุดแบบ single-account ไปเป็น
`channels.<id>.accounts.*`, พฤติกรรมแบบใช้ร่วมกันตามค่าเริ่มต้นคือการย้ายค่าที่อยู่ในขอบเขตบัญชีที่ถูกยกระดับไปยัง `accounts.default`

Bundled channels สามารถจำกัดหรือ override การยกระดับนั้นผ่านพื้นผิวสัญญาการตั้งค่าของตนเอง:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปใน
  บัญชีที่ถูกยกระดับ
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่มีชื่ออยู่แล้ว จะย้ายเฉพาะคีย์เหล่านี้เข้าไปยังบัญชีที่ถูกยกระดับ; คีย์นโยบาย/การส่งแบบใช้ร่วมกันจะยังอยู่ที่รากของ channel
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะได้รับค่าที่ถูกยกระดับ

Matrix เป็นตัวอย่าง bundled ปัจจุบัน หากมีบัญชี Matrix แบบมีชื่ออยู่แล้วเพียงหนึ่งบัญชี หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่แล้วซึ่งไม่ใช่ชื่อมาตรฐาน เช่น `Ops` การยกระดับจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่

## สคีมา config

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

plugin ของคุณจะได้รับ config นี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับ config เฉพาะ channel ให้ใช้ส่วน config ของ channel แทน:

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

### การสร้างสคีมา config ของ channel

ใช้ `buildChannelConfigSchema` จาก `openclaw/plugin-sdk/core` เพื่อแปลง
Zod schema เป็น wrapper แบบ `ChannelConfigSchema` ที่ OpenClaw ใช้ตรวจสอบ:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## ตัวช่วยตั้งค่า

Channel plugins สามารถมีตัวช่วยตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard`
ตัวช่วยนี้คือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ
ดูตัวอย่างเต็มได้จากแพ็กเกจ plugin ที่มากับระบบ (เช่น Discord plugin `src/channel.setup.ts`)

สำหรับพรอมป์ต DM allowlist ที่ต้องการเพียงโฟลว์มาตรฐาน
`note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ setup helpers แบบใช้ร่วมกัน
จาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` และ
`createNestedChannelParsedAllowFromPrompt(...)`

สำหรับบล็อกสถานะการตั้งค่า channel ที่แตกต่างกันเพียงป้ายชื่อ คะแนน และบรรทัดเพิ่มเติมแบบไม่บังคับ
ให้ใช้ `createStandardChannelSetupStatus(...)` จาก
`openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` แบบเดิมซ้ำเองใน
แต่ละ plugin

สำหรับพื้นผิวการตั้งค่าแบบไม่บังคับที่ควรปรากฏเฉพาะในบางบริบท ให้ใช้
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
พื้นผิวการติดตั้งแบบไม่บังคับนั้น

optional adapter/wizard ที่สร้างขึ้นจะ fail แบบปิดเมื่อมีการเขียน config จริง
โดยจะใช้ข้อความว่าต้องติดตั้งก่อนข้อความเดียวซ้ำใน `validateInput`,
`applyAccountConfig` และ `finalize` และจะต่อท้ายลิงก์เอกสารเมื่อมีการตั้งค่า `docsPath`

สำหรับ UI การตั้งค่าที่พึ่งพา binary ให้เลือกใช้ตัวช่วย delegated แบบใช้ร่วมกันแทนการคัดลอก glue ของ binary/status แบบเดิมไปทุก channel:

- `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเพียงป้ายชื่อ
  คำใบ้ คะแนน และการตรวจจับ binary
- `createCliPathTextInput(...)` สำหรับ text input ที่อิงพาธ
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ
  `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` จำเป็นต้องส่งต่อไปยัง
  full wizard ที่หนักกว่าด้วยวิธี lazy
- `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องเพียง
  ส่งต่อการตัดสินใจ `textInputs[*].shouldPrompt`

## การเผยแพร่และการติดตั้ง

**plugin ภายนอก:** เผยแพร่ไปที่ [ClawHub](/th/tools/clawhub) หรือ npm แล้วติดตั้ง:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw จะลอง ClawHub ก่อน และ fallback ไปที่ npm โดยอัตโนมัติ คุณยัง
สามารถบังคับใช้ ClawHub แบบ explicit ได้:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

ไม่มี override แบบ `npm:` ที่สอดคล้องกัน ใช้ npm package spec ปกติเมื่อคุณ
ต้องการเส้นทาง npm หลังการ fallback จาก ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**plugin ภายใน repo:** วางไว้ใต้ต้นไม้ workspace ของ plugin ที่มากับระบบ และระบบจะค้นพบโดยอัตโนมัติ
ระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
  สำหรับการติดตั้งที่มาจาก npm, `openclaw plugins install` จะรัน
  `npm install --ignore-scripts` (ไม่มี lifecycle scripts) ให้คง dependency
  tree ของ plugin เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้การ build ผ่าน `postinstall`
</Info>

plugins ที่ OpenClaw เป็นเจ้าของและมากับระบบคือข้อยกเว้นเดียวสำหรับการซ่อมแซมตอนเริ่มต้น: เมื่อการติดตั้งแบบแพ็กเกจ
พบว่ามีการเปิดใช้ plugin นั้นผ่าน config ของ plugin, config channel แบบเดิม หรือ manifest เริ่มต้นที่เปิดใช้งานไว้ของ plugin ที่มากับระบบ ระบบจะติดตั้ง runtime dependencies ที่หายไปของ plugin นั้นก่อน import plugin ภายนอกไม่ควรพึ่งพาการติดตั้งตอนเริ่มต้น; ให้ใช้ตัวติดตั้ง plugin แบบ explicit ต่อไป

## ที่เกี่ยวข้อง

- [SDK Entry Points](/th/plugins/sdk-entrypoints) -- `definePluginEntry` และ `defineChannelPluginEntry`
- [Plugin Manifest](/th/plugins/manifest) -- ข้อมูลอ้างอิง schema ของ manifest ฉบับเต็ม
- [การสร้าง Plugins](/th/plugins/building-plugins) -- คู่มือเริ่มต้นแบบทีละขั้นตอน
