---
read_when:
    - คุณกำลังเพิ่มวิซาร์ดการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจ setup-entry.ts เทียบกับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมทาดาทา openclaw ใน package.json
sidebarTitle: Setup and config
summary: ตัวช่วยตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และเมตาดาต้า package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-06-27T18:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (เมตาดาต้า `package.json`), manifest (`openclaw.plugin.json`), รายการตั้งค่า และสคีมา config.

<Tip>
**กำลังมองหาคำแนะนำแบบ walkthrough อยู่หรือไม่?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## เมตาดาต้าแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า Plugin ของคุณมีอะไรให้ใช้:

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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นจำเป็นต้องมี snippet สำหรับการเผยแพร่ที่เป็น canonical อยู่ใน `docs/snippets/plugin-publish/`.
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์ entry point (สัมพันธ์กับรากแพ็กเกจ).
</ParamField>
<ParamField path="setupEntry" type="string">
  รายการสำหรับการตั้งค่าเท่านั้นแบบ lightweight (ไม่บังคับ).
</ParamField>
<ParamField path="channel" type="object">
  เมตาดาต้าแค็ตตาล็อกช่องทางสำหรับพื้นผิวการตั้งค่า ตัวเลือก quickstart และสถานะ.
</ParamField>
<ParamField path="providers" type="string[]">
  id ผู้ให้บริการที่ Plugin นี้ลงทะเบียน.
</ParamField>
<ParamField path="install" type="object">
  คำใบ้การติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กลักษณะการทำงานเมื่อเริ่มต้น.
</ParamField>

### `openclaw.channel`

`openclaw.channel` เป็นเมตาดาต้าแพ็กเกจที่ใช้งานเบาสำหรับการค้นพบช่องทางและพื้นผิวการตั้งค่าก่อนโหลด runtime.

| ฟิลด์                                  | ประเภท       | ความหมาย                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทาง canonical.                                                         |
| `label`                                | `string`   | ป้ายกำกับช่องทางหลัก.                                                        |
| `selectionLabel`                       | `string`   | ป้ายกำกับตัวเลือก/การตั้งค่าเมื่อควรต่างจาก `label`.                        |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ขึ้น.       |
| `docsPath`                             | `string`   | path เอกสารสำหรับลิงก์การตั้งค่าและการเลือก.                                      |
| `docsLabel`                            | `string`   | แทนที่ป้ายกำกับที่ใช้สำหรับลิงก์เอกสารเมื่อควรต่างจาก id ช่องทาง. |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก.                                         |
| `order`                                | `number`   | ลำดับการเรียงในแค็ตตาล็อกช่องทาง.                                               |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับการค้นหาในการเลือกช่องทาง.                                   |
| `preferOver`                           | `string[]` | id Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า.                |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image ที่ไม่บังคับสำหรับแค็ตตาล็อก UI ช่องทาง.                      |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าก่อนลิงก์เอกสารในพื้นผิวการเลือก.                          |
| `selectionDocsOmitLabel`               | `boolean`  | แสดง path เอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายกำกับในข้อความการเลือก. |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก.                               |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายช่องทางว่าสามารถใช้ markdown ได้สำหรับการตัดสินใจจัดรูปแบบขาออก.      |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นช่องทางสำหรับการตั้งค่า รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร.   |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้เข้าร่วมโฟลว์การตั้งค่า quickstart `allowFrom` มาตรฐาน.         |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้จะมีเพียงบัญชีเดียว.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ต้องการใช้การค้นหาเซสชันเมื่อ resolve เป้าหมายประกาศสำหรับช่องทางนี้.       |

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

- `configured`: รวมช่องทางในพื้นผิวรายการแบบ configured/status-style
- `setup`: รวมช่องทางในตัวเลือก setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางเป็นแบบ public-facing ในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias legacy แนะนำให้ใช้ `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` เป็นเมตาดาต้าแพ็กเกจ ไม่ใช่เมตาดาต้า manifest.

| ฟิลด์                        | ประเภท                                | ความหมาย                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | spec ClawHub canonical สำหรับโฟลว์ install/update และ onboarding install-on-demand. |
| `npmSpec`                    | `string`                            | spec npm canonical สำหรับโฟลว์ fallback ของ install/update.                             |
| `localPath`                  | `string`                            | path การพัฒนาในเครื่องหรือ path ติดตั้งแบบ bundled.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีหลายแหล่งให้ใช้.                     |
| `minHostVersion`             | `string`                            | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับในรูปแบบ `>=x.y.z` หรือ `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | สตริง integrity ของ npm dist ที่คาดไว้ โดยปกติคือ `sha512-...` สำหรับการติดตั้งแบบ pinned.    |
| `allowInvalidConfigRecovery` | `boolean`                           | อนุญาตให้โฟลว์ติดตั้ง Plugin bundled ซ้ำกู้คืนจากความล้มเหลว stale-config บางกรณี.  |
| `requiredPlatformPackages`   | `string[]`                          | alias npm เฉพาะแพลตฟอร์มที่จำเป็นและตรวจสอบระหว่างการติดตั้ง npm.               |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding แบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand ด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของผู้ให้บริการหรือเมตาดาต้า setup/catalog ของช่องทางก่อนโหลด runtime onboarding สามารถแสดงตัวเลือกนั้น ถามสำหรับการติดตั้งผ่าน ClawHub, npm หรือ local ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนินโฟลว์ที่เลือกต่อ ตัวเลือก onboarding ของ ClawHub ใช้ `clawhubSpec` และจะถูกเลือกก่อนเมื่อมีอยู่ ตัวเลือก npm ต้องใช้เมตาดาต้าแค็ตตาล็อกที่เชื่อถือได้พร้อม registry `npmSpec`; เวอร์ชันที่แน่นอนและ `expectedIntegrity` เป็น pin ของ npm ที่ไม่บังคับ หากมี `expectedIntegrity` โฟลว์ install/update จะบังคับใช้สำหรับ npm เก็บเมตาดาต้า "สิ่งที่จะแสดง" ไว้ใน `openclaw.plugin.json` และเมตาดาต้า "วิธีติดตั้ง" ไว้ใน `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    หากตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลด manifest-registry ที่ไม่ใช่ bundled จะบังคับใช้ โฮสต์รุ่นเก่าจะข้าม Plugin ภายนอก สตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ Plugin ซอร์สแบบ bundled ถือว่า co-versioned กับ host checkout.
  </Accordion>
  <Accordion title="Pinned npm installs">
    สำหรับการติดตั้ง npm แบบ pinned ให้เก็บเวอร์ชันที่แน่นอนไว้ใน `npmSpec` และเพิ่ม integrity ของ artifact ที่คาดไว้:

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
    `allowInvalidConfigRecovery` ไม่ใช่ bypass ทั่วไปสำหรับ config ที่เสีย ใช้เฉพาะการกู้คืน Plugin bundled แบบแคบเท่านั้น เพื่อให้ reinstall/setup สามารถซ่อมแซมสิ่งตกค้างจากการอัปเกรดที่ทราบ เช่น path ของ Plugin bundled ที่หายไปหรือรายการ `channels.<id>` ที่ stale สำหรับ Plugin เดียวกันนั้น หาก config เสียด้วยเหตุผลที่ไม่เกี่ยวข้อง การติดตั้งยังคง fail closed และบอก operator ให้รัน `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### การโหลดเต็มแบบเลื่อนออกไป

Plugin ช่องทางสามารถเลือกใช้การโหลดแบบเลื่อนออกไปด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างเฟสเริ่มต้นก่อน listen แม้สำหรับช่องทางที่กำหนดค่าไว้แล้ว รายการเต็มจะโหลดหลังจาก gateway เริ่ม listen.

<Warning>
เปิดใช้การโหลดแบบเลื่อนออกไปเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ gateway ต้องใช้ก่อนเริ่ม listen (การลงทะเบียนช่องทาง, HTTP routes, gateway methods) หากรายการเต็มเป็นเจ้าของความสามารถเริ่มต้นที่จำเป็น ให้คงลักษณะการทำงานเริ่มต้นไว้.
</Warning>

หาก setup/full entry ของคุณลงทะเบียน gateway RPC methods ให้เก็บไว้บน prefix เฉพาะ Plugin namespace admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve เป็น `operator.admin` เสมอ.

## manifest ของ Plugin

Plugin native ทุกตัวต้องจัดส่ง `openclaw.plugin.json` ในรากแพ็กเกจ OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบ config โดยไม่รันโค้ด Plugin.

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

แม้ Plugin ที่ไม่มี config ก็ต้องจัดส่งสคีมา สคีมาว่างถือว่าถูกต้อง:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Plugin manifest](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง schema ฉบับเต็ม

## การเผยแพร่ผ่าน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias การเผยแพร่แบบเดิมที่ใช้กับ skill เท่านั้นมีไว้สำหรับ skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## จุดเข้า setup

ไฟล์ `setup-entry.ts` เป็นทางเลือกที่เบากว่า `index.ts` ซึ่ง OpenClaw จะโหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิว setup เท่านั้น (onboarding, การซ่อมแซม config, การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ด runtime ที่หนัก (ไลบรารี crypto, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่าง flow การ setup

ช่องทาง workspace ที่ bundled ซึ่งเก็บ export ที่ปลอดภัยสำหรับ setup ไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ contract แบบ bundled นี้ยังรองรับ export `runtime` แบบไม่บังคับด้วย เพื่อให้การ wiring runtime ในช่วง setup ยังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry แบบเต็ม">
    - ช่องทางถูกปิดใช้งานแต่ต้องใช้พื้นผิว setup/onboarding
    - ช่องทางเปิดใช้งานอยู่แต่ยังไม่ได้ config
    - เปิดใช้งานการโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ Plugin ของช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - HTTP routes ใด ๆ ที่จำเป็นก่อน gateway listen
    - gateway methods ใด ๆ ที่ต้องใช้ระหว่าง startup

    gateway methods ในช่วง startup เหล่านั้นยังควรหลีกเลี่ยง namespace admin หลักที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวมไว้">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - import runtime ที่หนัก (crypto, SDKs)
    - Gateway methods ที่จำเป็นหลัง startup เท่านั้น

  </Accordion>
</AccordionGroup>

### import ตัวช่วย setup แบบแคบ

สำหรับ path ที่เป็น hot setup-only ให้เลือกใช้ seam ตัวช่วย setup แบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องใช้เพียงบางส่วนของพื้นผิว setup:

| path สำหรับ import                        | ใช้สำหรับ                                                                                | export สำคัญ                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วย runtime ในช่วง setup ที่ยังพร้อมใช้งานใน `setupEntry` / startup ช่องทางแบบ deferred | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | ตัวช่วย setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการชุดเครื่องมือ setup ร่วมแบบเต็ม รวมถึงตัวช่วย config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

ใช้ `createSetupTranslator(...)` สำหรับข้อความคงที่ของ setup wizard โดยจะทำตาม locale ของ
CLI wizard (`OPENCLAW_LOCALE` แล้วจึงเป็นตัวแปร locale ของระบบ) และ fallback
กลับเป็นภาษาอังกฤษ เก็บข้อความ setup เฉพาะ Plugin ไว้ในโค้ดที่ Plugin เป็นเจ้าของ และใช้
keys ของ catalog ที่ใช้ร่วมกันเฉพาะสำหรับ label setup ทั่วไป, ข้อความ status, และข้อความ setup ของ
Plugin bundled อย่างเป็นทางการ

patch adapters สำหรับ setup ยังคงปลอดภัยต่อ hot-path เมื่อ import การ lookup contract-surface สำหรับการ promote single-account แบบ bundled เป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการ discovery contract-surface แบบ bundled ล่วงหน้า ก่อนที่ adapter จะถูกใช้งานจริง

### การ promote single-account ที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบ single-account ไปเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมเริ่มต้นคือย้ายค่าที่มีขอบเขตตาม account ซึ่งถูก promote เข้าไปใน `accounts.default`

ช่องทาง bundled สามารถจำกัดหรือ override การ promote นั้นผ่านพื้นผิว contract ของ setup ได้:

- `singleAccountKeysToMove`: key ระดับบนสุดเพิ่มเติมที่ควรย้ายเข้าไปใน account ที่ถูก promote
- `namedAccountPromotionKeys`: เมื่อมี named accounts อยู่แล้ว เฉพาะ key เหล่านี้เท่านั้นที่จะย้ายเข้าไปใน account ที่ถูก promote; key สำหรับ shared policy/delivery จะยังอยู่ที่ root ของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือก account ที่มีอยู่ซึ่งจะรับค่าที่ถูก promote

<Note>
Matrix เป็นตัวอย่าง bundled ปัจจุบัน ถ้ามี named Matrix account อยู่แล้วเพียงหนึ่งรายการพอดี หรือถ้า `defaultAccount` ชี้ไปยัง key ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การ promote จะรักษา account นั้นไว้แทนที่จะสร้าง entry `accounts.default` ใหม่
</Note>

## Config schema

config ของ Plugin จะถูก validate กับ JSON Schema ใน manifest ของคุณ ผู้ใช้ config Plugin ผ่าน:

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

Plugin ของคุณจะได้รับ config นี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

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

### การสร้าง schema สำหรับ config ของช่องทาง

ใช้ `buildChannelConfigSchema` เพื่อแปลง Zod schema ให้เป็น wrapper `ChannelConfigSchema` ที่ใช้โดย artifact ของ config ที่ Plugin เป็นเจ้าของ:

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

ถ้าคุณเขียน contract เป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ตัวช่วยโดยตรงเพื่อให้ OpenClaw ข้ามการแปลง Zod-to-JSON-Schema บน path metadata ได้:

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

สำหรับ Plugin จากภายนอก contract บน cold-path ยังคงเป็น manifest ของ Plugin: mirror JSON Schema ที่สร้างแล้วเข้าไปใน `openclaw.plugin.json#channelConfigs` เพื่อให้ config schema, setup, และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## Setup wizards

Plugin ช่องทางสามารถจัดเตรียม setup wizards แบบโต้ตอบสำหรับ `openclaw onboard` ได้ wizard คือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ ดูแพ็กเกจ Plugin แบบ bundled (เช่น Plugin Discord `src/channel.setup.ts`) สำหรับตัวอย่างฉบับเต็ม

<AccordionGroup>
  <Accordion title="prompt allowFrom ที่ใช้ร่วมกัน">
    สำหรับ prompt allowlist ของ DM ที่ต้องใช้เฉพาะ flow มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ตัวช่วย setup ที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="status setup ช่องทางมาตรฐาน">
    สำหรับบล็อก status setup ของช่องทางที่แตกต่างกันเพียง label, score, และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` เดิมซ้ำในแต่ละ Plugin เอง
  </Accordion>
  <Accordion title="พื้นผิว setup ช่องทางแบบไม่บังคับ">
    สำหรับพื้นผิว setup แบบไม่บังคับที่ควรปรากฏในบาง context เท่านั้น ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` ยังเปิดเผย builder ระดับล่าง `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` ด้วย เมื่อคุณต้องการเพียงครึ่งเดียวของพื้นผิว optional-install นั้น

    adapter/wizard แบบไม่บังคับที่สร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง โดย reuse ข้อความ install-required เดียวกันใน `validateInput`, `applyAccountConfig`, และ `finalize` และเพิ่มลิงก์ docs ต่อท้ายเมื่อมีการตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วย setup ที่รองรับด้วย binary">
    สำหรับ UI setup ที่รองรับด้วย binary ให้เลือกใช้ตัวช่วย delegated ที่ใช้ร่วมกันแทนการคัดลอก glue สำหรับ binary/status เดิมเข้าไปในทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อก status ที่แตกต่างกันเฉพาะ label, hint, score, และการตรวจจับ binary
    - `createCliPathTextInput(...)` สำหรับ text input ที่อิง path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้อง forward ไปยัง wizard แบบเต็มที่หนักกว่าแบบ lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้อง delegate เฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/clawhub) จากนั้นติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไปยัง ClawHub หรือเมื่อคุณต้องการเส้นทาง
    การติดตั้ง npm โดยตรงระหว่างการย้าย:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ใน repo:** วางไว้ใต้ทรี workspace ของ Plugin ที่ bundled แล้วระบบจะค้นพบโดยอัตโนมัติระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มาจาก npm, `openclaw plugins install` จะติดตั้งแพ็กเกจลงในโปรเจกต์แยกต่อ Plugin ใต้ `~/.openclaw/npm/projects` โดยปิดใช้งาน lifecycle scripts ให้รักษาทรี dependency ของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้การ build ด้วย `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway จะไม่ติดตั้ง dependency ของ Plugin โฟลว์การติดตั้ง npm/git/ClawHub เป็นเจ้าของการทำให้ dependency สอดคล้องกัน; Plugin ภายในเครื่องต้องติดตั้ง dependency ของตนไว้แล้ว
</Note>

metadata ของแพ็กเกจ bundled เป็นแบบระบุชัดเจน ไม่ได้อนุมานจาก JavaScript ที่ build แล้วตอนเริ่มต้น gateway dependency ขณะ runtime ควรอยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของ dependency เหล่านั้น; การเริ่มต้น OpenClaw แบบแพ็กเกจจะไม่ซ่อมแซมหรือ mirror dependency ของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นทีละขั้นตอน
- [manifest ของ Plugin](/th/plugins/manifest) — เอกสารอ้างอิง schema ของ manifest ฉบับเต็ม
- [entry point ของ SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
