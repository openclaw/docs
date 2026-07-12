---
read_when:
    - คุณกำลังเพิ่มตัวช่วยสร้างการตั้งค่าให้กับ Plugin
    - คุณต้องเข้าใจความแตกต่างระหว่าง setup-entry.ts กับ index.ts
    - คุณกำลังกำหนดสคีมาการกำหนดค่าของ Plugin หรือเมทาดาทา openclaw ใน package.json
sidebarTitle: Setup and config
summary: วิซาร์ดการตั้งค่า, setup-entry.ts, สคีมาการกำหนดค่า และข้อมูลเมตาของ package.json
title: การตั้งค่าและการกำหนดค่า Plugin
x-i18n:
    generated_at: "2026-07-12T16:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับการจัดแพ็กเกจ Plugin (เมทาดาทา `package.json`), ไฟล์แมนิเฟสต์ (`openclaw.plugin.json`), จุดเริ่มต้นการตั้งค่า และสคีมาการกำหนดค่า

<Tip>
**กำลังมองหาคู่มือแบบทีละขั้นตอนอยู่หรือไม่?** คู่มือวิธีใช้งานครอบคลุมการจัดแพ็กเกจตามบริบท: [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-1-package-and-manifest) และ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-1-package-and-manifest)
</Tip>

## เมทาดาทาแพ็กเกจ

`package.json` ของคุณต้องมีฟิลด์ `openclaw` ที่บอกระบบ Plugin ว่า Plugin ของคุณมีความสามารถใดบ้าง:

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
  ไฟล์จุดเริ่มต้น (สัมพันธ์กับรากของแพ็กเกจ) รายการซอร์สที่ใช้ได้สำหรับการพัฒนาในเวิร์กสเปซและเช็กเอาต์ Git
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  ไฟล์ JavaScript ที่บิลด์แล้วซึ่งคู่กับ `extensions` และจะได้รับการเลือกใช้เมื่อ OpenClaw โหลดแพ็กเกจ npm ที่ติดตั้งไว้ ดูลำดับการแก้ไขตำแหน่งไฟล์ซอร์ส/ไฟล์ที่บิลด์แล้วได้ที่ [จุดเริ่มต้น SDK](/th/plugins/sdk-entrypoints)
</ParamField>
<ParamField path="setupEntry" type="string">
  จุดเริ่มต้นขนาดเล็กสำหรับการตั้งค่าเท่านั้น (ไม่บังคับ)
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  ไฟล์ JavaScript ที่บิลด์แล้วซึ่งคู่กับ `setupEntry` โดยต้องกำหนด `setupEntry` ไว้ด้วย
</ParamField>
<ParamField path="plugin" type="object">
  ข้อมูลระบุตัวตนสำรองของ Plugin ในรูปแบบ `{ id, label }` ซึ่งใช้เมื่อ Plugin ไม่มีเมทาดาทาช่องทาง/ผู้ให้บริการที่สามารถนำมาใช้กำหนด `id` หรือ `label`
</ParamField>
<ParamField path="channel" type="object">
  เมทาดาทาแค็ตตาล็อกช่องทางสำหรับพื้นผิวการตั้งค่า ตัวเลือก การเริ่มต้นอย่างรวดเร็ว และสถานะ
</ParamField>
<ParamField path="install" type="object">
  คำแนะนำการติดตั้ง: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`
</ParamField>
<ParamField path="startup" type="object">
  แฟล็กลักษณะการทำงานเมื่อเริ่มต้น
</ParamField>
<ParamField path="compat" type="object">
  ช่วงเวอร์ชัน `pluginApi` ที่ Plugin นี้รองรับ จำเป็นสำหรับการเผยแพร่ภายนอกบน ClawHub
</ParamField>

<Note>
รหัสผู้ให้บริการ (`providers: string[]`) เป็นเมทาดาทาของไฟล์แมนิเฟสต์ ไม่ใช่เมทาดาทาแพ็กเกจ ให้ประกาศใน `openclaw.plugin.json` ไม่ใช่ที่นี่ — ดู [ไฟล์แมนิเฟสต์ของ Plugin](/th/plugins/manifest)
</Note>

### `openclaw.channel`

`openclaw.channel` เป็นเมทาดาทาแพ็กเกจขนาดเล็กสำหรับการค้นพบช่องทางและพื้นผิวการตั้งค่าก่อนโหลดรันไทม์

| ฟิลด์                                 | ชนิด       | ความหมาย                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | รหัสช่องทางมาตรฐาน                                                            |
| `label`                                | `string`   | ป้ายกำกับหลักของช่องทาง                                                       |
| `selectionLabel`                       | `string`   | ป้ายกำกับในตัวเลือก/การตั้งค่า เมื่อต้องแตกต่างจาก `label`                    |
| `detailLabel`                          | `string`   | ป้ายกำกับรายละเอียดรองสำหรับแค็ตตาล็อกช่องทางและพื้นผิวสถานะที่มีรายละเอียดมากขึ้น |
| `docsPath`                             | `string`   | พาธเอกสารสำหรับลิงก์การตั้งค่าและการเลือก                                    |
| `docsLabel`                            | `string`   | ป้ายกำกับทดแทนที่ใช้กับลิงก์เอกสาร เมื่อต้องแตกต่างจากรหัสช่องทาง             |
| `blurb`                                | `string`   | คำอธิบายสั้นสำหรับการเริ่มต้นใช้งาน/แค็ตตาล็อก                                |
| `order`                                | `number`   | ลำดับการจัดเรียงในแค็ตตาล็อกช่องทาง                                           |
| `aliases`                              | `string[]` | นามแฝงเพิ่มเติมสำหรับค้นหาขณะเลือกช่องทาง                                     |
| `preferOver`                           | `string[]` | รหัส Plugin/ช่องทางที่มีลำดับความสำคัญต่ำกว่าและช่องทางนี้ควรมีอันดับเหนือกว่า |
| `systemImage`                          | `string`   | ชื่อไอคอน/อิมเมจระบบที่ไม่บังคับสำหรับแค็ตตาล็อก UI ของช่องทาง                |
| `selectionDocsPrefix`                  | `string`   | ข้อความนำหน้าลิงก์เอกสารในพื้นผิวการเลือก                                     |
| `selectionDocsOmitLabel`               | `boolean`  | แสดงพาธเอกสารโดยตรงแทนลิงก์เอกสารที่มีป้ายกำกับในข้อความการเลือก              |
| `selectionExtras`                      | `string[]` | สตริงสั้นเพิ่มเติมที่ต่อท้ายในข้อความการเลือก                                 |
| `markdownCapable`                      | `boolean`  | ระบุว่าช่องทางรองรับ Markdown สำหรับการตัดสินใจจัดรูปแบบข้อความขาออก          |
| `exposure`                             | `object`   | การควบคุมการมองเห็นช่องทางสำหรับการตั้งค่า รายการที่กำหนดค่าแล้ว และพื้นผิวเอกสาร |
| `quickstartAllowFrom`                  | `boolean`  | กำหนดให้ช่องทางนี้เข้าร่วมโฟลว์การตั้งค่า `allowFrom` มาตรฐานสำหรับการเริ่มต้นอย่างรวดเร็ว |
| `forceAccountBinding`                  | `boolean`  | กำหนดให้ต้องผูกบัญชีอย่างชัดเจน แม้มีเพียงบัญชีเดียว                          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | เลือกใช้การค้นหาเซสชันก่อนเมื่อแก้ไขปลายทางประกาศสำหรับช่องทางนี้             |

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

- `configured`: รวมช่องทางไว้ในพื้นผิวรายการที่กำหนดค่าแล้ว/ลักษณะสถานะ
- `setup`: รวมช่องทางไว้ในตัวเลือกการตั้งค่า/กำหนดค่าแบบโต้ตอบ
- `docs`: ระบุว่าช่องทางเผยแพร่ต่อสาธารณะในพื้นผิวเอกสาร/การนำทาง

<Note>
`showConfigured` และ `showInSetup` ยังคงรองรับในฐานะนามแฝงแบบเดิม โปรดเลือกใช้ `exposure`
</Note>

### `openclaw.install`

`openclaw.install` เป็นเมทาดาทาแพ็กเกจ ไม่ใช่เมทาดาทาของไฟล์แมนิเฟสต์

| ฟิลด์                         | ชนิด                                | ความหมาย                                                                        |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | ข้อกำหนด ClawHub มาตรฐานสำหรับการติดตั้ง/อัปเดตและโฟลว์การเริ่มต้นใช้งานที่ติดตั้งเมื่อต้องการ |
| `npmSpec`                    | `string`                            | ข้อกำหนด npm มาตรฐานสำหรับโฟลว์สำรองในการติดตั้ง/อัปเดต                          |
| `localPath`                  | `string`                            | พาธการพัฒนาในเครื่องหรือพาธการติดตั้งแบบรวมมาให้                                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | แหล่งติดตั้งที่ต้องการเมื่อมีหลายแหล่งให้เลือก                                  |
| `minHostVersion`             | `string`                            | เวอร์ชันขั้นต่ำของ OpenClaw ที่รองรับ โดยใช้ `>=x.y.z` หรือ `>=x.y.z-prerelease` |
| `expectedIntegrity`          | `string`                            | สตริงความสมบูรณ์ของ npm dist ที่คาดไว้ โดยทั่วไปเป็น `sha512-...` สำหรับการติดตั้งแบบตรึงเวอร์ชัน |
| `allowInvalidConfigRecovery` | `boolean`                           | อนุญาตให้โฟลว์ติดตั้ง Plugin แบบรวมมาให้ซ้ำ กู้คืนจากความล้มเหลวของการกำหนดค่าที่ล้าสมัยบางกรณี |
| `requiredPlatformPackages`   | `string[]`                          | นามแฝง npm เฉพาะแพลตฟอร์มที่จำเป็น ซึ่งตรวจสอบระหว่างการติดตั้ง npm             |

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานระหว่างการเริ่มต้นใช้งาน">
    การเริ่มต้นใช้งานแบบโต้ตอบใช้ `openclaw.install` สำหรับพื้นผิวการติดตั้งเมื่อต้องการ: หาก Plugin ของคุณเปิดเผยตัวเลือกการยืนยันตัวตนของผู้ให้บริการหรือเมทาดาทาการตั้งค่า/แค็ตตาล็อกช่องทางก่อนโหลดรันไทม์ ขั้นตอนเริ่มต้นใช้งานสามารถแจ้งให้เลือกการติดตั้งจาก ClawHub, npm หรือในเครื่อง ติดตั้งหรือเปิดใช้งาน Plugin แล้วดำเนินโฟลว์ที่เลือกต่อ ตัวเลือก ClawHub ใช้ `clawhubSpec` และจะได้รับการเลือกก่อนเมื่อมีค่าอยู่ ส่วนตัวเลือก npm ต้องใช้เมทาดาทาแค็ตตาล็อกที่เชื่อถือได้ซึ่งมี `npmSpec` จากรีจิสทรี (เวอร์ชันที่แน่นอนและ `expectedIntegrity` เป็นค่าตรึงที่ไม่บังคับ และจะถูกบังคับใช้ระหว่างการติดตั้ง/อัปเดตเมื่อกำหนดไว้) เก็บข้อมูล "สิ่งที่จะแสดง" ไว้ใน `openclaw.plugin.json` และ "วิธีติดตั้ง" ไว้ใน `package.json`
  </Accordion>
  <Accordion title="การบังคับใช้ minHostVersion">
    หากกำหนด `minHostVersion` ทั้งการติดตั้งและการโหลดรีจิสทรีไฟล์แมนิเฟสต์ที่ไม่ได้รวมมาให้จะบังคับใช้ค่านี้ โฮสต์เวอร์ชันเก่าจะข้าม Plugin ภายนอก และสตริงเวอร์ชันที่ไม่ถูกต้องจะถูกปฏิเสธ โดยถือว่า Plugin ซอร์สที่รวมมาให้ใช้เวอร์ชันเดียวกับเช็กเอาต์ของโฮสต์
  </Accordion>
  <Accordion title="การติดตั้ง npm แบบตรึงเวอร์ชัน">
    สำหรับการติดตั้ง npm แบบตรึงเวอร์ชัน ให้เก็บเวอร์ชันที่แน่นอนไว้ใน `npmSpec` และเพิ่มค่าความสมบูรณ์ของอาร์ติแฟกต์ที่คาดไว้:

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
    `allowInvalidConfigRecovery` ไม่ใช่วิธีข้ามการกำหนดค่าที่เสียหายโดยทั่วไป แต่ใช้เฉพาะสำหรับการกู้คืน Plugin ที่รวมมาให้ในขอบเขตจำกัด โดยอนุญาตให้การติดตั้งซ้ำ/การตั้งค่าซ่อมแซมสิ่งตกค้างจากการอัปเกรดที่ทราบ เช่น พาธ Plugin ที่รวมมาให้ซึ่งหายไป หรือรายการ `channels.<id>` ที่ล้าสมัยสำหรับ Plugin เดียวกันนั้น หากการกำหนดค่าเสียหายจากสาเหตุอื่น การติดตั้งจะยังคงหยุดทำงานอย่างปลอดภัยและแจ้งให้ผู้ควบคุมระบบเรียกใช้ `openclaw doctor --fix`
  </Accordion>
</AccordionGroup>

### การเลื่อนการโหลดแบบเต็ม

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

เมื่อเปิดใช้งาน OpenClaw จะโหลดเฉพาะ `setupEntry` ระหว่างช่วงเริ่มต้นก่อนเริ่มรับฟัง แม้แต่ช่องทางที่กำหนดค่าแล้ว จุดเริ่มต้นแบบเต็มจะโหลดหลังจาก Gateway เริ่มรับฟัง

<Warning>
เปิดใช้การโหลดแบบเลื่อนเวลาเฉพาะเมื่อ `setupEntry` ลงทะเบียนทุกสิ่งที่ Gateway ต้องใช้ก่อนเริ่มรับฟังแล้วเท่านั้น (การลงทะเบียนช่องทาง เส้นทาง HTTP และเมธอด Gateway) หากจุดเริ่มต้นแบบเต็มเป็นเจ้าของความสามารถที่จำเป็นต่อการเริ่มต้น ให้คงลักษณะการทำงานเริ่มต้นไว้
</Warning>

หากจุดเริ่มต้นการตั้งค่า/แบบเต็มของคุณลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้คำนำหน้าที่เฉพาะเจาะจงกับ Plugin เนมสเปซการดูแลระบบหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงเป็นของแกนหลักและจะถูกปรับเป็น `operator.admin` เสมอ

## ไฟล์แมนิเฟสต์ของ Plugin

Plugin แบบเนทีฟทุกตัวต้องมาพร้อมไฟล์ `openclaw.plugin.json` ที่รูทของแพ็กเกจ OpenClaw ใช้ไฟล์นี้เพื่อตรวจสอบความถูกต้องของการกำหนดค่าโดยไม่เรียกใช้โค้ดของ Plugin

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

แม้แต่ Plugin ที่ไม่มีการกำหนดค่าก็ต้องมาพร้อมสคีมา สคีมาว่างถือว่าใช้ได้:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

ดูข้อมูลอ้างอิงสคีมาฉบับเต็มได้ที่ [ไฟล์แมนิเฟสต์ของ Plugin](/th/plugins/manifest)

## การเผยแพร่บน ClawHub

แพ็กเกจ Skills และ Plugin ใช้คำสั่งเผยแพร่ของ ClawHub แยกกัน สำหรับแพ็กเกจ Plugin ให้ใช้คำสั่งเฉพาะสำหรับแพ็กเกจ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` เป็นอีกคำสั่งหนึ่งสำหรับเผยแพร่โฟลเดอร์ Skills ไม่ใช่แพ็กเกจ Plugin ดู [การเผยแพร่บน ClawHub](/th/clawhub/publishing)
</Note>

## จุดเริ่มต้นการตั้งค่า

`setup-entry.ts` เป็นทางเลือกที่มีน้ำหนักเบาแทน `index.ts` ซึ่ง OpenClaw จะโหลดเมื่อต้องการเฉพาะส่วนติดต่อสำหรับการตั้งค่า (การเริ่มต้นใช้งาน การซ่อมแซมการกำหนดค่า การตรวจสอบช่องทางที่ปิดใช้งาน):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

วิธีนี้ช่วยหลีกเลี่ยงการโหลดโค้ดรันไทม์ขนาดใหญ่ (ไลบรารีการเข้ารหัส การลงทะเบียน CLI บริการเบื้องหลัง) ระหว่างขั้นตอนการตั้งค่า

ช่องทางที่รวมมากับเวิร์กสเปซซึ่งเก็บการส่งออกที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูลประกอบ สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก `openclaw/plugin-sdk/channel-entry-contract` แทน `defineSetupPluginEntry(...)` ได้ สัญญาสำหรับองค์ประกอบที่รวมมาดังกล่าวยังรองรับการส่งออก `runtime` ซึ่งเป็นตัวเลือก เพื่อให้การเชื่อมต่อรันไทม์ในช่วงตั้งค่ายังคงมีน้ำหนักเบาและชัดเจน

<AccordionGroup>
  <Accordion title="เมื่อ OpenClaw ใช้ setupEntry แทนจุดเริ่มต้นแบบเต็ม">
    - ช่องทางถูกปิดใช้งาน แต่ต้องใช้ส่วนติดต่อสำหรับการตั้งค่า/การเริ่มต้นใช้งาน
    - ช่องทางเปิดใช้งานแล้วแต่ยังไม่ได้กำหนดค่า
    - เปิดใช้งานการโหลดแบบเลื่อนเวลา (`deferConfiguredChannelFullLoadUntilAfterListen`)

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ต้องลงทะเบียน">
    - อ็อบเจกต์ Plugin ช่องทาง (ผ่าน `defineSetupPluginEntry`)
    - เส้นทาง HTTP ที่จำเป็นก่อน Gateway เริ่มรอรับการเชื่อมต่อ
    - เมธอด Gateway ที่จำเป็นระหว่างการเริ่มต้นระบบ

    เมธอด Gateway สำหรับการเริ่มต้นระบบเหล่านั้นยังคงควรหลีกเลี่ยงเนมสเปซผู้ดูแลระบบหลักที่สงวนไว้ เช่น `config.*` หรือ `update.*`

  </Accordion>
  <Accordion title="สิ่งที่ setupEntry ไม่ควรมี">
    - การลงทะเบียน CLI
    - บริการเบื้องหลัง
    - การนำเข้ารันไทม์ขนาดใหญ่ (การเข้ารหัส, SDK)
    - เมธอด Gateway ที่จำเป็นเฉพาะหลังเริ่มต้นระบบแล้ว

  </Accordion>
</AccordionGroup>

### การนำเข้าตัวช่วยการตั้งค่าแบบเฉพาะเจาะจง

สำหรับเส้นทางด่วนที่ใช้เฉพาะการตั้งค่า ให้เลือกใช้ส่วนเชื่อมต่อตัวช่วยการตั้งค่าแบบเฉพาะเจาะจงแทนส่วนรวม `plugin-sdk/setup` ที่กว้างกว่า เมื่อคุณต้องการเพียงบางส่วนของส่วนติดต่อการตั้งค่า:

| เส้นทางการนำเข้า                    | ใช้สำหรับ                                                                                  | การส่งออกหลัก                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ตัวช่วยรันไทม์ช่วงตั้งค่าที่ยังคงพร้อมใช้ใน `setupEntry` / การเริ่มต้นช่องทางแบบเลื่อนเวลา | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | นามแฝงเพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว ให้ใช้ `plugin-sdk/setup-runtime`                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | ตัวช่วยสำหรับ CLI/คลังเก็บ/เอกสารในการตั้งค่าและติดตั้ง                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

ใช้ส่วนเชื่อมต่อ `plugin-sdk/setup` ที่กว้างกว่าเมื่อต้องการชุดเครื่องมือการตั้งค่าที่ใช้ร่วมกันทั้งหมด รวมถึงตัวช่วยแก้ไขการกำหนดค่า เช่น `moveSingleAccountChannelSectionToDefaultAccount(...)`

ใช้ `createSetupTranslator(...)` สำหรับข้อความคงที่ในตัวช่วยสร้างการตั้งค่า โดยจะใช้โลแคลของตัวช่วยสร้าง CLI (`OPENCLAW_LOCALE` แล้วจึงใช้ตัวแปรโลแคลของระบบ) และย้อนกลับไปใช้ภาษาอังกฤษเมื่อไม่พบ เก็บข้อความการตั้งค่าที่เฉพาะเจาะจงกับ Plugin ไว้ในโค้ดที่ Plugin เป็นเจ้าของ และใช้คีย์แค็ตตาล็อกที่ใช้ร่วมกันเฉพาะกับป้ายกำกับการตั้งค่าทั่วไป ข้อความสถานะ และข้อความการตั้งค่าของ Plugin ทางการที่รวมมาเท่านั้น

อะแดปเตอร์แพตช์การตั้งค่ายังคงปลอดภัยสำหรับเส้นทางด่วนเมื่อมีการนำเข้า การค้นหาส่วนติดต่อสัญญาสำหรับการเลื่อนระดับบัญชีเดี่ยวขององค์ประกอบที่รวมมาจะทำแบบล่าช้า ดังนั้นการนำเข้า `plugin-sdk/setup-runtime` จะไม่โหลดการค้นหาส่วนติดต่อสัญญาที่รวมมาไว้ล่วงหน้า ก่อนที่จะมีการใช้อะแดปเตอร์จริง

### การเลื่อนระดับบัญชีเดี่ยวที่ช่องทางเป็นเจ้าของ

เมื่อช่องทางอัปเกรดจากการกำหนดค่าระดับบนสุดแบบบัญชีเดี่ยวเป็น `channels.<id>.accounts.*` พฤติกรรมร่วมเริ่มต้นจะย้ายค่าที่เลื่อนระดับและจำกัดขอบเขตตามบัญชีไปยัง `accounts.default`

ช่องทางที่รวมมาสามารถจำกัดหรือแทนที่การเลื่อนระดับดังกล่าวผ่านส่วนติดต่อสัญญาการตั้งค่าของตน:

- `singleAccountKeysToMove`: คีย์ระดับบนสุดเพิ่มเติมที่ควรย้ายเข้าไปในบัญชีที่เลื่อนระดับ
- `namedAccountPromotionKeys`: เมื่อมีบัญชีที่ตั้งชื่อไว้อยู่แล้ว จะย้ายเฉพาะคีย์เหล่านี้เข้าไปในบัญชีที่เลื่อนระดับ ส่วนคีย์นโยบาย/การส่งมอบที่ใช้ร่วมกันจะยังคงอยู่ที่รูทของช่องทาง
- `resolveSingleAccountPromotionTarget(...)`: เลือกว่าบัญชีที่มีอยู่บัญชีใดจะรับค่าที่เลื่อนระดับ

<Note>
Matrix เป็นตัวอย่างองค์ประกอบที่รวมมาในปัจจุบัน หากมีบัญชี Matrix ที่ตั้งชื่อไว้เพียงบัญชีเดียวอยู่แล้ว หรือหาก `defaultAccount` ชี้ไปยังคีย์ที่มีอยู่ซึ่งไม่ใช่รูปแบบมาตรฐาน เช่น `Ops` การเลื่อนระดับจะรักษาบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่
</Note>

## สคีมาการกำหนดค่า

การกำหนดค่าของ Plugin จะถูกตรวจสอบเทียบกับ JSON Schema ในไฟล์แมนิเฟสต์ ผู้ใช้กำหนดค่า Plugin ผ่าน:

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

ใช้ `buildChannelConfigSchema` เพื่อแปลงสคีมา Zod เป็นตัวห่อหุ้ม `ChannelConfigSchema` ที่อาร์ติแฟกต์การกำหนดค่าซึ่ง Plugin เป็นเจ้าของใช้:

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

หากคุณเขียนสัญญาเป็น JSON Schema หรือ TypeBox อยู่แล้ว ให้ใช้ตัวช่วยโดยตรงเพื่อให้ OpenClaw ข้ามการแปลง Zod เป็น JSON Schema ในเส้นทางเมทาดาทาได้:

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

สำหรับ Plugin ของบุคคลที่สาม สัญญาสำหรับเส้นทางที่ไม่ทำงานบ่อยยังคงเป็นไฟล์แมนิเฟสต์ของ Plugin: คัดลอก JSON Schema ที่สร้างขึ้นไปยัง `openclaw.plugin.json#channelConfigs` เพื่อให้สคีมาการกำหนดค่า การตั้งค่า และส่วนติดต่อ UI สามารถตรวจสอบ `channels.<id>` ได้โดยไม่ต้องโหลดโค้ดรันไทม์

## ตัวช่วยสร้างการตั้งค่า

Plugin ช่องทางสามารถมีตัวช่วยสร้างการตั้งค่าแบบโต้ตอบสำหรับ `openclaw onboard` ได้ ตัวช่วยสร้างคืออ็อบเจกต์ `ChannelSetupWizard` บน `ChannelPlugin`:

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

`ChannelSetupWizard` ยังรองรับ `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` และอื่น ๆ ดูตัวอย่างองค์ประกอบที่รวมมาฉบับเต็มได้จาก `src/setup-core.ts` ของ Plugin Discord

<AccordionGroup>
  <Accordion title="พรอมต์ allowFrom ที่ใช้ร่วมกัน">
    สำหรับพรอมต์รายการอนุญาตของ DM ที่ต้องการเพียงขั้นตอนมาตรฐาน `note -> prompt -> parse -> merge -> patch` ให้เลือกใช้ตัวช่วยการตั้งค่าที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` และ `createNestedChannelParsedAllowFromPrompt(...)`
  </Accordion>
  <Accordion title="สถานะการตั้งค่าช่องทางมาตรฐาน">
    สำหรับบล็อกสถานะการตั้งค่าช่องทางที่แตกต่างกันเฉพาะป้ายกำกับ คะแนน และบรรทัดเพิ่มเติมซึ่งเป็นตัวเลือก ให้เลือกใช้ `createStandardChannelSetupStatus(...)` จาก `openclaw/plugin-sdk/setup` แทนการสร้างอ็อบเจกต์ `status` เดิมซ้ำด้วยตนเองในแต่ละ Plugin
  </Accordion>
  <Accordion title="ส่วนติดต่อการตั้งค่าช่องทางที่เป็นตัวเลือก">
    สำหรับส่วนติดต่อการตั้งค่าที่เป็นตัวเลือกซึ่งควรปรากฏเฉพาะในบางบริบท ให้ใช้ `createOptionalChannelSetupSurface` จาก `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` ยังเปิดเผยตัวสร้างระดับล่าง `createOptionalChannelSetupAdapter(...)` และ `createOptionalChannelSetupWizard(...)` เมื่อคุณต้องการเพียงครึ่งเดียวของส่วนติดต่อการติดตั้งแบบตัวเลือกนั้น

    อะแดปเตอร์/วิซาร์ดเสริมที่สร้างขึ้นจะปฏิเสธการดำเนินการโดยค่าเริ่มต้นเมื่อมีการเขียนการกำหนดค่าจริง โดยใช้ข้อความเดียวกันที่ระบุว่าจำเป็นต้องติดตั้งใน `validateInput`, `applyAccountConfig` และ `finalize` และเพิ่มลิงก์เอกสารต่อท้ายเมื่อตั้งค่า `docsPath`

  </Accordion>
  <Accordion title="ตัวช่วยตั้งค่าที่อาศัยไบนารี">
    สำหรับ UI การตั้งค่าที่อาศัยไบนารี ให้ใช้ตัวช่วยมอบหมายงานที่ใช้ร่วมกันแทนการคัดลอกโค้ดเชื่อมต่อไบนารี/สถานะชุดเดิมไปยังทุกช่องทาง:

    - `createDetectedBinaryStatus(...)` สำหรับบล็อกสถานะที่แตกต่างกันเฉพาะป้ายกำกับ คำแนะนำ คะแนน และการตรวจหาไบนารี
    - `createCliPathTextInput(...)` สำหรับช่องป้อนข้อความที่อ้างอิงพาธ
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` และ `createDelegatedResolveConfigured(...)` เมื่อ `setupEntry` ต้องส่งต่อไปยังวิซาร์ดแบบเต็มที่มีขนาดใหญ่กว่าโดยโหลดเมื่อจำเป็น
    - `createDelegatedTextInputShouldPrompt(...)` เมื่อ `setupEntry` ต้องมอบหมายเฉพาะการตัดสินใจ `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## การเผยแพร่และการติดตั้ง

**Plugin ภายนอก:** เผยแพร่ไปยัง [ClawHub](/th/clawhub) แล้วติดตั้ง:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านตอนเปิดใช้งาน เว้นแต่ชื่อจะตรงกับรหัส Plugin ที่รวมมาให้หรือเป็นทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้สำเนาในเครื่อง/อย่างเป็นทางการนั้นแทน ใช้ `clawhub:`, `npm:`, `git:` หรือ `npm-pack:` เพื่อเลือกแหล่งที่มาอย่างแน่นอน — ดู [จัดการ Plugin](/th/plugins/manage-plugins)

  </Tab>
  <Tab title="ClawHub เท่านั้น">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="ข้อกำหนดแพ็กเกจ npm">
    ใช้ npm เมื่อแพ็กเกจยังไม่ได้ย้ายไปยัง ClawHub หรือเมื่อคุณต้องการ
    พาธการติดตั้งโดยตรงจาก npm ระหว่างการย้ายระบบ:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin ภายในรีโพ:** วางไว้ใต้โครงสร้างเวิร์กสเปซ Plugin ที่รวมมาให้ ระบบจะค้นพบโดยอัตโนมัติระหว่างการบิลด์

<Info>
สำหรับการติดตั้งที่ใช้ npm เป็นแหล่งที่มา `openclaw plugins install` จะติดตั้งแพ็กเกจลงในโปรเจกต์แยกสำหรับแต่ละ Plugin ภายใต้ `~/.openclaw/npm/projects` โดยปิดใช้งานสคริปต์วงจรชีวิต (`--ignore-scripts`) รักษาโครงสร้างการพึ่งพาของ Plugin ให้เป็น JS/TS ล้วน และหลีกเลี่ยงแพ็กเกจที่ต้องบิลด์ด้วย `postinstall`
</Info>

<Note>
การเริ่มต้น Gateway จะไม่ติดตั้งการพึ่งพาของ Plugin โฟลว์การติดตั้งผ่าน npm/git/ClawHub เป็นผู้ดูแลให้การพึ่งพาสอดคล้องกัน ส่วน Plugin ในเครื่องต้องติดตั้งการพึ่งพาไว้แล้ว
</Note>

ข้อมูลเมตาของแพ็กเกจที่รวมมาให้จะระบุไว้อย่างชัดเจน ไม่ได้อนุมานจาก JavaScript ที่บิลด์แล้วระหว่างการเริ่มต้น Gateway การพึ่งพาขณะรันไทม์ต้องอยู่ในแพ็กเกจ Plugin ที่เป็นเจ้าของการพึ่งพานั้น การเริ่มต้น OpenClaw แบบแพ็กเกจจะไม่ซ่อมแซมหรือทำสำเนาการพึ่งพาของ Plugin

## เนื้อหาที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — คู่มือเริ่มต้นใช้งานแบบทีละขั้นตอน
- [ไฟล์กำกับ Plugin](/th/plugins/manifest) — เอกสารอ้างอิงสคีมาของไฟล์กำกับฉบับเต็ม
- [จุดเริ่มต้นของ SDK](/th/plugins/sdk-entrypoints) — `definePluginEntry` และ `defineChannelPluginEntry`
