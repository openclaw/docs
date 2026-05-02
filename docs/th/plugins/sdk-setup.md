---
read_when:
    - คุณกำลังเพิ่มตัวช่วยตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจ setup-entry.ts เทียบกับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมทาดาทา openclaw ใน package.json
sidebarTitle: Setup and config
summary: ตัวช่วยตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และเมตาดาต้าใน package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับการแพ็กเกจ Plugin (เมทาดาทา `package.json`), manifest (`openclaw.plugin.json`), รายการตั้งค่า และสคีมาคอนฟิก

<Tip>
**กำลังมองหาคู่มือแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือ how-to ครอบคลุมการแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Provider plugins](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
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
หากคุณเผยแพร่ Plugin ภายนอกบน ClawHub ฟิลด์ `compat` และ `build` เหล่านั้นเป็นฟิลด์ที่จำเป็น สไนปเป็ตการเผยแพร่มาตรฐานอยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์จุดเข้าใช้งาน (สัมพันธ์กับรูทของแพ็กเกจ)
</ParamField>
<ParamField path="setupEntry" type="string">
  รายการสำหรับการตั้งค่าเท่านั้นแบบเบา (ไม่บังคับ)
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาทาแคตตาล็อกช่องทางสำหรับพื้นผิวการตั้งค่า ตัวเลือก quickstart และสถานะ
</ParamField>
<ParamField path="providers" type="string[]">
  id ของ Provider ที่ Plugin นี้ลงทะเบียน
</ParamField>
<ParamField path="install" type="object">
  คำแนะนำการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กพฤติกรรมตอนเริ่มต้น
</ParamField>

### `openclaw.channel`

`openclaw.channel` คือเมทาดาทาแพ็กเกจแบบเบาสำหรับการค้นพบช่องทางและพื้นผิวการตั้งค่าก่อนโหลด runtime

| ฟิลด์                                  | ประเภท       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id ช่องทางมาตรฐาน                                                         |
| `label`                                | `string`   | ป้ายกำกับหลักของช่องทาง                                                        |
| `selectionLabel`                       | `string`   | ป้ายกำกับตัวเลือก/การตั้งค่าเมื่อควรต่างจาก `label`                        |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแคตตาล็อกช่องทางและพื้นผิวสถานะที่สมบูรณ์ขึ้น       |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                                      |
| `docsLabel`                            | `string`   | ป้ายกำกับแทนที่ที่ใช้สำหรับลิงก์เอกสารเมื่อควรต่างจาก id ช่องทาง |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับ onboarding/แคตตาล็อก                                         |
| `order`                                | `number`   | ลำดับการจัดเรียงในแคตตาล็อกช่องทาง                                               |
| `aliases`                              | `string[]` | alias การค้นหาเพิ่มเติมสำหรับการเลือกช่องทาง                                   |
| `preferOver`                           | `string[]` | id ของ Plugin/ช่องทางลำดับความสำคัญต่ำกว่าที่ช่องทางนี้ควรอยู่เหนือ                |
| `systemImage`                          | `string`   | ชื่อไอคอน/system-image ที่ไม่บังคับสำหรับแคตตาล็อก UI ช่องทาง                      |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าก่อนลิงก์เอกสารในพื้นผิวการเลือก                          |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารแบบมีป้ายกำกับในข้อความการเลือก |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                               |
| `markdownCapable`                      | `boolean`  | ทำเครื่องหมายว่าช่องทางรองรับ markdown สำหรับการตัดสินใจจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | การควบคุมการมองเห็นช่องทางสำหรับการตั้งค่า รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร   |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้ใช้โฟลว์การตั้งค่า `allowFrom` quickstart มาตรฐาน         |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจน แม้จะมีเพียงบัญชีเดียวก็ตาม           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | เลือกใช้การค้นหาเซสชันเมื่อแก้เป้าหมายประกาศสำหรับช่องทางนี้       |

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

- `configured`: รวมช่องทางในพื้นผิวรายการรูปแบบ configured/status
- `setup`: รวมช่องทางในตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบ
- `docs`: ทำเครื่องหมายช่องทางว่าแสดงต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังรองรับในฐานะ alias แบบเดิม แนะนำให้ใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` คือเมทาดาทาของแพ็กเกจ ไม่ใช่เมทาดาทาของ manifest

| ฟิลด์                        | ประเภท                                | ความหมาย                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | สเปก ClawHub มาตรฐานสำหรับโฟลว์ install/update และ onboarding install-on-demand |
| `npmSpec`                    | `string`                            | สเปก npm มาตรฐานสำหรับโฟลว์สำรอง install/update                             |
| `localPath`                  | `string`                            | พาธการพัฒนาในเครื่องหรือพาธติดตั้งแบบ bundled                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีหลายแหล่งพร้อมใช้งาน                     |
| `minHostVersion`             | `string`                            | เวอร์ชัน OpenClaw ขั้นต่ำที่รองรับในรูปแบบ `>=x.y.z` หรือ `>=x.y.z-prerelease` |
| `expectedIntegrity`          | `string`                            | สตริง integrity ของ npm dist ที่คาดหวัง โดยปกติเป็น `sha512-...` สำหรับการติดตั้งแบบ pinned    |
| `allowInvalidConfigRecovery` | `boolean`                           | อนุญาตให้โฟลว์ติดตั้ง Plugin bundled ใหม่กู้คืนจากความล้มเหลว stale-config เฉพาะบางกรณี  |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interactive onboarding ยังใช้ `openclaw.install` สำหรับพื้นผิว install-on-demand ด้วย หาก Plugin ของคุณแสดงตัวเลือก provider auth หรือเมทาดาทาการตั้งค่า/แคตตาล็อกช่องทางก่อนโหลด runtime onboarding สามารถแสดงตัวเลือกนั้น แจ้งให้เลือก ClawHub, npm หรือการติดตั้งในเครื่อง ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนินโฟลว์ที่เลือกต่อ ตัวเลือก onboarding ของ ClawHub ใช้ `clawhubSpec` และจะถูกเลือกก่อนเมื่อมีอยู่ ตัวเลือก npm ต้องมีเมทาดาทาแคตตาล็อกที่เชื่อถือได้พร้อม registry `npmSpec` เวอร์ชันแบบ exact และ `expectedIntegrity` เป็น pin ของ npm ที่ไม่บังคับ หากมี `expectedIntegrity` โฟลว์ install/update จะบังคับใช้กับ npm เก็บเมทาดาทา "สิ่งที่จะแสดง" ไว้ใน `openclaw.plugin.json` และเมทาดาทา "วิธีติดตั้ง" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    หากตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลด manifest-registry ที่ไม่ใช่ bundled จะบังคับใช้ค่านี้ โฮสต์รุ่นเก่าจะข้าม Plugin ภายนอก สตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ Plugin ซอร์สแบบ bundled ถือว่าเป็นเวอร์ชันเดียวกับ host checkout
  </Accordion>
  <Accordion title="Pinned npm installs">
    สำหรับการติดตั้ง npm แบบ pinned ให้เก็บเวอร์ชัน exact ไว้ใน `npmSpec` และเพิ่ม integrity ของอาร์ติแฟกต์ที่คาดหวัง:

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
    `allowInvalidConfigRecovery` ไม่ใช่ทางลัดทั่วไปสำหรับคอนฟิกที่เสีย ใช้สำหรับการกู้คืน Plugin bundled แบบแคบเท่านั้น เพื่อให้การติดตั้งใหม่/การตั้งค่าสามารถซ่อมเศษค้างจากการอัปเกรดที่ทราบ เช่น พาธ Plugin bundled ที่หายไป หรือรายการ `channels.<id>` ที่ค้างอยู่สำหรับ Plugin เดียวกันนั้น หากคอนฟิกเสียด้วยเหตุผลที่ไม่เกี่ยวข้อง การติดตั้งยังคงล้มเหลวแบบปิดและแจ้งผู้ปฏิบัติงานให้เรียกใช้ `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนการโหลดเต็มรูปแบบ

Plugin ช่องทางสามารถเลือกใช้การเลื่อนการโหลดด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างเฟสเริ่มต้นก่อน listen แม้สำหรับช่องทางที่กำหนดค่าไว้แล้ว รายการเต็มจะโหลดหลังจาก Gateway เริ่ม listen

<Warning>
เปิดใช้การเลื่อนการโหลดเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกอย่างที่ Gateway ต้องการก่อนเริ่ม listen (การลงทะเบียนช่องทาง, HTTP routes, gateway methods) หากรายการเต็มเป็นเจ้าของความสามารถที่จำเป็นตอนเริ่มต้น ให้ใช้พฤติกรรมค่าเริ่มต้นต่อไป
</Warning>

หากรายการ setup/full ของคุณลงทะเบียน gateway RPC methods ให้เก็บไว้บนคำนำหน้าเฉพาะ Plugin namespace แอดมินหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของ core และ resolve เป็น `operator.admin` เสมอ

## manifest ของ Plugin

Plugin native ทุกตัวต้องมี `openclaw.plugin.json` ในรูทของแพ็กเกจ OpenClaw ใช้สิ่งนี้เพื่อตรวจสอบคอนฟิกโดยไม่ต้องรันโค้ด Plugin

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

แม้แต่ Plugin ที่ไม่มีคอนฟิกก็ต้องมีสคีมา สคีมาว่างถือว่า valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดู [manifest ของ Plugin](/th/plugins/manifest) สำหรับเอกสารอ้างอิงสคีมาฉบับเต็ม

## การเผยแพร่บน ClawHub

สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่ง ClawHub เฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
นามแฝงการเผยแพร่แบบเดิมที่ใช้เฉพาะ Skills มีไว้สำหรับ Skills แพ็กเกจ Plugin ควรใช้ `clawhub package publish` เสมอ
</Note>

## รายการตั้งค่า

ไฟล์ `setup-entry.ts` เป็นทางเลือกแบบเบาสำหรับ `index.ts` ที่ OpenClaw โหลดเมื่อจำเป็นต้องใช้เฉพาะพื้นผิวการตั้งค่าเท่านั้น (การเริ่มต้นใช้งาน การซ่อมแซม config การตรวจสอบช่องทางที่ปิดใช้งาน)

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ด runtime ที่หนัก (ไลบรารี crypto, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่างโฟลว์การตั้งค่า

ช่องทางใน workspace ที่รวมมาด้วยและเก็บ export ที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูลข้างเคียง สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ สัญญาที่รวมมานั้นยังรองรับ export `runtime` แบบไม่บังคับ เพื่อให้การเดินสาย runtime ตอนตั้งค่ายังคงเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทนรายการเต็ม">
    - ช่องทางถูกปิดใช้งานแต่ต้องมีพื้นผิวการตั้งค่า/การเริ่มต้นใช้งาน
    - ช่องทางเปิดใช้งานอยู่แต่ยังไม่ได้กำหนดค่า
    - การโหลดแบบเลื่อนเวลาเปิดใช้งานอยู่ (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - อ็อบเจกต์ Plugin ช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - เส้นทาง HTTP ใด ๆ ที่จำเป็นก่อน Gateway เริ่มฟัง
    - เมธอด Gateway ใด ๆ ที่จำเป็นระหว่างการเริ่มต้น

    เมธอด Gateway ตอนเริ่มต้นเหล่านั้นยังควรหลีกเลี่ยง namespace ผู้ดูแลระบบหลักที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรรวมไว้">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - การ import runtime ที่หนัก (crypto, SDK)
    - เมธอด Gateway ที่จำเป็นหลังเริ่มต้นเท่านั้น

  </Accordion>
</AccordionGroup>

### การ import ตัวช่วยตั้งค่าแบบแคบ

สำหรับ path ที่ร้อนและใช้เฉพาะการตั้งค่า ให้เลือกใช้ seam ตัวช่วยตั้งค่าแบบแคบแทน umbrella `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของพื้นผิวการตั้งค่า:

| path สำหรับ import                  | ใช้สำหรับ                                                                                 | export หลัก                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วย runtime ตอนตั้งค่าที่ยังคงพร้อมใช้งานใน `setupEntry` / การเริ่มต้นช่องทางแบบเลื่อนเวลา | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter การตั้งค่าบัญชีที่รับรู้ environment                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | ตัวช่วยการตั้งค่า/ติดตั้ง CLI/archive/docs                                                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

ใช้ seam `plugin-sdk/setup` ที่กว้างกว่าเมื่อคุณต้องการกล่องเครื่องมือตั้งค่าที่ใช้ร่วมกันครบชุด รวมถึงตัวช่วย config-patch เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

adapter patch สำหรับการตั้งค่ายังคงปลอดภัยต่อ hot path เมื่อ import การค้นหาพื้นผิวสัญญาการโปรโมตบัญชีเดียวที่รวมมาของ adapter เหล่านี้เป็นแบบ lazy ดังนั้นการ import `plugin-sdk/setup-runtime` จะไม่โหลดการค้นพบพื้นผิวสัญญาที่รวมมาอย่างกระตือรือร้นก่อนที่จะใช้ adapter จริง

### การโปรโมตบัญชีเดียวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจาก config ระดับบนสุดแบบบัญชีเดียวไปเป็น `channels.<id>.accounts.*` พฤติกรรมที่ใช้ร่วมกันตามค่าเริ่มต้นคือย้ายค่าที่อยู่ใน scope ของบัญชีที่ถูกโปรโมตไปยัง `accounts.default`

ช่องทางที่รวมมาสามารถจำกัดหรือแทนที่การโปรโมตนั้นผ่านพื้นผิวสัญญาการตั้งค่าของตัวเอง:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรถูกย้ายเข้าไปในบัญชีที่ถูกโปรโมต
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่อไว้อยู่แล้ว จะย้ายเฉพาะคีย์เหล่านี้เข้าไปในบัญชีที่ถูกโปรโมต คีย์ policy/delivery ที่ใช้ร่วมกันจะอยู่ที่ root ของช่องทางต่อไป
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะรับค่าที่ถูกโปรโมต

<Note>
Matrix เป็นตัวอย่างที่รวมมาในปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่อไว้เพียงบัญชีเดียวอยู่แล้ว หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่ซึ่งไม่ใช่ canonical เช่น `Ops` การโปรโมตจะคงบัญชีนั้นไว้แทนที่จะสร้างรายการ `accounts.default` ใหม่
</Note>

## schema ของ config

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

### การสร้าง schema ของ config ช่องทาง

ใช้ `buildChannelConfigSchema` เพื่อแปลง schema ของ Zod เป็น wrapper `ChannelConfigSchema` ที่ artifact config ซึ่ง Plugin เป็นเจ้าของใช้:

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

หากคุณเขียนสัญญาเป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ตัวช่วยโดยตรงเพื่อให้ OpenClaw ข้ามการแปลง Zod เป็น JSON Schema บน path metadata ได้:

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

สำหรับ Plugin ภายนอก สัญญา cold-path ยังคงเป็น manifest ของ Plugin: ทำสำเนา JSON Schema ที่สร้างแล้วไปยัง `openclaw.plugin.json#channelConfigs` เพื่อให้ schema ของ config, การตั้งค่า และพื้นผิว UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ด runtime

## วิซาร์ดการตั้งค่า

Plugin ช่องทางสามารถให้วิซาร์ดการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ วิซาร์ดเป็นอ็อบเจกต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

ชนิด `ChannelSetupWizard` รองรับ `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ ดูตัวอย่างเต็มในแพ็กเกจ Plugin ที่รวมมาด้วย (เช่น Plugin Discord `src/channel.setup.ts`)

<AccordionGroup>
  <Accordion title="พรอมป์ allowFrom ที่ใช้ร่วมกัน">
    สำหรับพรอมป์ allowlist ของ DM ที่ต้องการเฉพาะโฟลว์มาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ตัวช่วยการตั้งค่าที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับบล็อกสถานะการตั้งค่าช่องทางที่ต่างกันเฉพาะ label, score และบรรทัดเพิ่มเติมแบบไม่บังคับ ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการสร้างอ็อบเจกต์ `status` แบบเดียวกันเองในแต่ละ Plugin
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

    adapter/wizard แบบไม่บังคับที่สร้างขึ้นจะ fail closed เมื่อมีการเขียน config จริง ใช้ข้อความว่าต้องติดตั้งชุดเดียวกันซ้ำใน `validateInput`, `applyAccountConfig` และ `finalize` และต่อท้ายลิงก์ docs เมื่อกำหนด `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วยการตั้งค่าที่รองรับด้วย binary">
    สำหรับ UI การตั้งค่าที่รองรับด้วย binary ให้เลือกใช้ตัวช่วย delegated ที่ใช้ร่วมกันแทนการคัดลอก glue ของ binary/status แบบเดียวกันไปยังทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่ต่างกันเฉพาะ label, hint, score และการตรวจจับ binary
    - `createCliPathTextInput(...)` สำหรับ text input ที่รองรับด้วย path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้อง forward ไปยังวิซาร์ดเต็มที่หนักกว่าแบบ lazy
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้อง delegate เฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/tools/clawhub) แล้วติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    package spec แบบเปล่าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านตอนเปิดตัว

  </Tab>
  <Tab title="เฉพาะ ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไป ClawHub หรือเมื่อคุณต้องการ
    path การติดตั้ง npm โดยตรงระหว่างการย้ายข้อมูล:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ในรีโป:** วางไว้ใต้แผนผังเวิร์กสเปซ Plugin ที่รวมมา และระบบจะค้นพบโดยอัตโนมัติระหว่างการ build

**ผู้ใช้สามารถติดตั้งได้:**

```bash
openclaw plugins install <package-name>
```

<Info>
สำหรับการติดตั้งจาก npm, `openclaw plugins install` จะติดตั้ง package ไว้ใต้ `~/.openclaw/npm` โดยปิดใช้งานสคริปต์วงจรชีวิตไว้ ให้แผนผัง dependency ของ Plugin เป็น JS/TS ล้วน และหลีกเลี่ยง package ที่ต้องใช้การ build ผ่าน `postinstall`
</Info>

<Note>
การเริ่มทำงานของ Gateway จะไม่ติดตั้ง dependency ของ Plugin โฟลว์การติดตั้ง npm/git/ClawHub เป็นเจ้าของการทำให้ dependency สอดคล้องกัน ส่วน Plugin ในเครื่องต้องติดตั้ง dependency ของตัวเองไว้เรียบร้อยแล้ว
</Note>

metadata ของ package ที่รวมมาเป็นแบบระบุชัดเจน ไม่ได้อนุมานจาก JavaScript ที่ build แล้วตอนเริ่มทำงานของ Gateway dependency ขณะรันไทม์ควรอยู่ใน package ของ Plugin ที่เป็นเจ้าของ dependency นั้น การเริ่มทำงานของ OpenClaw แบบ packaged จะไม่ซ่อมแซมหรือจำลอง dependency ของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
- [manifest ของ Plugin](/th/plugins/manifest) — เอกสารอ้างอิง schema ของ manifest ฉบับเต็ม
- [จุดเข้าของ SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
