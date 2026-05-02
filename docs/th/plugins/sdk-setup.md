---
read_when:
    - คุณกำลังเพิ่มตัวช่วยสร้างการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่าของ Plugin หรือเมทาดาทา `openclaw` ใน `package.json`
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และเมตาดาต้า package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-05-02T10:26:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (เมตาดาต้า `package.json`), manifest (`openclaw.plugin.json`), รายการ setup และ config schema

<Tip>
**ต้องการคู่มือแบบ walkthrough ใช่ไหม?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมตาดาต้าของแพ็กเกจ

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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นเป็นสิ่งจำเป็น snippet การเผยแพร่ฉบับ canonical อยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์ entry point (สัมพันธ์กับรากของแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  entry สำหรับ setup เท่านั้นแบบเบา (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมตาดาต้าแค็ตตาล็อกช่องทางสำหรับ setup, picker, quickstart และพื้นผิวสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  id ของผู้ให้บริการที่ Plugin นี้ลงทะเบียน
</ParamField>
<ParamField path="install" type="object">
  คำใบ้การติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  flag พฤติกรรมการเริ่มต้น
</ParamField>

### `openclaw.channel`

`openclaw.channel` คือเมตาดาต้าแพ็กเกจที่เบาสำหรับการค้นพบช่องทางและพื้นผิว setup ก่อนโหลด runtime

| ฟิลด์                                  | ประเภท       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทาง canonical                                                         |
| `label`                                | `string`   | ป้ายชื่อหลักของช่องทาง                                                        |
| `selectionLabel`                       | `string`   | ป้ายชื่อ picker/setup เมื่อควรแตกต่างจาก `label`                        |
| `detailLabel`                          | `string`   | ป้ายรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางที่มีข้อมูลมากขึ้นและพื้นผิวสถานะ       |
| `docsPath`                             | `string`   | path เอกสารสำหรับลิงก์ setup และการเลือก                                      |
| `docsLabel`                            | `string`   | แทนที่ป้ายชื่อที่ใช้กับลิงก์เอกสารเมื่อควรแตกต่างจาก id ช่องทาง |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                         |
| `order`                                | `number`   | ลำดับการจัดเรียงในแค็ตตาล็อกช่องทาง                                               |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับค้นหาในการเลือกช่องทาง                                   |
| `preferOver`                           | `string[]` | id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า                |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image ที่ไม่บังคับสำหรับแค็ตตาล็อก UI ของช่องทาง                      |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าก่อนลิงก์เอกสารในพื้นผิวการเลือก                          |
| `selectionDocsOmitLabel`               | `boolean`  | แสดง path เอกสารโดยตรงแทนลิงก์เอกสารแบบมีป้ายชื่อในข้อความการเลือก |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                               |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายช่องทางว่ารองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นช่องทางสำหรับ setup, รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร   |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้เข้าสู่ flow setup `allowFrom` quickstart มาตรฐาน         |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้จะมีเพียงบัญชีเดียว           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ใช้การค้นหาเซสชันเป็นหลักเมื่อแก้ target การประกาศสำหรับช่องทางนี้       |

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

- `configured`: รวมช่องทางไว้ในพื้นผิวรายการที่กำหนดค่าแล้ว/แบบสถานะ
- `setup`: รวมช่องทางไว้ใน picker setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางว่าเป็นแบบ public-facing ในพื้นผิวเอกสาร/navigation

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับเป็น alias เดิม แนะนำให้ใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` คือเมตาดาต้าแพ็กเกจ ไม่ใช่เมตาดาต้า manifest

| ฟิลด์                        | ประเภท                 | ความหมาย                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec canonical สำหรับ flow ติดตั้ง/อัปเดต                                      |
| `localPath`                  | `string`             | path สำหรับการพัฒนาในเครื่องหรือการติดตั้งแบบ bundled                                        |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีทั้งสองแบบ                                 |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ต่ำสุดที่รองรับในรูปแบบ `>=x.y.z` หรือ `>=x.y.z-prerelease` |
| `expectedIntegrity`          | `string`             | สตริง integrity ของ npm dist ที่คาดไว้ โดยปกติคือ `sha512-...` สำหรับการติดตั้งแบบ pinned    |
| `allowInvalidConfigRecovery` | `boolean`            | อนุญาตให้ flow ติดตั้ง Plugin แบบ bundled ใหม่กู้คืนจากความล้มเหลว stale-config เฉพาะบางแบบ  |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding แบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand ด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของผู้ให้บริการหรือเมตาดาต้า setup/แค็ตตาล็อกช่องทางก่อนโหลด runtime onboarding สามารถแสดงตัวเลือกนั้น แจ้งให้เลือกการติดตั้งแบบ npm หรือ local ติดตั้งหรือเปิดใช้ Plugin แล้วทำ flow ที่เลือกต่อ ตัวเลือก onboarding แบบ npm ต้องใช้เมตาดาต้าแค็ตตาล็อกที่เชื่อถือได้พร้อม `npmSpec` ของ registry เวอร์ชันแบบ exact และ `expectedIntegrity` เป็น pin ที่ไม่บังคับ หากมี `expectedIntegrity` อยู่ flow ติดตั้ง/อัปเดตจะ enforce ค่านั้น เก็บเมตาดาต้า "สิ่งที่จะแสดง" ไว้ใน `openclaw.plugin.json` และเมตาดาต้า "วิธีติดตั้ง" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    หากตั้งค่า `minHostVersion` ไว้ ทั้งการติดตั้งและการโหลด manifest-registry แบบ non-bundled จะ enforce ค่านี้ host รุ่นเก่าจะข้าม Plugin ภายนอก และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ Plugin จากซอร์สแบบ bundled จะถือว่ามีเวอร์ชันร่วมกับ checkout ของ host
  </Accordion>
  <Accordion title="Pinned npm installs">
    สำหรับการติดตั้ง npm แบบ pinned ให้เก็บเวอร์ชันแบบ exact ใน `npmSpec` และเพิ่ม integrity ของ artifact ที่คาดไว้:

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
    `allowInvalidConfigRecovery` ไม่ใช่ bypass ทั่วไปสำหรับ config ที่เสีย ใช้สำหรับการกู้คืน Plugin แบบ bundled ในขอบเขตแคบเท่านั้น เพื่อให้ reinstall/setup สามารถซ่อมสิ่งตกค้างจากการอัปเกรดที่ทราบ เช่น path ของ Plugin แบบ bundled ที่หายไป หรือรายการ `channels.<id>` ที่ stale สำหรับ Plugin เดียวกันนั้น หาก config เสียด้วยเหตุผลที่ไม่เกี่ยวข้อง การติดตั้งยังคงล้มเหลวแบบปิดและบอก operator ให้รัน `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนโหลดแบบเต็ม

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วงเริ่มต้นก่อน listen แม้สำหรับช่องทางที่กำหนดค่าไว้แล้ว entry แบบเต็มจะโหลดหลังจาก Gateway เริ่ม listen แล้ว

<Warning>
เปิดใช้การเลื่อนโหลดเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ Gateway ต้องใช้ก่อนเริ่ม listen (การลงทะเบียนช่องทาง, route HTTP, method ของ Gateway) หาก entry แบบเต็มเป็นเจ้าของ capability ที่จำเป็นต่อการเริ่มต้น ให้คงพฤติกรรมเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียน method RPC ของ Gateway ให้เก็บไว้บน prefix เฉพาะ Plugin namespace ผู้ดูแล core ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve เป็น `operator.admin` เสมอ

## Manifest ของ Plugin

Plugin native ทุกตัวต้องจัดส่ง `openclaw.plugin.json` ในรากของแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบ config โดยไม่ execute โค้ดของ Plugin

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

แม้แต่ Plugin ที่ไม่มี config ก็ต้องจัดส่ง schema schema ว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [Manifest ของ Plugin](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง schema ฉบับเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias การเผยแพร่เดิมสำหรับ skill เท่านั้นมีไว้สำหรับ Skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาของ `index.ts` ที่ OpenClaw โหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่า (การเริ่มใช้งาน, การซ่อมแซม config, การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ด runtime ขนาดหนัก (ไลบรารี crypto, การลงทะเบียน CLI, บริการพื้นหลัง) ระหว่างโฟลว์การตั้งค่า

ช่องทาง workspace ที่ bundled และเก็บ export ที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ contract แบบ bundled นั้นยังรองรับ export `runtime` แบบไม่บังคับ เพื่อให้การเชื่อม runtime ในช่วงตั้งค่ายังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry เต็ม">
    - ช่องทางถูกปิดใช้งานแต่ต้องใช้พื้นผิวการตั้งค่า/การเริ่มใช้งาน
    - ช่องทางถูกเปิดใช้งานแต่ยังไม่ได้ config
    - การโหลดแบบเลื่อนเวลาเปิดใช้งานอยู่ (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ Plugin ของช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - HTTP routes ใดๆ ที่ต้องใช้ก่อน Gateway listen
    - เมธอด Gateway ใดๆ ที่ต้องใช้ระหว่างการเริ่มต้น

    เมธอด Gateway ช่วงเริ่มต้นเหล่านั้นควรยังคงหลีกเลี่ยง namespace ผู้ดูแลระบบ core ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวมไว้">
    - การลงทะเบียน CLI
    - บริการพื้นหลัง
    - การ import runtime ขนาดหนัก (crypto, SDK)
    - เมธอด Gateway ที่ต้องใช้หลังการเริ่มต้นเท่านั้น

  </Accordion>
</AccordionGroup>

### การ import helper สำหรับการตั้งค่าแบบแคบ

สำหรับ path ที่ใช้เฉพาะการตั้งค่าและต้องร้อนเร็ว ให้เลือก seam ของ helper การตั้งค่าแบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องใช้เพียงบางส่วนของพื้นผิวการตั้งค่า:

| path สำหรับ import                  | ใช้สำหรับ                                                                                 | export สำคัญ                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helper runtime ช่วงตั้งค่าที่ยังพร้อมใช้ใน `setupEntry` / การเริ่มต้นช่องทางแบบเลื่อนเวลา | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adapter การตั้งค่าบัญชีที่รับรู้สภาพแวดล้อม                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`            | helper สำหรับการตั้งค่า/ติดตั้ง CLI/archive/docs                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการกล่องเครื่องมือการตั้งค่าร่วมทั้งหมด รวมถึง helper config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

adapter patch สำหรับการตั้งค่ายังคงปลอดภัยสำหรับ hot path เมื่อ import การค้นหา contract-surface สำหรับการโปรโมตบัญชีเดียวแบบ bundled ของ adapter เหล่านี้เป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการค้นหา contract-surface แบบ bundled ล่วงหน้าก่อนที่ adapter จะถูกใช้งานจริง

### การโปรโมตบัญชีเดียวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบบัญชีเดียวไปเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมเริ่มต้นคือการย้ายค่าที่มีขอบเขตเป็นบัญชีซึ่งถูกโปรโมตเข้าไปใน `accounts.default`

ช่องทาง bundled สามารถจำกัดหรือ override การโปรโมตนั้นผ่านพื้นผิว contract การตั้งค่าของตน:

- `singleAccountKeysToMove`: key ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปในบัญชีที่ถูกโปรโมต
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่ออยู่แล้ว เฉพาะ key เหล่านี้เท่านั้นที่จะถูกย้ายเข้าไปในบัญชีที่ถูกโปรโมต; key นโยบาย/การส่งมอบร่วมจะยังอยู่ที่ root ของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะรับค่าที่ถูกโปรโมต

<Note>
Matrix เป็นตัวอย่าง bundled ปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่ออยู่แล้วเพียงบัญชีเดียวพอดี หรือหาก `defaultAccount` ชี้ไปยัง key ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การโปรโมตจะรักษาบัญชีนั้นไว้แทนการสร้าง entry `accounts.default` ใหม่
</Note>

## Schema ของ config

config ของ Plugin ถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้ config Plugin ผ่าน:

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

### การสร้าง schema config ของช่องทาง

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

สำหรับ Plugin ภายนอก contract แบบ cold-path ยังคงเป็น manifest ของ Plugin: ให้ mirror JSON Schema ที่สร้างแล้วเข้าไปใน `openclaw.plugin.json#channelConfigs` เพื่อให้ schema config, การตั้งค่า, และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## ตัวช่วยตั้งค่า

Plugin ของช่องทางสามารถให้ตัวช่วยตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ตัวช่วยคือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่นๆ ดูตัวอย่างเต็มได้จากแพ็กเกจ Plugin แบบ bundled (เช่น Plugin Discord `src/channel.setup.ts`)

<AccordionGroup>
  <Accordion title="prompt allowFrom ร่วม">
    สำหรับ prompt allowlist ของ DM ที่ต้องใช้เพียงโฟลว์มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือก helper การตั้งค่าร่วมจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับบล็อกสถานะการตั้งค่าช่องทางที่แตกต่างกันเฉพาะ label, score, และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือก `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` เดิมซ้ำเองในแต่ละ Plugin
  </Accordion>
  <Accordion title="พื้นผิวการตั้งค่าช่องทางแบบไม่บังคับ">
    สำหรับพื้นผิวการตั้งค่าแบบไม่บังคับที่ควรปรากฏเฉพาะในบาง context ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` ยังเปิดเผย builder ระดับต่ำกว่า `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของพื้นผิวการติดตั้งแบบไม่บังคับนั้น

    adapter/wizard แบบไม่บังคับที่สร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง พวกมันใช้ข้อความจำเป็นต้องติดตั้งเดียวกันซ้ำใน `validateInput`, `applyAccountConfig`, และ `finalize` และต่อท้ายลิงก์ docs เมื่อมีการตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="helper การตั้งค่าที่มี binary รองรับ">
    สำหรับ UI การตั้งค่าที่มี binary รองรับ ให้เลือก helper แบบ delegated ร่วมแทนการคัดลอก glue ของ binary/status เดิมเข้าไปในทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่แตกต่างกันเฉพาะ label, hint, score, และการตรวจจับ binary
    - `createCliPathTextInput(...)` สำหรับ text input ที่รองรับด้วย path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยัง wizard เต็มที่หนักกว่าแบบ lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้อง delegate เพียงการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) แล้วติดตั้ง:

<Tabs>
  <Tab title="อัตโนมัติ (ClawHub แล้วต่อด้วย npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw จะลอง ClawHub ก่อนและ fallback ไปยัง npm โดยอัตโนมัติ

  </Tab>
  <Tab title="เฉพาะ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="package spec ของ npm">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไป ClawHub หรือเมื่อคุณต้องใช้
    path ติดตั้ง npm โดยตรงระหว่างการย้าย:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ใน repo:** วางไว้ใต้ tree workspace ของ Plugin แบบ bundled แล้วจะถูกค้นพบโดยอัตโนมัติระหว่าง build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มาจาก npm, `openclaw plugins install` จะติดตั้งแพ็กเกจไว้ใต้ `~/.openclaw/npm` โดยปิด lifecycle scripts ไว้ รักษา dependency tree ของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ build แบบ `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway จะไม่ติดตั้ง dependency ของ Plugin โฟลว์ติดตั้ง npm/git/ClawHub เป็นเจ้าของการทำให้ dependency บรรจบกัน; Plugin ในเครื่องต้องมี dependency ติดตั้งไว้แล้ว
</Note>

เมตาดาต้าของแพ็กเกจที่บันเดิลมาถูกระบุไว้อย่างชัดเจน ไม่ได้อนุมานจาก JavaScript ที่บิลด์แล้วระหว่างการเริ่มต้น Gateway การพึ่งพารันไทม์ควรอยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของการพึ่งพานั้น การเริ่มต้น OpenClaw แบบแพ็กเกจจะไม่ซ่อมแซมหรือทำมิเรอร์การพึ่งพาของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — เอกสารอ้างอิงสคีมาแมนิเฟสต์ฉบับเต็ม
- [จุดเข้า SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
