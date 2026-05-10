---
read_when:
    - คุณกำลังเพิ่มตัวช่วยตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจ setup-entry.ts เทียบกับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมตาดาตา openclaw ใน package.json
sidebarTitle: Setup and config
summary: ตัวช่วยตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า, และเมทาดาทาของ package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-05-10T19:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการจัดแพ็กเกจ Plugin (เมทาดาทา `package.json`), manifest (`openclaw.plugin.json`), รายการ setup และสคีมา config

<Tip>
**กำลังมองหาคำแนะนำแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือวิธีใช้งานครอบคลุมการจัดแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมทาดาทาแพ็กเกจ

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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นจำเป็นต้องมี snippet สำหรับการเผยแพร่มาตรฐานอยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์จุดเริ่มต้น (สัมพันธ์กับรากแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  จุดเริ่มต้นแบบเบาสำหรับ setup เท่านั้น (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาทาแค็ตตาล็อกช่องทางสำหรับพื้นผิว setup, picker, quickstart และสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  id ผู้ให้บริการที่ Plugin นี้ลงทะเบียน
</ParamField>
<ParamField path="install" type="object">
  คำแนะนำการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  flag พฤติกรรม startup
</ParamField>

### `openclaw.channel`

`openclaw.channel` เป็นเมทาดาทาแพ็กเกจราคาถูกสำหรับการค้นพบช่องทางและพื้นผิว setup ก่อนโหลด runtime

| ฟิลด์                                  | ชนิด       | ความหมาย                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทางมาตรฐาน                                                             |
| `label`                                | `string`   | ป้ายชื่อช่องทางหลัก                                                           |
| `selectionLabel`                       | `string`   | ป้ายชื่อ picker/setup เมื่อควรแตกต่างจาก `label`                              |
| `detailLabel`                          | `string`   | ป้ายรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ขึ้น        |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์ setup และการเลือก                                        |
| `docsLabel`                            | `string`   | ป้ายชื่อทับที่ใช้กับลิงก์เอกสารเมื่อควรแตกต่างจาก id ช่องทาง                 |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แค็ตตาล็อก                                      |
| `order`                                | `number`   | ลำดับการจัดเรียงในแค็ตตาล็อกช่องทาง                                          |
| `aliases`                              | `string[]` | alias เพิ่มเติมสำหรับค้นหาในการเลือกช่องทาง                                   |
| `preferOver`                           | `string[]` | id Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า     |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image แบบไม่บังคับสำหรับแค็ตตาล็อก UI ช่องทาง               |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                                     |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายชื่อในข้อความการเลือก              |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                                 |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายช่องทางว่ารองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก       |
| `exposure`                             | `object`   | ตัวควบคุมการมองเห็นช่องทางสำหรับ setup, รายการที่ config แล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้เข้าร่วม flow setup `allowFrom` มาตรฐานของ quickstart       |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว                             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | เลือกใช้การค้นหา session เมื่อแก้ announce target สำหรับช่องทางนี้            |

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
- `setup`: รวมช่องทางไว้ใน picker setup/configure แบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางว่าแสดงต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะ alias legacy แนะนำให้ใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` เป็นเมทาดาทาแพ็กเกจ ไม่ใช่เมทาดาทา manifest

| ฟิลด์                        | ชนิด                                | ความหมาย                                                                          |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | spec ClawHub มาตรฐานสำหรับ flow install/update และ onboarding install-on-demand  |
| `npmSpec`                    | `string`                            | spec npm มาตรฐานสำหรับ flow fallback ของ install/update                           |
| `localPath`                  | `string`                            | พาธการพัฒนาในเครื่องหรือพาธติดตั้งที่ bundle มา                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีหลายแหล่งพร้อมใช้งาน                                |
| `minHostVersion`             | `string`                            | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับในรูปแบบ `>=x.y.z` หรือ `>=x.y.z-prerelease`   |
| `expectedIntegrity`          | `string`                            | สตริง integrity ของ npm dist ที่คาดหวัง ปกติคือ `sha512-...` สำหรับการติดตั้งแบบ pin |
| `allowInvalidConfigRecovery` | `boolean`                           | อนุญาตให้ flow ติดตั้ง Plugin ที่ bundle มาใหม่กู้คืนจากความล้มเหลว stale-config เฉพาะรายการ |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    onboarding แบบโต้ตอบยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand ด้วย หาก Plugin ของคุณเปิดเผยตัวเลือก auth ของผู้ให้บริการหรือเมทาดาทา setup/แค็ตตาล็อกของช่องทางก่อนโหลด runtime onboarding สามารถแสดงตัวเลือกนั้น แจ้งให้เลือกการติดตั้งจาก ClawHub, npm หรือ local ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนิน flow ที่เลือกต่อ ตัวเลือก onboarding ของ ClawHub ใช้ `clawhubSpec` และจะถูกเลือกก่อนเมื่อมีอยู่ ตัวเลือก npm ต้องมีเมทาดาทาแค็ตตาล็อกที่เชื่อถือได้พร้อม registry `npmSpec` เวอร์ชันแบบ exact และ `expectedIntegrity` เป็น pin npm แบบไม่บังคับ หากมี `expectedIntegrity` flow install/update จะบังคับใช้กับ npm เก็บเมทาดาทา "จะแสดงอะไร" ไว้ใน `openclaw.plugin.json` และเมทาดาทา "จะติดตั้งอย่างไร" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    หากตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลด manifest-registry ที่ไม่ได้ bundle มาจะบังคับใช้ค่านี้ host เก่าจะข้าม Plugin ภายนอก สตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ Plugin ต้นทางที่ bundle มาจะถือว่าใช้เวอร์ชันเดียวกับ host checkout
  </Accordion>
  <Accordion title="Pinned npm installs">
    สำหรับการติดตั้ง npm แบบ pin ให้เก็บเวอร์ชัน exact ไว้ใน `npmSpec` และเพิ่ม integrity ของ artifact ที่คาดหวัง:

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
    `allowInvalidConfigRecovery` ไม่ใช่ bypass ทั่วไปสำหรับ config ที่เสีย ใช้สำหรับการกู้คืน Plugin ที่ bundle มาในขอบเขตแคบเท่านั้น เพื่อให้ reinstall/setup ซ่อมแซมสิ่งตกค้างจากการอัปเกรดที่รู้จักได้ เช่น พาธ Plugin ที่ bundle มาหายไป หรือรายการ `channels.<id>` ที่ stale สำหรับ Plugin เดียวกันนั้น หาก config เสียจากเหตุผลที่ไม่เกี่ยวข้อง การติดตั้งยังคง fail closed และบอกผู้ปฏิบัติงานให้รัน `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การโหลดเต็มแบบเลื่อนเวลา

Plugin ช่องทางสามารถเลือกใช้การโหลดแบบเลื่อนเวลาด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างเฟส startup ก่อน listen แม้กับช่องทางที่ config แล้วก็ตาม จุดเริ่มต้นเต็มจะโหลดหลังจาก Gateway เริ่ม listen

<Warning>
เปิดใช้การโหลดแบบเลื่อนเวลาเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ Gateway ต้องใช้ก่อนเริ่ม listen แล้วเท่านั้น (การลงทะเบียนช่องทาง, route HTTP, เมธอด gateway) หากจุดเริ่มต้นเต็มเป็นเจ้าของ capability startup ที่จำเป็น ให้คงพฤติกรรมเริ่มต้นไว้
</Warning>

หาก setup/full entry ของคุณลงทะเบียนเมธอด RPC ของ gateway ให้ใช้ prefix เฉพาะ Plugin namespace ผู้ดูแลระบบ core ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve เป็น `operator.admin` เสมอ

## manifest ของ Plugin

Plugin native ทุกตัวต้องมาพร้อมกับ `openclaw.plugin.json` ในรากแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบ config โดยไม่ต้องเรียกใช้โค้ด Plugin

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

แม้แต่ Plugin ที่ไม่มี config ก็ต้องมาพร้อมกับสคีมา สคีมาว่างถือว่าถูกต้อง:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [manifest ของ Plugin](/th/plugins/manifest) สำหรับข้อมูลอ้างอิงสคีมาฉบับเต็ม

## การเผยแพร่ ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
alias การเผยแพร่แบบเดิมที่ใช้เฉพาะ skill มีไว้สำหรับ skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## รายการตั้งค่า

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบากว่าแทน `index.ts` ที่ OpenClaw โหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่าเท่านั้น (การเริ่มต้นใช้งาน, การซ่อมแซม config, การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ด runtime ที่หนัก (ไลบรารี crypto, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่าง flow การตั้งค่า

ช่องทาง workspace ที่รวมมาด้วยซึ่งเก็บ export ที่ปลอดภัยต่อการตั้งค่าไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ contract ที่รวมมาด้วยนั้นยังรองรับ export `runtime` แบบไม่บังคับ เพื่อให้การเชื่อม runtime ในช่วงตั้งค่ายังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry เต็ม">
    - ช่องทางถูกปิดใช้งานแต่ต้องใช้พื้นผิวการตั้งค่า/การเริ่มต้นใช้งาน
    - ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า
    - เปิดใช้การโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ channel plugin (ผ่าน `defineSetupPluginEntry`)
    - HTTP route ใด ๆ ที่จำเป็นก่อน gateway listen
    - gateway method ใด ๆ ที่จำเป็นระหว่าง startup

    gateway method สำหรับ startup เหล่านั้นยังควรหลีกเลี่ยง namespace สำหรับ admin ของ core ที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวม">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - runtime import ที่หนัก (crypto, SDK)
    - Gateway method ที่จำเป็นเฉพาะหลัง startup

  </Accordion>
</AccordionGroup>

### import ตัวช่วยการตั้งค่าแบบแคบ

สำหรับ path ที่ใช้เฉพาะการตั้งค่าและเป็น hot path ให้เลือกใช้ seam ตัวช่วยการตั้งค่าแบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิวการตั้งค่า:

| path สำหรับ import                   | ใช้สำหรับ                                                                                 | export หลัก                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วย runtime ช่วงตั้งค่าที่ยังคงใช้ได้ใน `setupEntry` / startup ของช่องทางแบบเลื่อนเวลา | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime`                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ตัวช่วย CLI/archive/docs สำหรับ setup/install                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการชุดเครื่องมือการตั้งค่าที่ใช้ร่วมกันแบบเต็ม รวมถึงตัวช่วย config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

adapter สำหรับ patch การตั้งค่ายังคงปลอดภัยต่อ hot path เมื่อ import การค้นหา contract-surface สำหรับการเลื่อนระดับบัญชีเดียวที่รวมมาด้วยจะเป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการค้นพบ contract-surface ที่รวมมาด้วยล่วงหน้าก่อนที่ adapter จะถูกใช้งานจริง

### การเลื่อนระดับบัญชีเดียวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบบัญชีเดียวไปเป็น `channels.<id>.accounts.*` behavior ที่ใช้ร่วมกันโดยค่าเริ่มต้นคือการย้ายค่าที่อยู่ในขอบเขตบัญชีที่ถูกเลื่อนระดับเข้าไปใน `accounts.default`

ช่องทางที่รวมมาด้วยสามารถจำกัดหรือ override การเลื่อนระดับนั้นผ่านพื้นผิว contract สำหรับการตั้งค่าของตน:

- `singleAccountKeysToMove`: key ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปในบัญชีที่ถูกเลื่อนระดับ
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่ออยู่แล้ว เฉพาะ key เหล่านี้เท่านั้นที่จะถูกย้ายเข้าไปในบัญชีที่ถูกเลื่อนระดับ; key นโยบาย/การส่งมอบที่ใช้ร่วมกันจะยังอยู่ที่ root ของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะรับค่าที่ถูกเลื่อนระดับ

<Note>
Matrix คือตัวอย่างที่รวมมาด้วยในปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่ออยู่แล้วเพียงบัญชีเดียวพอดี หรือถ้า `defaultAccount` ชี้ไปยัง key ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การเลื่อนระดับจะรักษาบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่
</Note>

## schema ของ config

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

### การสร้าง schema ของ config สำหรับช่องทาง

ใช้ `buildChannelConfigSchema` เพื่อแปลง schema ของ Zod เป็น wrapper `ChannelConfigSchema` ที่ artifact ของ config ที่ Plugin เป็นเจ้าของใช้:

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

หากคุณเขียน contract เป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ตัวช่วยโดยตรงเพื่อให้ OpenClaw ข้ามการแปลง Zod เป็น JSON Schema บน path metadata ได้:

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

สำหรับ plugins ของบุคคลที่สาม contract ฝั่ง cold-path ยังคงเป็น plugin manifest: mirror JSON Schema ที่สร้างขึ้นเข้าไปใน `openclaw.plugin.json#channelConfigs` เพื่อให้ schema ของ config, การตั้งค่า และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## wizard การตั้งค่า

Channel plugins สามารถให้ wizard การตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ wizard คือออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

type `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ ดูตัวอย่างเต็มได้จากแพ็กเกจ Plugin ที่รวมมาด้วย (เช่น Discord plugin `src/channel.setup.ts`)

<AccordionGroup>
  <Accordion title="prompt allowFrom ที่ใช้ร่วมกัน">
    สำหรับ prompt allowlist ของ DM ที่ต้องการเฉพาะ flow มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ตัวช่วยการตั้งค่าที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับ block สถานะการตั้งค่าช่องทางที่แตกต่างกันเฉพาะ label, score และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการสร้างออบเจ็กต์ `status` แบบเดียวกันด้วยมือในแต่ละ Plugin
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

    `plugin-sdk/channel-setup` ยังเปิดเผย builder ระดับต่ำกว่า `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของพื้นผิว optional-install นั้น

    adapter/wizard แบบไม่บังคับที่สร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง โดยจะใช้ข้อความ install-required เดียวกันซ้ำใน `validateInput`, `applyAccountConfig` และ `finalize` และต่อท้ายลิงก์ docs เมื่อกำหนด `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วยการตั้งค่าที่มี binary รองรับ">
    สำหรับ UI การตั้งค่าที่มี binary รองรับ ให้เลือกใช้ตัวช่วย delegated ที่ใช้ร่วมกันแทนการคัดลอก glue binary/status แบบเดียวกันไปยังทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับ block สถานะที่แตกต่างกันเฉพาะ label, hint, score และการตรวจหา binary
    - `createCliPathTextInput(...)` สำหรับ text input ที่อิง path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้อง forward ไปยัง wizard แบบเต็มที่หนักกว่าอย่าง lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้อง delegate เฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugins ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/clawhub) จากนั้นติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    package spec แบบเปล่าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านช่วง launch

  </Tab>
  <Tab title="เฉพาะ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไป ClawHub หรือเมื่อคุณต้องการ
    path การติดตั้ง npm โดยตรงระหว่าง migration:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ในรีโป:** วางไว้ใต้โครงสร้างเวิร์กสเปซ Plugin ที่รวมมากับแพ็กเกจ แล้วระบบจะค้นพบโดยอัตโนมัติระหว่างการบิลด์

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งที่มาจาก npm, `openclaw plugins install` จะติดตั้งแพ็กเกจไว้ใต้ `~/.openclaw/npm` โดยปิดใช้งานสคริปต์วงจรชีวิต ควรให้แผนผัง dependency ของ Plugin เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้บิลด์ `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway จะไม่ติดตั้ง dependency ของ Plugin โฟลว์การติดตั้ง npm/git/ClawHub เป็นผู้รับผิดชอบการปรับ dependency ให้บรรจบกัน ส่วน Plugin ในเครื่องต้องติดตั้ง dependency ไว้แล้ว
</Note>

เมตาดาต้าของแพ็กเกจที่รวมมาด้วยถูกระบุไว้อย่างชัดเจน ไม่ได้อนุมานจาก JavaScript ที่บิลด์แล้วเมื่อเริ่มต้น Gateway dependency ขณะรันไทม์ควรอยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของมัน การเริ่มต้น OpenClaw แบบแพ็กเกจจะไม่ซ่อมแซมหรือจำลอง dependency ของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นทีละขั้นตอน
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — ข้อมูลอ้างอิงสคีมาแมนิเฟสต์ฉบับเต็ม
- [จุดเข้า SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
