---
read_when:
    - คุณกำลังเพิ่มตัวช่วยสร้างการตั้งค่าให้กับ Plugin
    - คุณต้องทำความเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่า Plugin หรือเมทาดาทา openclaw ใน package.json
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และเมทาดาทาใน package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-07-20T06:04:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการจัดแพ็กเกจ Plugin (ข้อมูลเมตา `package.json`), ไฟล์ manifest (`openclaw.plugin.json`), รายการตั้งค่า และสคีมาการกำหนดค่า

<Tip>
**กำลังมองหาคู่มือแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือวิธีใช้อธิบายการจัดแพ็กเกจในบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## ข้อมูลเมตาของแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่ระบุให้ระบบ Plugin ทราบว่า Plugin ของคุณมีสิ่งใดให้ใช้งาน:

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
          "label": "ช่องทางของฉัน",
          "blurb": "คำอธิบายสั้นๆ ของช่องทาง"
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin ผู้ให้บริการ / ค่าพื้นฐานของ ClawHub">
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
การเผยแพร่ภายนอกบน ClawHub ต้องมี `compat` และ `build` ตัวอย่างโค้ดมาตรฐานสำหรับการเผยแพร่อยู่ใน `docs/snippets/plugin-publish/`
</Note>

### ฟิลด์ `openclaw`

<ParamField path="extensions" type="string[]">
  ไฟล์จุดเริ่มต้น (สัมพันธ์กับรากของแพ็กเกจ) เป็นรายการซอร์สที่ถูกต้องสำหรับการพัฒนาใน workspace และ git checkout
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  ไฟล์ JavaScript ที่บิลด์แล้วซึ่งเป็นคู่ของ `extensions` โดยเลือกใช้ก่อนเมื่อ OpenClaw โหลดแพ็กเกจ npm ที่ติดตั้งแล้ว ดูลำดับการแก้ไขซอร์ส/ไฟล์ที่บิลด์แล้วได้ที่ [จุดเริ่มต้นของ SDK](/th/plugins/sdk-entrypoints)
</ParamField>
<ParamField path="setupEntry" type="string">
  จุดเริ่มต้นแบบเบาสำหรับการตั้งค่าเท่านั้น (ไม่บังคับ)
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  ไฟล์ JavaScript ที่บิลด์แล้วซึ่งเป็นคู่ของ `setupEntry` และต้องตั้งค่า `setupEntry` ด้วย
</ParamField>
<ParamField path="plugin" type="object">
  ข้อมูลประจำตัว Plugin สำรอง `{ id, label }` ซึ่งใช้เมื่อ Plugin ไม่มีข้อมูลเมตาของช่องทาง/ผู้ให้บริการที่นำมาใช้กำหนด id หรือป้ายกำกับได้
</ParamField>
<ParamField path="channel" type="object">
  ข้อมูลเมตาของแค็ตตาล็อกช่องทางสำหรับหน้าการตั้งค่า ตัวเลือก เริ่มต้นอย่างรวดเร็ว และสถานะ
</ParamField>
<ParamField path="install" type="object">
  คำแนะนำในการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กลักษณะการทำงานเมื่อเริ่มต้น
</ParamField>
<ParamField path="compat" type="object">
  ช่วงเวอร์ชัน `pluginApi` ที่ Plugin นี้รองรับ จำเป็นสำหรับการเผยแพร่ภายนอกบน ClawHub
</ParamField>

<Note>
id ของผู้ให้บริการ (`providers: string[]`) เป็นข้อมูลเมตาของ manifest ไม่ใช่ข้อมูลเมตาของแพ็กเกจ ให้ประกาศไว้ใน `openclaw.plugin.json` ไม่ใช่ที่นี่ — ดู [manifest ของ Plugin](/th/plugins/manifest)
</Note>

### `openclaw.channel`

`openclaw.channel` เป็นข้อมูลเมตาของแพ็กเกจที่มีต้นทุนต่ำสำหรับการค้นหาช่องทางและหน้าการตั้งค่าก่อนโหลดรันไทม์

| ฟิลด์                                  | ชนิด       | ความหมาย                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | id มาตรฐานของช่องทาง                                                         |
| `label`                                | `string`   | ป้ายกำกับหลักของช่องทาง                                                        |
| `selectionLabel`                       | `string`   | ป้ายกำกับในตัวเลือก/การตั้งค่า เมื่อควรแตกต่างจาก `label`                        |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและหน้าสถานะที่มีข้อมูลมากขึ้น       |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                                      |
| `docsLabel`                            | `string`   | ป้ายกำกับแทนที่สำหรับลิงก์เอกสาร เมื่อควรแตกต่างจาก id ของช่องทาง |
| `blurb`                                | `string`   | คำอธิบายสั้นๆ สำหรับการเริ่มต้นใช้งาน/แค็ตตาล็อก                                         |
| `order`                                | `number`   | ลำดับการจัดเรียงในแค็ตตาล็อกช่องทาง                                               |
| `aliases`                              | `string[]` | นามแฝงเพิ่มเติมสำหรับการค้นหาเมื่อเลือกช่องทาง                                   |
| `preferOver`                           | `string[]` | id ของ Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าซึ่งช่องทางนี้ควรอยู่เหนือกว่า                |
| `systemImage`                          | `string`   | ชื่อไอคอน/อิมเมจระบบที่ไม่บังคับสำหรับแค็ตตาล็อก UI ของช่องทาง                      |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในหน้าการเลือก                          |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายกำกับในข้อความการเลือก |
| `selectionExtras`                      | `string[]` | ข้อความสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                               |
| `markdownCapable`                      | `boolean`  | ระบุว่าช่องทางรองรับ markdown เพื่อใช้ตัดสินใจเกี่ยวกับการจัดรูปแบบขาออก      |
| `exposure`                             | `object`   | การควบคุมการมองเห็นช่องทางสำหรับหน้าการตั้งค่า รายการที่กำหนดค่าแล้ว และเอกสาร   |
| `quickstartAllowFrom`                  | `boolean`  | เลือกให้ช่องทางนี้เข้าร่วมขั้นตอนการตั้งค่าเริ่มต้นอย่างรวดเร็ว `allowFrom` แบบมาตรฐาน         |
| `forceAccountBinding`                  | `boolean`  | บังคับให้ผูกบัญชีอย่างชัดเจน แม้จะมีเพียงบัญชีเดียว           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | เลือกใช้การค้นหาเซสชันก่อนเมื่อแก้ไขเป้าหมายการประกาศสำหรับช่องทางนี้       |

ตัวอย่าง:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "ช่องทางของฉัน",
      "selectionLabel": "ช่องทางของฉัน (โฮสต์เอง)",
      "detailLabel": "บอตช่องทางของฉัน",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "การเชื่อมต่อแชตแบบโฮสต์เองที่ใช้ Webhook",
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

- `configured`: รวมช่องทางไว้ในหน้ารายการแบบการกำหนดค่า/สถานะ
- `setup`: รวมช่องทางไว้ในตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบ
- `docs`: ระบุว่าช่องทางเปิดเผยต่อสาธารณะในหน้าเอกสาร/การนำทาง

### `openclaw.install`

`openclaw.install` เป็นข้อมูลเมตาของแพ็กเกจ ไม่ใช่ข้อมูลเมตาของ manifest

| ฟิลด์                        | ชนิด                                | ความหมาย                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | ข้อกำหนดมาตรฐานของ ClawHub สำหรับการติดตั้ง/อัปเดตและขั้นตอนการเริ่มต้นใช้งานที่ติดตั้งเมื่อต้องการ |
| `npmSpec`                    | `string`                            | ข้อกำหนด npm มาตรฐานสำหรับขั้นตอนสำรองในการติดตั้ง/อัปเดต                             |
| `localPath`                  | `string`                            | พาธสำหรับการพัฒนาในเครื่องหรือการติดตั้งแบบรวมมาในชุด                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่เลือกใช้ก่อนเมื่อมีหลายแหล่ง                     |
| `minHostVersion`             | `string`                            | เวอร์ชันต่ำสุดของ OpenClaw ที่รองรับ ได้แก่ `>=x.y.z` หรือ `>=x.y.z-prerelease`            |
| `expectedIntegrity`          | `string`                            | สตริงความถูกต้องของ npm dist ที่คาดไว้ โดยทั่วไปคือ `sha512-...` สำหรับการติดตั้งที่ตรึงเวอร์ชัน    |
| `allowInvalidConfigRecovery` | `boolean`                           | ช่วยให้ขั้นตอนติดตั้ง Plugin ที่รวมมาในชุดซ้ำสามารถกู้คืนจากข้อผิดพลาดเฉพาะของการกำหนดค่าที่ค้างอยู่  |
| `requiredPlatformPackages`   | `string[]`                          | นามแฝง npm เฉพาะแพลตฟอร์มที่จำเป็น ซึ่งได้รับการตรวจสอบระหว่างการติดตั้ง npm               |

<AccordionGroup>
  <Accordion title="ลักษณะการเริ่มต้นใช้งาน">
    การเริ่มต้นใช้งานแบบโต้ตอบใช้ `openclaw.install` สำหรับหน้าการติดตั้งเมื่อต้องการ: หาก Plugin ของคุณแสดงตัวเลือกการยืนยันตัวตนของผู้ให้บริการหรือข้อมูลเมตาการตั้งค่า/แค็ตตาล็อกช่องทางก่อนโหลดรันไทม์ ขั้นตอนเริ่มต้นใช้งานสามารถแจ้งให้เลือกติดตั้งจาก ClawHub, npm หรือภายในเครื่อง ติดตั้งหรือเปิดใช้ Plugin แล้วดำเนินขั้นตอนที่เลือกต่อ ตัวเลือก ClawHub ใช้ `clawhubSpec` และจะถูกเลือกก่อนเมื่อมีอยู่ ส่วนตัวเลือก npm ต้องใช้ข้อมูลเมตาแค็ตตาล็อกที่เชื่อถือได้พร้อม `npmSpec` ของรีจิสทรี (เวอร์ชันแบบเจาะจงและ `expectedIntegrity` เป็นค่าตรึงที่ไม่บังคับ และจะถูกบังคับใช้ในการติดตั้ง/อัปเดตเมื่อตั้งค่าไว้) เก็บ "สิ่งที่จะแสดง" ไว้ใน `openclaw.plugin.json` และ "วิธีติดตั้ง" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="การบังคับใช้ minHostVersion">
    หากตั้งค่า `minHostVersion` ทั้งการติดตั้งและการโหลดรีจิสทรี manifest ที่ไม่ได้รวมมาในชุดจะบังคับใช้ค่านี้ โฮสต์รุ่นเก่าจะข้าม Plugin ภายนอก และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ ส่วนซอร์ส Plugin ที่รวมมาในชุดจะถือว่าใช้เวอร์ชันเดียวกับ checkout ของโฮสต์
  </Accordion>
  <Accordion title="การติดตั้ง npm ที่ตรึงเวอร์ชัน">
    สำหรับการติดตั้ง npm ที่ตรึงเวอร์ชัน ให้เก็บเวอร์ชันแบบเจาะจงไว้ใน `npmSpec` และเพิ่มค่าความถูกต้องของอาร์ติแฟกต์ที่คาดไว้:

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
    `allowInvalidConfigRecovery` ไม่ใช่การข้ามข้อจำกัดทั่วไปสำหรับการกำหนดค่าที่เสียหาย แต่ใช้เฉพาะการกู้คืน Plugin ที่รวมมาในชุดอย่างจำกัดเท่านั้น โดยช่วยให้การติดตั้งซ้ำ/การตั้งค่าซ่อมแซมสิ่งตกค้างจากการอัปเกรดที่ทราบ เช่น พาธของ Plugin ที่รวมมาในชุดหายไป หรือรายการ `channels.<id>` ที่ค้างอยู่สำหรับ Plugin เดียวกัน หากการกำหนดค่าเสียหายด้วยเหตุผลอื่น การติดตั้งจะยังคงล้มเหลวแบบปิดและแจ้งให้ผู้ดูแลระบบเรียกใช้ `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนโหลดแบบเต็ม

Plugin ช่องทางสามารถเลือกใช้การโหลดแบบเลื่อนเวลาได้ด้วย:

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

เมื่อเปิดใช้ OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วงเริ่มต้นก่อนเริ่มรับฟัง แม้เป็นช่องทางที่กำหนดค่าไว้แล้วก็ตาม จุดเริ่มต้นแบบเต็มจะโหลดหลังจาก Gateway เริ่มรับฟัง

<Warning>
เปิดใช้การโหลดแบบเลื่อนเวลาเฉพาะเมื่อ `setupEntry` ของคุณลงทะเบียนทุกสิ่งที่ Gateway ต้องใช้ก่อนเริ่มรับฟัง (การลงทะเบียนช่องทาง, เส้นทาง HTTP, เมธอดของ Gateway) หาก entry แบบเต็มเป็นเจ้าของความสามารถที่จำเป็นระหว่างการเริ่มต้น ให้คงพฤติกรรมเริ่มต้นไว้
</Warning>

หาก entry สำหรับการตั้งค่า/แบบเต็มของคุณลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้คำนำหน้าเฉพาะ Plugin สงวนเนมสเปซผู้ดูแลระบบหลัก (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ไว้ให้แกนหลักเป็นเจ้าของ และทำให้เป็นมาตรฐานเป็น `operator.admin` เสมอ

## Manifest ของ Plugin

Plugin แบบเนทีฟทุกตัวต้องจัดส่ง `openclaw.plugin.json` ที่รากของแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบความถูกต้องของการกำหนดค่าโดยไม่เรียกใช้โค้ดของ Plugin

```json
{
  "id": "my-plugin",
  "name": "Plugin ของฉัน",
  "description": "เพิ่มความสามารถของ Plugin ของฉันให้กับ OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "ข้อมูลลับสำหรับตรวจสอบ Webhook"
      }
    }
  }
}
```

สำหรับ Plugin ช่องทาง ให้เพิ่ม `channels` (และ Plugin ผู้ให้บริการให้เพิ่ม `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

แม้แต่ Plugin ที่ไม่มีการกำหนดค่าก็ต้องจัดส่งสคีมา สคีมาว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดูข้อมูลอ้างอิงสคีมาฉบับเต็มได้ที่ [Manifest ของ Plugin](/th/plugins/manifest)

## การเผยแพร่บน ClawHub

แพ็กเกจ Skills และ Plugin ใช้คำสั่งเผยแพร่ของ ClawHub แยกกัน สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่งเฉพาะแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` เป็นคำสั่งอีกคำสั่งหนึ่งสำหรับเผยแพร่โฟลเดอร์ Skills ไม่ใช่แพ็กเกจ Plugin ดู [การเผยแพร่บน ClawHub](/th/clawhub/publishing)
</Note>

## Entry สำหรับการตั้งค่า

`setup-entry.ts` เป็นทางเลือกแบบน้ำหนักเบาแทน `index.ts` ซึ่ง OpenClaw จะโหลดเมื่อต้องใช้เฉพาะพื้นผิวการตั้งค่า (การเริ่มต้นใช้งาน, การซ่อมแซมการกำหนดค่า, การตรวจสอบช่องทางที่ปิดใช้งาน):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้หลีกเลี่ยงการโหลดโค้ดรันไทม์ขนาดใหญ่ (ไลบรารีการเข้ารหัส, การลงทะเบียน CLI, บริการเบื้องหลัง) ระหว่างขั้นตอนการตั้งค่า

ช่องทางในเวิร์กสเปซที่รวมมาให้ซึ่งเก็บ export ที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ สัญญาสำหรับรายการที่รวมมาให้นั้นยังรองรับ export `runtime` ซึ่งเป็นทางเลือก เพื่อให้การเชื่อมต่อรันไทม์ระหว่างการตั้งค่ายังคงมีน้ำหนักเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทน entry แบบเต็ม">
    - ช่องทางถูกปิดใช้งาน แต่ต้องใช้พื้นผิวสำหรับการตั้งค่า/การเริ่มต้นใช้งาน
    - ช่องทางถูกเปิดใช้งาน แต่ยังไม่ได้กำหนดค่า
    - เปิดใช้การโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - ออบเจ็กต์ Plugin ช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - เส้นทาง HTTP ที่จำเป็นก่อน Gateway เริ่มรับฟัง
    - เมธอดของ Gateway ที่จำเป็นระหว่างการเริ่มต้น

    เมธอดของ Gateway สำหรับการเริ่มต้นเหล่านั้นยังคงควรหลีกเลี่ยงเนมสเปซผู้ดูแลระบบหลักที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรมี">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - การนำเข้ารันไทม์ขนาดใหญ่ (การเข้ารหัส, SDK)
    - เมธอดของ Gateway ที่จำเป็นหลังจากการเริ่มต้นเท่านั้น

  </Accordion>
</AccordionGroup>

### การนำเข้าตัวช่วยการตั้งค่าแบบเฉพาะเจาะจง

สำหรับเส้นทางด่วนที่ใช้เฉพาะการตั้งค่า ให้เลือกใช้จุดเชื่อมต่อตัวช่วยการตั้งค่าแบบเฉพาะเจาะจงแทน `plugin-sdk/setup` ที่ครอบคลุมกว่า เมื่อคุณต้องใช้พื้นผิวการตั้งค่าเพียงบางส่วน:

| เส้นทางการนำเข้า                | ใช้สำหรับ                                                                                | Export หลัก                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ระหว่างการตั้งค่าที่ยังคงพร้อมใช้ใน `setupEntry` / การเริ่มต้นช่องทางแบบเลื่อนเวลา | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | ตัวช่วย CLI/ไฟล์เก็บถาวร/เอกสารสำหรับการตั้งค่าและติดตั้ง                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

ใช้จุดเชื่อมต่อ `plugin-sdk/setup` ที่ครอบคลุมกว่าเมื่อต้องการชุดเครื่องมือการตั้งค่าที่ใช้ร่วมกันทั้งหมด รวมถึงตัวช่วยแก้ไขการกำหนดค่า เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

ใช้ `createSetupTranslator(...)` สำหรับข้อความคงที่ของวิซาร์ดการตั้งค่า โดยจะใช้ค่าที่ไม่ว่างค่าแรกจาก `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES` และ `LANG` ตามลำดับ แล้วจึงใช้ภาษาอังกฤษเป็นค่าเริ่มต้น ตั้งค่า `OPENCLAW_LOCALE=en` เพื่อแทนที่ด้วยภาษาอังกฤษอย่างชัดเจน เก็บข้อความการตั้งค่าเฉพาะ Plugin ไว้ในโค้ดที่ Plugin เป็นเจ้าของ และใช้คีย์แค็ตตาล็อกที่ใช้ร่วมกันเฉพาะสำหรับป้ายกำกับการตั้งค่าทั่วไป, ข้อความสถานะ และข้อความการตั้งค่าของ Plugin ทางการที่รวมมาให้

อะแดปเตอร์แพตช์การตั้งค่ายังคงปลอดภัยสำหรับเส้นทางด่วนเมื่อนำเข้า การค้นหาพื้นผิวสัญญาสำหรับการเลื่อนระดับบัญชีเดียวที่รวมมาให้จะทำงานแบบ lazy ดังนั้นการนำเข้า `plugin-sdk/setup-runtime` จะไม่โหลดการค้นหาพื้นผิวสัญญาที่รวมมาให้ล่วงหน้าก่อนใช้งานอะแดปเตอร์จริง

### การเลื่อนระดับบัญชีเดียวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจากการกำหนดค่าระดับบนสุดแบบบัญชีเดียวไปเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมเริ่มต้นจะย้ายค่าที่อยู่ในขอบเขตบัญชีซึ่งได้รับการเลื่อนระดับไปยัง `accounts.default`

ช่องทางที่รวมมาให้สามารถจำกัดหรือแทนที่การเลื่อนระดับนั้นผ่านพื้นผิวสัญญาการตั้งค่าของตน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรย้ายไปยังบัญชีที่ได้รับการเลื่อนระดับ
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่อไว้อยู่แล้ว ให้ย้ายเฉพาะคีย์เหล่านี้ไปยังบัญชีที่ได้รับการเลื่อนระดับ ส่วนคีย์นโยบาย/การนำส่งที่ใช้ร่วมกันยังคงอยู่ที่รากของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะรับค่าที่ได้รับการเลื่อนระดับ

<Note>
Matrix เป็นตัวอย่างที่รวมมาให้ในปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่อไว้เพียงบัญชีเดียวอยู่แล้ว หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่ไม่ใช่รูปแบบมาตรฐานซึ่งมีอยู่ เช่น `Ops` การเลื่อนระดับจะรักษาบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่
</Note>

## สคีมาการกำหนดค่า

การกำหนดค่าของ Plugin จะได้รับการตรวจสอบกับ JSON Schema ใน Manifest ผู้ใช้กำหนดค่า Plugin ผ่าน:

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

Plugin ของคุณจะได้รับการกำหนดค่านี้เป็น `api.pluginConfig` ระหว่างการลงทะเบียน

สำหรับการกำหนดค่าเฉพาะช่องทาง ให้ใช้ส่วนการกำหนดค่าช่องทางแทน:

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

### การสร้างสคีมาการกำหนดค่าช่องทาง

ใช้ `buildChannelConfigSchema` เพื่อแปลงสคีมา Zod เป็น wrapper `ChannelConfigSchema` ที่อาร์ติแฟกต์การกำหนดค่าซึ่ง Plugin เป็นเจ้าของใช้:

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

หากคุณเขียนสัญญาเป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ตัวช่วยโดยตรงเพื่อให้ OpenClaw ข้ามการแปลงจาก Zod เป็น JSON Schema บนเส้นทางเมทาดาทาได้:

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

สำหรับ Plugin ของบุคคลที่สาม สัญญาของเส้นทางเย็นยังคงเป็น Manifest ของ Plugin: ทำสำเนา JSON Schema ที่สร้างขึ้นไว้ใน `openclaw.plugin.json#channelConfigs` เพื่อให้พื้นผิวสคีมาการกำหนดค่า, การตั้งค่า และ UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่โหลดโค้ดรันไทม์

## วิซาร์ดการตั้งค่า

Plugin ช่องทางสามารถมีวิซาร์ดการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ วิซาร์ดเป็นออบเจ็กต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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
      credentialLabel: "โทเค็นของบอต",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "ใช้ MY_CHANNEL_BOT_TOKEN จากสภาพแวดล้อมหรือไม่",
      keepPrompt: "เก็บโทเค็นปัจจุบันไว้หรือไม่",
      inputPrompt: "ป้อนโทเค็นของบอต:",
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

`ChannelSetupWizard` ยังรองรับ `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ ดูตัวอย่างที่รวมมาให้ฉบับเต็มได้จาก `src/setup-core.ts` ของ Plugin Discord

<AccordionGroup>
  <Accordion title="พรอมต์ allowFrom ที่ใช้ร่วมกัน">
    สำหรับพรอมต์รายการอนุญาต DM ที่ต้องใช้เฉพาะขั้นตอนมาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ตัวช่วยการตั้งค่าที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับบล็อกสถานะการตั้งค่าช่องทางที่แตกต่างกันเฉพาะป้ายกำกับ, คะแนน และบรรทัดเพิ่มเติมที่เป็นทางเลือก ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการสร้างออบเจ็กต์ `status` แบบเดียวกันด้วยตนเองในแต่ละ Plugin
  </Accordion>
  <Accordion title="พื้นผิวการตั้งค่าช่องทางที่เป็นทางเลือก">
    สำหรับพื้นผิวการตั้งค่าที่เป็นทางเลือกซึ่งควรปรากฏเฉพาะในบางบริบท ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "ช่องทางของฉัน",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // คืนค่า { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` ยังเปิดเผยตัวสร้างระดับล่าง `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องใช้พื้นผิวการติดตั้งที่เป็นทางเลือกนั้นเพียงครึ่งเดียว

    อะแดปเตอร์/วิซาร์ดเสริมที่สร้างขึ้นจะปฏิเสธการดำเนินการโดยค่าเริ่มต้นเมื่อเขียนการกำหนดค่าจริง โดยใช้ข้อความแจ้งว่าต้องติดตั้งข้อความเดียวกันสำหรับ `validateInput`, `applyAccountConfig` และ `finalize` และเพิ่มลิงก์เอกสารเมื่อมีการตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วยตั้งค่าที่อาศัยไบนารี">
    สำหรับ UI การตั้งค่าที่อาศัยไบนารี ให้เลือกใช้ตัวช่วยแบบมอบหมายร่วมกันแทนการคัดลอกโค้ดเชื่อมต่อไบนารี/สถานะแบบเดียวกันไปยังทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่แตกต่างกันเฉพาะป้ายกำกับ คำแนะนำ คะแนน และการตรวจหาไบนารี
    - `createCliPathTextInput(...)` สำหรับช่องป้อนข้อความที่อ้างอิงพาธ
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยังวิซาร์ดแบบเต็มที่มีภาระมากกว่าโดยโหลดเมื่อจำเป็น
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` เพียงต้องมอบหมายการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/clawhub) แล้วติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านตอนเปิดใช้งาน เว้นแต่ชื่อจะตรงกับรหัส Plugin ที่รวมมาด้วยหรือเป็นทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้สำเนาในเครื่อง/สำเนาทางการนั้นแทน ใช้ `clawhub:`, `npm:`, `git:` หรือ `npm-pack:` เพื่อเลือกแหล่งที่มาอย่างกำหนดแน่นอน — ดู [จัดการ Plugin](/th/plugins/manage-plugins)

  </Tab>
  <Tab title="ClawHub เท่านั้น">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="ข้อกำหนดแพ็กเกจ npm">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไปยัง ClawHub หรือเมื่อจำเป็นต้องใช้
    พาธการติดตั้งโดยตรงจาก npm ระหว่างการย้ายระบบ:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ภายในรีโพ:** วางไว้ใต้โครงสร้างเวิร์กสเปซ Plugin ที่รวมมาด้วย ระบบจะค้นพบโดยอัตโนมัติระหว่างการบิลด์

<Info>
สำหรับการติดตั้งที่มาจาก npm นั้น `openclaw plugins install` จะติดตั้งแพ็กเกจลงในโปรเจกต์แยกต่อ Plugin ภายใต้ `~/.openclaw/npm/projects` โดยปิดใช้งานสคริปต์วงจรชีวิต (`--ignore-scripts`) รักษาโครงสร้างการขึ้นต่อกันของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องใช้การบิลด์ `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway จะไม่ติดตั้งการขึ้นต่อกันของ Plugin ขั้นตอนการติดตั้งผ่าน npm/git/ClawHub เป็นผู้รับผิดชอบการปรับการขึ้นต่อกันให้สอดคล้องกัน ส่วน Plugin ในเครื่องต้องติดตั้งการขึ้นต่อกันไว้แล้ว
</Note>

ข้อมูลเมตาของแพ็กเกจที่รวมมาด้วยจะระบุไว้อย่างชัดเจน ไม่ได้อนุมานจาก JavaScript ที่บิลด์แล้วเมื่อ Gateway เริ่มต้น การขึ้นต่อกันขณะรันไทม์ต้องอยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของ และการเริ่มต้น OpenClaw ที่จัดทำเป็นแพ็กเกจแล้วจะไม่ซ่อมแซมหรือทำสำเนาการขึ้นต่อกันของ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
- [ไฟล์กำกับ Plugin](/th/plugins/manifest) — เอกสารอ้างอิงสคีมาไฟล์กำกับฉบับเต็ม
- [จุดเริ่มต้นของ SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
