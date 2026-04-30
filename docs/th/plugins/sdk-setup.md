---
read_when:
    - คุณกำลังเพิ่มตัวช่วยสร้างการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมตาดาตา openclaw ใน package.json
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และเมทาดาทาใน package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-04-30T10:09:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการแพ็กเกจ Plugin (เมทาดาต้า `package.json`), manifest (`openclaw.plugin.json`), รายการ setup และสคีมา config

<Tip>
**กำลังมองหาคู่มือแบบทีละขั้นอยู่ใช่ไหม?** คู่มือวิธีทำอธิบายการแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Provider plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมทาดาต้าแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า Plugin ของคุณให้อะไรบ้าง:

<Tabs>
  <Tab title="Plugin ช่องทาง">
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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านี้เป็นฟิลด์ที่จำเป็น ส่วน snippet การเผยแพร่มาตรฐานอยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์ entry point (สัมพันธ์กับรากแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  รายการแบบเบาสำหรับ setup เท่านั้น (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาต้าแค็ตตาล็อกช่องทางสำหรับพื้นผิว setup, picker, quickstart และสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  id ของ provider ที่ Plugin นี้ลงทะเบียน
</ParamField>
<ParamField path="install" type="object">
  คำใบ้การติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กลักษณะการทำงานตอนเริ่มต้น
</ParamField>

### `openclaw.channel`

`openclaw.channel` คือเมทาดาต้าแพ็กเกจแบบเบาสำหรับการค้นพบช่องทางและพื้นผิว setup ก่อนที่ runtime จะโหลด

| ฟิลด์                                  | ประเภท    | ความหมาย                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทางมาตรฐาน                                                             |
| `label`                                | `string`   | ป้ายกำกับหลักของช่องทาง                                                       |
| `selectionLabel`                       | `string`   | ป้ายกำกับ picker/setup เมื่อควรแตกต่างจาก `label`                             |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ขึ้น   |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์ setup และการเลือก                                        |
| `docsLabel`                            | `string`   | ป้ายกำกับแทนที่ที่ใช้กับลิงก์เอกสารเมื่อควรแตกต่างจาก id ช่องทาง             |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                      |
| `order`                                | `number`   | ลำดับการเรียงในแค็ตตาล็อกช่องทาง                                             |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับค้นหาการเลือกช่องทาง                                    |
| `preferOver`                           | `string[]` | id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือ    |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image ที่ไม่บังคับสำหรับแค็ตตาล็อก UI ช่องทาง               |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                                    |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายกำกับในข้อความการเลือก            |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                                |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นช่องทางสำหรับ setup, รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | ให้ช่องทางนี้เข้าร่วมโฟลว์ setup มาตรฐาน `allowFrom` ของ quickstart           |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีบัญชีอยู่เพียงบัญชีเดียว                    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | ใช้การค้นหา session เป็นหลักเมื่อ resolve เป้าหมายประกาศสำหรับช่องทางนี้     |

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

- `configured`: รวมช่องทางไว้ในพื้นผิวรายการแบบ configured/status
- `setup`: รวมช่องทางไว้ใน picker สำหรับ setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางว่าเป็น public-facing ในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias แบบ legacy แนะนำให้ใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` คือเมทาดาต้าแพ็กเกจ ไม่ใช่เมทาดาต้า manifest

| ฟิลด์                        | ประเภท               | ความหมาย                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec มาตรฐานสำหรับโฟลว์ติดตั้ง/อัปเดต                                      |
| `localPath`                  | `string`             | พาธการพัฒนาในเครื่องหรือพาธการติดตั้งแบบ bundled                               |
| `defaultChoice`              | `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อใช้ได้ทั้งสองแบบ                                     |
| `minHostVersion`             | `string`             | เวอร์ชัน OpenClaw ต่ำสุดที่รองรับในรูปแบบ `>=x.y.z`                             |
| `expectedIntegrity`          | `string`             | สตริง integrity ของ npm dist ที่คาดไว้ โดยปกติเป็น `sha512-...` สำหรับการติดตั้งแบบ pinned |
| `allowInvalidConfigRecovery` | `boolean`            | ให้โฟลว์ติดตั้ง Plugin แบบ bundled ใหม่กู้คืนจากข้อผิดพลาด stale-config เฉพาะบางกรณีได้ |

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานของ Onboarding">
    Onboarding แบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand ด้วย หาก Plugin ของคุณแสดงตัวเลือก auth ของ provider หรือเมทาดาต้า setup/แค็ตตาล็อกของช่องทางก่อนที่ runtime จะโหลด onboarding สามารถแสดงตัวเลือกนั้น ถามว่าจะติดตั้งผ่าน npm หรือ local ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนินโฟลว์ที่เลือกต่อ ตัวเลือก onboarding ผ่าน npm ต้องใช้เมทาดาต้าแค็ตตาล็อกที่เชื่อถือได้พร้อม registry `npmSpec`; เวอร์ชันแบบ exact และ `expectedIntegrity` เป็น pin ที่ไม่บังคับ หากมี `expectedIntegrity` โฟลว์ติดตั้ง/อัปเดตจะบังคับตรวจสอบค่านั้น เก็บเมทาดาต้า "จะแสดงอะไร" ไว้ใน `openclaw.plugin.json` และเมทาดาต้า "จะติดตั้งอย่างไร" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="การบังคับใช้ minHostVersion">
    หากตั้งค่า `minHostVersion` ไว้ ทั้งการติดตั้งและการโหลด manifest-registry จะบังคับใช้ค่านี้ host รุ่นเก่าจะข้าม Plugin และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ
  </Accordion>
  <Accordion title="การติดตั้ง npm แบบ pinned">
    สำหรับการติดตั้ง npm แบบ pinned ให้เก็บเวอร์ชัน exact ไว้ใน `npmSpec` และเพิ่ม integrity ของ artifact ที่คาดไว้:

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
    `allowInvalidConfigRecovery` ไม่ใช่ bypass ทั่วไปสำหรับ config ที่เสีย ใช้สำหรับการกู้คืน Plugin แบบ bundled เฉพาะขอบเขตแคบเท่านั้น เพื่อให้การติดตั้งใหม่/setup ซ่อมส่วนตกค้างจากการอัปเกรดที่รู้จักได้ เช่น พาธ Plugin แบบ bundled ที่หายไป หรือรายการ `channels.<id>` ที่ stale สำหรับ Plugin เดียวกันนั้น หาก config เสียด้วยเหตุผลอื่น การติดตั้งจะยังคงปิดอย่างปลอดภัยและบอกผู้ดูแลระบบให้รัน `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนการโหลดแบบเต็ม

Plugin ช่องทางสามารถเลือกใช้การโหลดแบบเลื่อนได้ด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วงเริ่มต้นก่อน listen แม้สำหรับช่องทางที่กำหนดค่าไว้แล้วก็ตาม entry แบบเต็มจะโหลดหลังจาก Gateway เริ่ม listen แล้ว

<Warning>
เปิดใช้การโหลดแบบเลื่อนเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ Gateway ต้องใช้ก่อนเริ่ม listen (การลงทะเบียนช่องทาง, HTTP routes, gateway methods) หาก entry แบบเต็มเป็นเจ้าของ capability ที่จำเป็นตอนเริ่มต้น ให้คงลักษณะการทำงานเริ่มต้นไว้
</Warning>

หาก entry สำหรับ setup/full ของคุณลงทะเบียนเมธอด Gateway RPC ให้เก็บไว้ใต้ prefix เฉพาะของ Plugin namespace สำหรับ admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve เป็น `operator.admin` เสมอ

## manifest ของ Plugin

Plugin native ทุกตัวต้องส่ง `openclaw.plugin.json` ในรากแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบ config โดยไม่ต้อง execute โค้ด Plugin

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

แม้แต่ Plugin ที่ไม่มี config ก็ต้องส่งสคีมา สคีมาว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [manifest ของ Plugin](/th/plugins/manifest) สำหรับข้อมูลอ้างอิงสคีมาเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias การเผยแพร่แบบ legacy สำหรับ skill-only มีไว้สำหรับ Skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## Setup entry

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาแทน `index.ts` ที่ OpenClaw โหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิว setup (onboarding, การซ่อม config, การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ดรันไทม์ขนาดใหญ่ (ไลบรารี crypto, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่างโฟลว์การตั้งค่า

ช่องทางในเวิร์กสเปซที่บันเดิลมาด้วยซึ่งเก็บ exports ที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ สัญญาแบบบันเดิลนั้นยังรองรับ `runtime` export แบบไม่บังคับ เพื่อให้การเชื่อมต่อรันไทม์ในช่วงตั้งค่ายังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry แบบเต็ม">
    - ช่องทางถูกปิดใช้งาน แต่ต้องมีพื้นผิวการตั้งค่า/การเริ่มต้นใช้งาน
    - ช่องทางถูกเปิดใช้งาน แต่ยังไม่ได้กำหนดค่า
    - เปิดใช้งานการโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ Plugin ของช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - เส้นทาง HTTP ใดๆ ที่ต้องใช้ก่อน gateway listen
    - เมธอด Gateway ใดๆ ที่ต้องใช้ระหว่างการเริ่มต้น

    เมธอด Gateway ช่วงเริ่มต้นเหล่านั้นยังควรหลีกเลี่ยงเนมสเปซผู้ดูแลหลักที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวมไว้">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - การนำเข้า runtime ขนาดใหญ่ (crypto, SDKs)
    - เมธอด Gateway ที่จำเป็นหลังจากเริ่มต้นแล้วเท่านั้น

  </Accordion>
</AccordionGroup>

### การนำเข้าตัวช่วยตั้งค่าแบบแคบ

สำหรับเส้นทางร้อนที่ใช้เฉพาะการตั้งค่า ให้เลือก seam ตัวช่วยตั้งค่าแบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิวการตั้งค่า:

| เส้นทางนำเข้า                        | ใช้สำหรับ                                                                                | exports สำคัญ                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วยรันไทม์ช่วงตั้งค่าที่ยังคงใช้ได้ใน `setupEntry` / การเริ่มต้นช่องทางแบบเลื่อนเวลา | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | อะแดปเตอร์การตั้งค่าบัญชีที่รับรู้สภาพแวดล้อม                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ตัวช่วย CLI/ไฟล์เก็บถาวร/เอกสาร สำหรับการตั้งค่า/ติดตั้ง                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการกล่องเครื่องมือการตั้งค่าร่วมทั้งหมด รวมถึงตัวช่วย config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

อะแดปเตอร์แพตช์การตั้งค่ายังคงปลอดภัยสำหรับ hot path เมื่อ import การค้นหาพื้นผิวสัญญาการเลื่อนระดับบัญชีเดียวที่บันเดิลมาด้วยเป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการค้นพบพื้นผิวสัญญาแบบบันเดิลล่วงหน้าก่อนที่อะแดปเตอร์จะถูกใช้งานจริง

### การเลื่อนระดับบัญชีเดียวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบบัญชีเดียวไปเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมเริ่มต้นคือย้ายค่าที่เลื่อนระดับซึ่งอยู่ในขอบเขตบัญชีไปไว้ใน `accounts.default`

ช่องทางที่บันเดิลมาด้วยสามารถจำกัดหรือแทนที่การเลื่อนระดับนั้นผ่านพื้นผิวสัญญาการตั้งค่าของตน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปในบัญชีที่เลื่อนระดับ
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่ออยู่แล้ว เฉพาะคีย์เหล่านี้เท่านั้นที่จะถูกย้ายเข้าไปในบัญชีที่เลื่อนระดับ; คีย์นโยบาย/การส่งมอบร่วมยังคงอยู่ที่ root ของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่ใดจะได้รับค่าที่เลื่อนระดับ

<Note>
Matrix คือตัวอย่างที่บันเดิลมาในปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่ออยู่แล้วเพียงหนึ่งบัญชีพอดี หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การเลื่อนระดับจะเก็บบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่
</Note>

## สคีมา config

config ของ Plugin ถูกตรวจสอบกับ JSON Schema ใน manifest ของคุณ ผู้ใช้กำหนดค่า plugins ผ่าน:

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

### การสร้างสคีมา config ของช่องทาง

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

สำหรับ Plugin ภายนอก สัญญา cold-path ยังคงเป็น plugin manifest: สะท้อน JSON Schema ที่สร้างแล้วเข้าไปใน `openclaw.plugin.json#channelConfigs` เพื่อให้สคีมา config, การตั้งค่า และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## วิซาร์ดการตั้งค่า

Plugin ช่องทางสามารถให้วิซาร์ดการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ วิซาร์ดคือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่นๆ ดูตัวอย่างเต็มได้ในแพ็กเกจ Plugin ที่บันเดิลมาด้วย (เช่น Plugin Discord `src/channel.setup.ts`)

<AccordionGroup>
  <Accordion title="พรอมป์ allowFrom ร่วม">
    สำหรับพรอมป์ allowlist ของ DM ที่ต้องใช้เพียงโฟลว์มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกตัวช่วยการตั้งค่าร่วมจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับบล็อกสถานะการตั้งค่าช่องทางที่แตกต่างกันเฉพาะ label, score และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือก `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการเขียนออบเจ็กต์ `status` เดิมซ้ำเองในแต่ละ Plugin
  </Accordion>
  <Accordion title="พื้นผิวการตั้งค่าช่องทางแบบไม่บังคับ">
    สำหรับพื้นผิวการตั้งค่าแบบไม่บังคับที่ควรปรากฏเฉพาะในบางบริบท ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

    อะแดปเตอร์/วิซาร์ดแบบไม่บังคับที่สร้างขึ้นจะ fail closed เมื่อเขียน config จริง พวกมันใช้ข้อความ install-required เดียวกันซ้ำใน `validateInput`, `applyAccountConfig` และ `finalize` และต่อท้ายลิงก์เอกสารเมื่อกำหนด `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วยการตั้งค่าที่มี binary หนุนหลัง">
    สำหรับ UI การตั้งค่าที่มี binary หนุนหลัง ให้เลือกตัวช่วย delegated ร่วมแทนการคัดลอก glue ของ binary/status แบบเดิมไปไว้ในทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่แตกต่างกันเฉพาะ label, hint, score และการตรวจหา binary
    - `createCliPathTextInput(...)` สำหรับ text input ที่อ้างอิง path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยังวิซาร์ดเต็มที่หนักกว่าแบบ lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องมอบหมายเฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) แล้วติดตั้ง:

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
  <Tab title="สเปกแพ็กเกจ npm">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไป ClawHub หรือเมื่อคุณต้องการ
    เส้นทางติดตั้ง npm โดยตรงระหว่างการย้าย:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ใน repo:** วางไว้ใต้ต้นไม้เวิร์กสเปซ Plugin ที่บันเดิลมาด้วย แล้วจะถูกค้นพบโดยอัตโนมัติระหว่าง build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มีแหล่งที่มาจาก npm, `openclaw plugins install` จะรัน `npm install --ignore-scripts` ภายในโปรเจกต์ (ไม่มี lifecycle scripts) โดยไม่สนใจการตั้งค่า npm install ส่วนกลางที่สืบทอดมา รักษาต้นไม้ dependency ของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ build ใน `postinstall`
</Info>

<Note>
Plugin ที่ OpenClaw เป็นเจ้าของและรวมมาด้วยเป็นข้อยกเว้นเดียวสำหรับการซ่อมแซมระหว่างเริ่มต้น: เมื่อการติดตั้งแบบแพ็กเกจพบว่ามีรายการหนึ่งถูกเปิดใช้งานโดยการกำหนดค่า Plugin, การกำหนดค่าช่องทางแบบเดิม หรือ manifest ที่รวมมาด้วยซึ่งเปิดใช้งานโดยค่าเริ่มต้น การเริ่มต้นจะติดตั้ง dependency รันไทม์ที่ขาดหายไปของ Plugin นั้นก่อน import ผู้ปฏิบัติงานสามารถตรวจสอบหรือซ่อมแซมขั้นตอนนั้นด้วย `openclaw plugins deps` ได้ Plugin บุคคลที่สามไม่ควรพึ่งพาการติดตั้งระหว่างเริ่มต้น ให้ใช้ตัวติดตั้ง Plugin แบบชัดเจนต่อไป
</Note>

dependency รันไทม์ระดับแพ็กเกจที่รวมมาด้วยเป็นเมตาดาตาแบบชัดเจน ไม่ได้อนุมานจาก JavaScript ที่ build แล้วในตอนเริ่มต้น Gateway หาก dependency รากของ OpenClaw ที่ใช้ร่วมกันต้องพร้อมใช้งานภายในมิเรอร์รันไทม์ Plugin ที่รวมมาด้วยแบบภายนอก ให้ประกาศไว้ใน `openclaw.bundle.mirroredRootRuntimeDependencies` ใน manifest แพ็กเกจราก

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานทีละขั้นตอน
- [manifest ของ Plugin](/th/plugins/manifest) — ข้อมูลอ้างอิง schema ของ manifest แบบเต็ม
- [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
