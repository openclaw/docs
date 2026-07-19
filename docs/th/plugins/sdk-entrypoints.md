---
read_when:
    - คุณต้องใช้ลายเซ็นชนิดข้อมูลที่แน่นอนของ defineToolPlugin, definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (แบบเต็ม เทียบกับการตั้งค่า เทียบกับข้อมูลเมตาของ CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้น
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ defineToolPlugin, definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นของ Plugin
x-i18n:
    generated_at: "2026-07-19T07:54:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

ทุก Plugin ส่งออกออบเจ็กต์รายการเริ่มต้นเป็นค่าเริ่มต้น SDK มีตัวช่วยสำหรับ
รูปแบบรายการแต่ละแบบ ได้แก่ `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`

<Tip>
  **กำลังมองหาคำแนะนำทีละขั้นตอนอยู่ใช่ไหม** ดูคำแนะนำทีละขั้นตอนได้ที่ [Plugin เครื่องมือ](/th/plugins/tool-plugins),
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) หรือ
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)
</Tip>

## รายการแพ็กเกจ

Plugin ที่ติดตั้งแล้วจะกำหนดฟิลด์ `package.json` `openclaw` ให้ชี้ไปยังทั้งรายการ
ซอร์สและรายการที่บิลด์แล้ว:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` และ `setupEntry` เป็นรายการซอร์ส ซึ่งใช้สำหรับการพัฒนาในเวิร์กสเปซและ
  เช็กเอาต์ git
- สำหรับแพ็กเกจที่ติดตั้งแล้ว ควรใช้ `runtimeExtensions` และ `runtimeSetupEntry`:
  ซึ่งช่วยให้แพ็กเกจ npm ข้ามการคอมไพล์ TypeScript ขณะรันไทม์ได้
- เมื่อมี `runtimeExtensions` จำนวนสมาชิกในอาร์เรย์ต้องตรงกับ `extensions`
  (รายการจะจับคู่กันตามตำแหน่ง) `runtimeSetupEntry` ต้องมี `setupEntry`
- หากประกาศอาร์ติแฟกต์ `runtimeExtensions`/`runtimeSetupEntry` ไว้แต่
  ไม่มีอาร์ติแฟกต์นั้น การติดตั้ง/การค้นหาจะล้มเหลวพร้อมข้อผิดพลาดด้านการจัดแพ็กเกจ โดย OpenClaw จะไม่
  ย้อนกลับไปใช้ซอร์สโดยไม่แจ้งให้ทราบ การย้อนกลับไปใช้ซอร์ส (ด้านล่าง) จะใช้เฉพาะเมื่อไม่ได้
  ประกาศรายการรันไทม์ไว้เลยเท่านั้น
- หากแพ็กเกจที่ติดตั้งแล้วประกาศเพียงรายการซอร์ส TypeScript ทาง OpenClaw
  จะค้นหารายการคู่ขนาน `dist/*.js` (หรือ `.mjs`/`.cjs`) ที่บิลด์แล้วและใช้รายการนั้น
  มิฉะนั้นจะย้อนกลับไปใช้ซอร์ส TypeScript
- พาธรายการทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin รายการรันไทม์
  และรายการคู่ขนาน JS ที่บิลด์แล้วซึ่งอนุมานขึ้น ไม่ได้ทำให้พาธซอร์ส `extensions` หรือ
  `setupEntry` ที่ออกนอกไดเรกทอรีกลายเป็นพาธที่ถูกต้อง

## `defineToolPlugin`

**นำเข้า:** `openclaw/plugin-sdk/tool-plugin`

สำหรับ Plugin ที่เพิ่มเฉพาะเครื่องมือเอเจนต์ ช่วยให้ซอร์สมีขนาดเล็ก อนุมานประเภทของการกำหนดค่า
และพารามิเตอร์เครื่องมือจากสคีมา TypeBox ห่อค่าที่ส่งคืนแบบธรรมดาให้อยู่ใน
รูปแบบผลลัพธ์เครื่องมือของ OpenClaw และเปิดเผยเมทาดาทาแบบคงที่ซึ่ง
`openclaw plugins build` จะเขียนลงในแมนิเฟสต์ของ Plugin (`contracts.tools`,
`configSchema`)

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` เป็นตัวเลือก หากละไว้จะใช้สคีมาออบเจ็กต์ว่างแบบเข้มงวด
  (แมนิเฟสต์ที่สร้างขึ้นจะยังคงมี `configSchema`)
- `execute` ส่งคืนสตริงธรรมดาหรือค่าที่ทำให้เป็นอนุกรม JSON ได้ ตัวช่วยจะ
  ห่อค่านั้นเป็นผลลัพธ์เครื่องมือแบบข้อความ โดยตั้งค่า `details` เป็นค่าที่ส่งคืนเดิม
  (ซึ่งยังไม่ได้แปลงเป็นสตริง)
- `outputSchema` ใช้อธิบายค่า `details` เดิมนั้นสำหรับโหมด Code
  และการค้นหาเครื่องมือได้ตามต้องการ การเรียกแค็ตตาล็อกจะปฏิเสธสคีมาที่ไม่ถูกต้องก่อนดำเนินการ
  และตรวจสอบค่าขั้นสุดท้ายก่อนส่งคืน
- สำหรับผลลัพธ์เครื่องมือแบบกำหนดเอง `openclaw/plugin-sdk/tool-results` จะส่งออก
  `textResult` และ `jsonResult`
- ชื่อเครื่องมือเป็นค่าคงที่ ดังนั้น `openclaw plugins build` จึงหา
  `contracts.tools` จากเครื่องมือที่ประกาศไว้โดยไม่ต้องทำสำเนาชื่อด้วยตนเอง
- การโหลดขณะรันไทม์ยังคงเข้มงวด: Plugin ที่ติดตั้งแล้วยังคงต้องมี
  `openclaw.plugin.json` และ `package.json` `openclaw.extensions` โดย OpenClaw
  จะไม่เรียกใช้โค้ด Plugin เพื่ออนุมานข้อมูลแมนิเฟสต์ที่ขาดหายไป

## `definePluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ Plugin ผู้ให้บริการ, Plugin เครื่องมือขั้นสูง, Plugin ฮุก และทุกสิ่งที่
**ไม่ใช่** ช่องทางรับส่งข้อความ

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| ฟิลด์                     | ประเภท                                                             | จำเป็น | ค่าเริ่มต้น             |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | ใช่      | -                   |
| `name`                    | `string`                                                         | ใช่      | -                   |
| `description`             | `string`                                                         | ใช่      | -                   |
| `kind`                    | `string` (เลิกแนะนำให้ใช้แล้ว ดูด้านล่าง)                                 | ไม่       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่       | สคีมาออบเจ็กต์ว่าง |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | ไม่       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | ไม่       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | ไม่       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | ใช่      | -                   |

- `id` ต้องตรงกับแมนิเฟสต์ `openclaw.plugin.json` ของคุณ
- แค็ตตาล็อกเซสชันภายนอกใช้
  `openclaw/plugin-sdk/session-catalog` และ
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`
  คอร์เป็นเจ้าของเมธอด Gateway `sessions.catalog.*`; ผู้ให้บริการจะส่งคืนโฮสต์
  เซสชัน และการฉายภาพทรานสคริปต์ที่ปรับให้เป็นมาตรฐานโดยไม่ลงทะเบียน RPC ผู้ให้บริการ
  แบบรายการควรเรียกคอลแบ็ก `onHost(host)` ซึ่งเป็นตัวเลือกเมื่อแต่ละโฮสต์
  ได้ข้อยุติแล้ว โดยอาร์เรย์โฮสต์ที่ส่งคืนยังคงจำเป็นในฐานะสแนปช็อตความเข้ากันได้
  ขั้นสุดท้าย
- `kind` เลิกแนะนำให้ใช้แล้ว: ให้ประกาศสล็อตเฉพาะ (`"memory"` หรือ
  `"context-engine"`) ในฟิลด์ `kind` ของแมนิเฟสต์ `openclaw.plugin.json`
  แทน ส่วน `kind` ของรายการรันไทม์จะคงอยู่เฉพาะในฐานะทางเลือกสำรองเพื่อความเข้ากันได้สำหรับ
  Plugin รุ่นเก่า
- `configSchema` สามารถเป็นฟังก์ชันสำหรับการประเมินแบบหน่วงเวลาได้ OpenClaw จะประมวลผลและ
  จดจำสคีมาเมื่อเข้าถึงครั้งแรก ดังนั้นตัวสร้างสคีมาที่ใช้ทรัพยากรมากจะทำงาน
  เพียงครั้งเดียว
- ตัวบรรยาย `nodeHostCommands` สามารถกำหนด `isAvailable({ config, env })` ได้
  การส่งคืน `false` จะละเว้นคำสั่งนั้นและความสามารถของคำสั่งจากการประกาศ Gateway
  ของ Node แบบไม่มีส่วนติดต่อผู้ใช้ OpenClaw จะประเมินค่านี้กับการกำหนดค่าการเริ่มต้น
  ภายใน Node ส่วนตัวจัดการคำสั่งยังคงควรตรวจสอบความพร้อมใช้งานเมื่อ
  ถูกเรียกใช้

## `defineChannelPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` ด้วยการเชื่อมต่อเฉพาะช่องทาง: โดยจะเรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผยจุดเชื่อมต่อเมทาดาทา CLI
สำหรับความช่วยเหลือระดับรากซึ่งเป็นตัวเลือก และควบคุม `registerFull` ตามโหมดการลงทะเบียน

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| ฟิลด์                 | ประเภท                                                             | จำเป็น | ค่าเริ่มต้น             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | ใช่      | -                   |
| `name`                | `string`                                                         | ใช่      | -                   |
| `description`         | `string`                                                         | ใช่      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | ใช่      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่       | สคีมาออบเจ็กต์ว่าง |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | ไม่       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | ไม่       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | ไม่       | -                   |

คอลแบ็กจะทำงานตามโหมดการลงทะเบียนแต่ละโหมด (ดูตารางทั้งหมดใน
[โหมดการลงทะเบียน](#registration-mode)):

- `setRuntime` จะทำงานในทุกโหมดยกเว้น `"cli-metadata"` และ
  `"tool-discovery"` ให้จัดเก็บการอ้างอิงรันไทม์ไว้ที่นี่ โดยทั่วไปผ่าน
  `createPluginRuntimeStore`
- `registerCliMetadata` จะทำงานสำหรับ `"cli-metadata"`, `"discovery"` และ
  `"full"` ใช้ส่วนนี้เป็นตำแหน่งหลักสำหรับตัวบรรยาย CLI ที่ช่องทางเป็นเจ้าของ
  เพื่อให้ความช่วยเหลือระดับรากไม่ทำให้เกิดการเปิดใช้งาน สแนปช็อตการค้นหามี
  เมทาดาทาคำสั่งแบบคงที่ และการลงทะเบียน CLI ตามปกติยังคงเข้ากันได้กับการโหลด
  Plugin แบบเต็ม
- `registerFull` จะทำงานเฉพาะสำหรับ `"full"` และ `"tool-discovery"` สำหรับ
  `"tool-discovery"` ส่วนนี้จะทำงาน _แทน_ การลงทะเบียนช่องทาง: OpenClaw
  จะข้าม `registerChannel`/`setRuntime` ทั้งหมดและเรียกเฉพาะ
  `registerFull` ดังนั้นการลงทะเบียนผู้ให้บริการ/เครื่องมือใดๆ ที่ช่องทางของคุณต้องใช้สำหรับ
  การค้นหาหรือเรียกใช้เครื่องมือแบบสแตนด์อโลนต้องอยู่ที่นี่ ไม่ใช่อยู่หลังการตั้งค่า
  ช่องทางตามปกติ
- การลงทะเบียนเพื่อการค้นหาไม่ทำให้เกิดการเปิดใช้งาน แต่ไม่ได้หมายความว่าจะไม่มีการนำเข้า: OpenClaw อาจ
  ประเมินรายการ Plugin ที่เชื่อถือได้และโมดูล Plugin ช่องทางเพื่อสร้าง
  สแนปช็อต คงการนำเข้าระดับบนสุดให้ปราศจากผลข้างเคียง และวางซ็อกเก็ต
  ไคลเอนต์ เวิร์กเกอร์ และบริการไว้หลังพาธที่ใช้เฉพาะ `"full"`
- เช่นเดียวกับ `definePluginEntry` ตัว `configSchema` สามารถเป็นแฟกทอรีแบบหน่วงเวลาได้ โดย OpenClaw
  จะจดจำสคีมาที่ประมวลผลแล้วเมื่อเข้าถึงครั้งแรก

การลงทะเบียน CLI:

- ใช้ `api.registerCli(..., { descriptors: [...] })` สำหรับคำสั่ง CLI ระดับรากที่ Plugin เป็นเจ้าของ
  ซึ่งต้องการให้โหลดแบบ lazy โดยไม่หายไปจากโครงสร้างการแยกวิเคราะห์ของ CLI
  ระดับราก ชื่อตัวอธิบายต้องประกอบด้วยตัวอักษร ตัวเลข ขีดกลาง และ
  ขีดล่าง โดยขึ้นต้นด้วยตัวอักษรหรือตัวเลข OpenClaw จะปฏิเสธ
  รูปแบบอื่นและลบลำดับควบคุมเทอร์มินัลออกจากคำอธิบายก่อน
  แสดงวิธีใช้ ให้ครอบคลุมรากของคำสั่งระดับบนสุดทุกคำสั่งที่ตัวลงทะเบียนเปิดให้ใช้
  `commands` เพียงอย่างเดียวยังคงอยู่ในเส้นทางความเข้ากันได้แบบ eager
- ใช้ `api.registerNodeCliFeature(...)` สำหรับคำสั่งฟีเจอร์ของ Node ที่จับคู่กัน เพื่อให้
  คำสั่งเหล่านั้นอยู่ภายใต้ `openclaw nodes` (เทียบเท่ากับ
  `registerCli(registrar, { parentPath: ["nodes"], ... })`)
- สำหรับคำสั่ง Plugin แบบซ้อนอื่นๆ ให้เพิ่ม `parentPath` และลงทะเบียนคำสั่ง
  บนออบเจ็กต์ `program` ที่ส่งไปยังตัวลงทะเบียน OpenClaw จะแปลงออบเจ็กต์นั้นเป็น
  คำสั่งแม่ก่อนเรียก Plugin
- สำหรับ Plugin ช่องทาง ให้ลงทะเบียนตัวอธิบาย CLI จาก `registerCliMetadata`
  และให้ `registerFull` มุ่งเน้นเฉพาะงานรันไทม์
- หาก `registerFull` ลงทะเบียนเมธอด RPC ของ Gateway ด้วย ให้ใช้คำนำหน้า
  เฉพาะ Plugin สำหรับเมธอดเหล่านั้น เนมสเปซผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับให้เป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบน้ำหนักเบา ส่งคืนเฉพาะ `{ plugin }` โดยไม่มี
การเชื่อมต่อรันไทม์หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw จะโหลดไฟล์นี้แทนรายการเข้าแบบเต็มเมื่อช่องทางถูกปิดใช้งาน
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้งานการโหลดแบบเลื่อนเวลา ดูว่าเรื่องนี้สำคัญเมื่อใดได้ที่
[การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry)

ใช้ `defineSetupPluginEntry(...)` ร่วมกับกลุ่มตัวช่วยการตั้งค่าที่มีขอบเขตแคบ:

| การนำเข้า                              | ใช้สำหรับ                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | ตัวช่วยการตั้งค่าที่ปลอดภัยสำหรับรันไทม์: `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ปลอดภัยต่อการนำเข้า, เอาต์พุตหมายเหตุการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าแบบมอบหมาย |
| `openclaw/plugin-sdk/channel-setup` | พื้นผิวการตั้งค่าสำหรับการติดตั้งแบบไม่บังคับ                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | ตัวช่วย CLI สำหรับการตั้งค่า/ติดตั้ง รวมถึงตัวช่วยคลังเก็บและเอกสาร                                                                                                                                       |

เก็บ SDK ขนาดใหญ่ การลงทะเบียน CLI และบริการรันไทม์ที่ทำงานระยะยาวไว้ใน
รายการเข้าแบบเต็ม

ช่องทางในเวิร์กสเปซแบบรวมที่แยกพื้นผิวการตั้งค่าและรันไทม์สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ ซึ่งช่วยให้รายการเข้า
สำหรับการตั้งค่าเก็บการส่งออก Plugin/ข้อมูลลับที่ปลอดภัยสำหรับการตั้งค่าไว้ พร้อมกับยังเปิดเผย
ตัวตั้งค่ารันไทม์:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* เส้นทางที่ปลอดภัยสำหรับการตั้งค่า */
      },
    });
  },
});
```

ใช้วิธีนี้เฉพาะเมื่อขั้นตอนการตั้งค่าต้องใช้ตัวตั้งค่ารันไทม์แบบน้ำหนักเบาหรือ
พื้นผิว Gateway ที่ปลอดภัยสำหรับการตั้งค่าก่อนรายการเข้าของช่องทางแบบเต็มจะโหลดจริงๆ
`registerSetupRuntime` จะทำงานเฉพาะสำหรับการโหลด `"setup-runtime"` เท่านั้น ให้จำกัด
ขอบเขตไว้ที่เส้นทางหรือเมธอดสำหรับการกำหนดค่าเท่านั้น ซึ่งต้องมีอยู่ก่อนการเปิดใช้งาน
แบบเต็มที่ถูกเลื่อนเวลา

## โหมดการลงทะเบียน

`api.registrationMode` แจ้งให้ Plugin ทราบว่าโหลดมาด้วยวิธีใด:

| โหมด               | เมื่อ                                               | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | การเริ่มต้น Gateway ตามปกติ                             | ทุกอย่าง                                                                                                              |
| `"discovery"`      | การค้นหาความสามารถแบบอ่านอย่างเดียว                     | การลงทะเบียนช่องทางพร้อมตัวอธิบาย CLI แบบคงที่ โค้ดรายการเข้าอาจโหลดได้ แต่ให้ข้ามซ็อกเก็ต เวิร์กเกอร์ ไคลเอนต์ และบริการ |
| `"tool-discovery"` | การโหลดแบบมีขอบเขตเพื่อแสดงรายการหรือเรียกใช้เครื่องมือของ Plugin ที่ระบุ | ลงทะเบียนเฉพาะความสามารถ/เครื่องมือ โดยไม่เปิดใช้งานช่องทาง                                                                |
| `"setup-only"`     | ช่องทางที่ปิดใช้งาน/ยังไม่ได้กำหนดค่า                      | ลงทะเบียนช่องทางเท่านั้น                                                                                               |
| `"setup-runtime"`  | ขั้นตอนการตั้งค่าที่พร้อมใช้รันไทม์                  | ลงทะเบียนช่องทางพร้อมเฉพาะรันไทม์แบบน้ำหนักเบาที่จำเป็นก่อนรายการเข้าแบบเต็มจะโหลด                               |
| `"cli-metadata"`   | วิธีใช้ระดับราก / การเก็บข้อมูลเมตา CLI                   | ตัวอธิบาย CLI เท่านั้น                                                                                                    |

`defineChannelPluginEntry` จัดการการแยกนี้โดยอัตโนมัติ หากใช้
`definePluginEntry` โดยตรงสำหรับช่องทาง ให้ตรวจสอบโหมดด้วยตนเองและจำไว้ว่า
`"tool-discovery"` จะข้ามการลงทะเบียนช่องทาง:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // ลงทะเบียนพื้นผิวเฉพาะความสามารถ (ผู้ให้บริการ/เครื่องมือ) โดยไม่มีช่องทาง
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // การลงทะเบียนเฉพาะรันไทม์ที่มีภาระสูง
  api.registerService(/* ... */);
}
```

บริการที่ทำงานระยะยาวอาจส่งเหตุการณ์การทำให้ข้อมูลใช้ไม่ได้หรือเหตุการณ์วงจรชีวิตขนาดเล็กผ่าน
บริบทของบริการ:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw กำหนดเนมสเปซนี้เป็น `plugin.<plugin-id>.changed` ชื่อเหตุการณ์ต้องเป็น
ส่วนเดียวที่เป็นตัวพิมพ์เล็ก เพย์โหลดต้องเป็น JSON ที่มีขอบเขตจำกัด และขอบเขตต้องเป็น
`operator.read`, `operator.write` หรือ `operator.admin` ตัวส่งเหตุการณ์จะมีอยู่เฉพาะ
ตลอดอายุการทำงานของบริการ และจะถูกเพิกถอนหลังหยุดหรือเริ่มต้นล้มเหลว ควรใช้
เพย์โหลดเวอร์ชันหรือการทำให้ข้อมูลใช้ไม่ได้แทนระเบียนทั้งหมด เพื่อให้ไคลเอนต์ที่ได้รับอนุญาตอ่าน
สถานะมาตรฐานอีกครั้งผ่านเมธอด Gateway ที่มีขอบเขตของ Plugin

โหมดการค้นหาจะสร้างสแนปช็อตรีจิสทรีที่ไม่เปิดใช้งาน โดยยังอาจ
ประเมินรายการเข้าของ Plugin และออบเจ็กต์ Plugin ช่องทาง เพื่อให้ OpenClaw สามารถ
ลงทะเบียนความสามารถของช่องทางและตัวอธิบาย CLI แบบคงที่ได้ ให้ถือว่าการประเมินโมดูล
ในระหว่างการค้นหานั้นเชื่อถือได้แต่ต้องมีน้ำหนักเบา: ห้ามมีไคลเอนต์เครือข่าย
โพรเซสย่อย ตัวรับฟัง การเชื่อมต่อฐานข้อมูล เวิร์กเกอร์เบื้องหลัง
การอ่านข้อมูลประจำตัว หรือผลข้างเคียงอื่นๆ ของรันไทม์ที่ทำงานอยู่ในระดับบนสุด

ให้ถือว่า `"setup-runtime"` เป็นช่วงเวลาที่พื้นผิวเริ่มต้นเฉพาะการตั้งค่าต้อง
มีอยู่โดยไม่เข้าสู่รันไทม์ช่องทางแบบรวมเต็มรูปแบบอีกครั้ง สิ่งที่เหมาะสมได้แก่
การลงทะเบียนช่องทาง เส้นทาง HTTP ที่ปลอดภัยสำหรับการตั้งค่า เมธอด Gateway ที่ปลอดภัยสำหรับการตั้งค่า
และตัวช่วยการตั้งค่าแบบมอบหมาย ส่วนบริการเบื้องหลังที่มีภาระสูง ตัวลงทะเบียน CLI และ
การเริ่มต้น SDK ของผู้ให้บริการ/ไคลเอนต์ยังคงต้องอยู่ใน `"full"`

## รูปแบบ Plugin

OpenClaw จำแนก Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                 | คำอธิบาย                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ความสามารถหนึ่งประเภท (เช่น เฉพาะผู้ให้บริการ)           |
| **hybrid-capability** | ความสามารถหลายประเภท (เช่น ผู้ให้บริการ + เสียงพูด) |
| **hook-only**         | มีเฉพาะฮุก ไม่มีความสามารถ                        |
| **non-capability**    | มีเครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ        |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) - API การลงทะเบียนและข้อมูลอ้างอิงพาธย่อย
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime) - `api.runtime` และ `createPluginRuntimeStore`
- [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup) - แมนิเฟสต์ รายการเข้าการตั้งค่า การโหลดแบบเลื่อนเวลา
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้างออบเจ็กต์ `ChannelPlugin`
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การลงทะเบียนผู้ให้บริการและฮุก
