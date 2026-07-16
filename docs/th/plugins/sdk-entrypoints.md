---
read_when:
    - คุณต้องการ type signature ที่แน่นอนของ defineToolPlugin, definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (แบบเต็มเทียบกับการตั้งค่าเทียบกับข้อมูลเมตา CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้น
sidebarTitle: Entry Points
summary: ข้อมูลอ้างอิงสำหรับ defineToolPlugin, definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นของ Plugin
x-i18n:
    generated_at: "2026-07-16T19:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

ทุก Plugin จะส่งออกออบเจ็กต์รายการเริ่มต้น SDK มีตัวช่วยสำหรับ
แต่ละรูปแบบรายการ ได้แก่ `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`

<Tip>
  **กำลังมองหาคำแนะนำแบบทีละขั้นตอนอยู่ใช่ไหม** ดู [Plugin เครื่องมือ](/th/plugins/tool-plugins),
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) หรือ
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับคู่มือแบบทีละขั้นตอน
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
- `runtimeExtensions` และ `runtimeSetupEntry` เหมาะกว่าสำหรับแพ็กเกจ
  ที่ติดตั้งแล้ว เพราะช่วยให้แพ็กเกจ npm ข้ามการคอมไพล์ TypeScript ขณะรันไทม์ได้
- `runtimeExtensions` หากมี ต้องมีจำนวนสมาชิกในอาร์เรย์เท่ากับ `extensions`
  (รายการจับคู่กันตามตำแหน่ง) `runtimeSetupEntry` ต้องใช้ร่วมกับ `setupEntry`
- หากมีการประกาศอาร์ติแฟกต์ `runtimeExtensions`/`runtimeSetupEntry` แต่
  ไม่พบ การติดตั้ง/การค้นหาจะล้มเหลวพร้อมข้อผิดพลาดด้านการจัดแพ็กเกจ OpenClaw จะไม่
  ย้อนกลับไปใช้ซอร์สโดยอัตโนมัติ การย้อนกลับไปใช้ซอร์ส (ด้านล่าง) ใช้เฉพาะเมื่อไม่ได้
  ประกาศรายการรันไทม์ไว้เลย
- หากแพ็กเกจที่ติดตั้งประกาศเฉพาะรายการซอร์ส TypeScript OpenClaw
  จะค้นหารายการคู่กันที่บิลด์แล้วเป็น `dist/*.js` (หรือ `.mjs`/`.cjs`) และใช้รายการนั้น
  มิฉะนั้นจะย้อนกลับไปใช้ซอร์ส TypeScript
- พาธของรายการทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin รายการ
  รันไทม์และรายการคู่กันแบบ JavaScript ที่บิลด์แล้วซึ่งอนุมานขึ้น ไม่ได้ทำให้พาธซอร์ส `extensions` หรือ
  `setupEntry` ที่ออกนอกไดเรกทอรีกลายเป็นพาธที่ใช้ได้

## `defineToolPlugin`

**นำเข้า:** `openclaw/plugin-sdk/tool-plugin`

สำหรับ Plugin ที่เพิ่มเฉพาะเครื่องมือของเอเจนต์ ช่วยให้ซอร์สมีขนาดเล็ก อนุมานประเภทของการกำหนดค่า
และพารามิเตอร์เครื่องมือจากสคีมา TypeBox ห่อค่าที่ส่งคืนแบบธรรมดาให้อยู่ใน
รูปแบบผลลัพธ์เครื่องมือของ OpenClaw และเปิดเผยข้อมูลเมตาแบบคงที่ซึ่ง
`openclaw plugins build` จะเขียนลงในไฟล์รายการ Plugin (`contracts.tools`,
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
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` เป็นตัวเลือก หากละไว้จะใช้สคีมาออบเจ็กต์ว่างที่เข้มงวด
  (ไฟล์รายการที่สร้างขึ้นยังคงมี `configSchema`)
- `execute` ส่งคืนสตริงธรรมดาหรือค่าที่แปลงเป็น JSON ได้ ตัวช่วย
  จะห่อค่านั้นเป็นผลลัพธ์เครื่องมือแบบข้อความ โดยตั้งค่า `details` เป็นค่าที่ส่งคืน
  เดิม (ยังไม่แปลงเป็นสตริง)
- สำหรับผลลัพธ์เครื่องมือแบบกำหนดเอง `openclaw/plugin-sdk/tool-results` จะส่งออก
  `textResult` และ `jsonResult`
- ชื่อเครื่องมือเป็นค่าคงที่ ดังนั้น `openclaw plugins build` จึงอนุมาน
  `contracts.tools` จากเครื่องมือที่ประกาศไว้ โดยไม่ต้องทำสำเนาชื่อด้วยตนเอง
- การโหลดขณะรันไทม์ยังคงเข้มงวด: Plugin ที่ติดตั้งแล้วยังคงต้องมี
  `openclaw.plugin.json` และ `package.json` `openclaw.extensions` OpenClaw
  จะไม่เรียกใช้โค้ด Plugin เพื่ออนุมานข้อมูลไฟล์รายการที่ขาดหายไป

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
| `kind`                    | `string` (เลิกแนะนำให้ใช้แล้ว โปรดดูด้านล่าง)                                 | ไม่       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่       | สคีมาออบเจ็กต์ว่าง |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | ไม่       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | ไม่       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | ไม่       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | ใช่      | -                   |

- `id` ต้องตรงกับไฟล์รายการ `openclaw.plugin.json` ของคุณ
- แค็ตตาล็อกเซสชันภายนอกใช้
  `openclaw/plugin-sdk/session-catalog` และ
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`
  คอร์เป็นเจ้าของเมธอด Gateway `sessions.catalog.*` ส่วนผู้ให้บริการจะส่งคืนโฮสต์
  เซสชัน และการฉายภาพบทถอดเสียงที่ปรับให้อยู่ในรูปแบบมาตรฐาน โดยไม่ต้องลงทะเบียน RPC
- `kind` เลิกแนะนำให้ใช้แล้ว: ให้ประกาศสล็อตแบบเฉพาะ (`"memory"` หรือ
  `"context-engine"`) ในฟิลด์ `kind` ของไฟล์รายการ `openclaw.plugin.json`
  แทน `kind` ของรายการรันไทม์ยังคงมีไว้เป็นทางเลือกสำรองด้านความเข้ากันได้สำหรับ
  Plugin รุ่นเก่าเท่านั้น
- `configSchema` สามารถเป็นฟังก์ชันเพื่อประเมินค่าแบบหน่วงเวลาได้ OpenClaw จะประมวลผลและ
  จดจำสคีมาเมื่อเข้าถึงครั้งแรก ดังนั้นตัวสร้างสคีมาที่ใช้ทรัพยากรมากจะทำงาน
  เพียงครั้งเดียว
- ตัวอธิบาย `nodeHostCommands` สามารถกำหนด `isAvailable({ config, env })` ได้
  การส่งคืน `false` จะละเว้นคำสั่งนั้นและความสามารถของคำสั่งออกจากการประกาศ Gateway
  ของ Node แบบไม่มีส่วนติดต่อผู้ใช้ OpenClaw จะประเมินค่ากับการกำหนดค่าการเริ่มทำงานภายใน
  Node ส่วนตัวจัดการคำสั่งยังคงควรตรวจสอบความพร้อมใช้งานเมื่อ
  ถูกเรียกใช้

## `defineChannelPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` ด้วยการเชื่อมต่อเฉพาะช่องทาง: เรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผยจุดเชื่อมข้อมูลเมตา CLI
สำหรับความช่วยเหลือระดับรากซึ่งเป็นตัวเลือก และจำกัด `registerFull` ตามโหมดการลงทะเบียน

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

คอลแบ็กจะทำงานตามโหมดการลงทะเบียน (ดูตารางฉบับเต็มใน
[โหมดการลงทะเบียน](#registration-mode)):

- `setRuntime` ทำงานในทุกโหมดยกเว้น `"cli-metadata"` และ
  `"tool-discovery"` จัดเก็บการอ้างอิงรันไทม์ที่นี่ โดยทั่วไปผ่าน
  `createPluginRuntimeStore`
- `registerCliMetadata` ทำงานสำหรับ `"cli-metadata"`, `"discovery"` และ
  `"full"` ใช้เป็นตำแหน่งหลักสำหรับตัวอธิบาย CLI ที่ช่องทางเป็นเจ้าของ
  เพื่อให้ความช่วยเหลือระดับรากไม่ทำให้เกิดการเปิดใช้งาน สแนปช็อตการค้นพบมีข้อมูลเมตา
  คำสั่งแบบคงที่ และการลงทะเบียน CLI ปกติยังคงเข้ากันได้กับการโหลด
  Plugin แบบเต็ม
- `registerFull` ทำงานเฉพาะสำหรับ `"full"` และ `"tool-discovery"` สำหรับ
  `"tool-discovery"` จะทำงาน _แทน_ การลงทะเบียนช่องทาง: OpenClaw
  จะข้าม `registerChannel`/`setRuntime` ทั้งหมดและเรียกเฉพาะ
  `registerFull` ดังนั้นการลงทะเบียนผู้ให้บริการ/เครื่องมือใด ๆ ที่ช่องทางของคุณต้องใช้สำหรับ
  การค้นหาหรือการเรียกใช้เครื่องมือแบบสแตนด์อโลน ต้องอยู่ที่นั่น ไม่ใช่อยู่หลัง
  การตั้งค่าช่องทางตามปกติ
- การลงทะเบียนเพื่อการค้นพบไม่ทำให้เกิดการเปิดใช้งาน แต่ไม่ได้หมายความว่าไม่มีการนำเข้า: OpenClaw อาจ
  ประเมินรายการ Plugin ที่เชื่อถือได้และโมดูล Plugin ช่องทางเพื่อสร้าง
  สแนปช็อต ให้การนำเข้าระดับบนสุดปราศจากผลข้างเคียง และวางซ็อกเก็ต
  ไคลเอนต์ เวิร์กเกอร์ และบริการไว้หลังพาธที่ใช้เฉพาะ `"full"`
- เช่นเดียวกับ `definePluginEntry` `configSchema` สามารถเป็นแฟกทอรีแบบหน่วงเวลาได้ OpenClaw
  จะจดจำสคีมาที่ประมวลผลแล้วเมื่อเข้าถึงครั้งแรก

การลงทะเบียน CLI:

- ใช้ `api.registerCli(..., { descriptors: [...] })` สำหรับคำสั่ง
  CLI ระดับรากที่ Plugin เป็นเจ้าของ ซึ่งต้องการโหลดแบบหน่วงเวลาโดยไม่หายไปจากโครงสร้าง
  การแยกวิเคราะห์ CLI ระดับราก ชื่อตัวอธิบายต้องตรงกับตัวอักษร ตัวเลข ยัติภังค์ และ
  ขีดล่าง โดยขึ้นต้นด้วยตัวอักษรหรือตัวเลข OpenClaw จะปฏิเสธรูปแบบอื่น
  และลบลำดับควบคุมเทอร์มินัลออกจากคำอธิบายก่อน
  แสดงผลความช่วยเหลือ ครอบคลุมรากของคำสั่งระดับบนสุดทุกคำสั่งที่ตัวลงทะเบียนเปิดเผย
  การใช้ `commands` เพียงอย่างเดียวยังคงอยู่ในพาธความเข้ากันได้แบบโหลดทันที
- ใช้ `api.registerNodeCliFeature(...)` สำหรับคำสั่งฟีเจอร์ของ Node ที่จับคู่กัน เพื่อให้
  คำสั่งเหล่านั้นอยู่ภายใต้ `openclaw nodes` (เทียบเท่ากับ
  `registerCli(registrar, { parentPath: ["nodes"], ... })`)
- สำหรับคำสั่ง Plugin แบบซ้อนอื่น ๆ ให้เพิ่ม `parentPath` และลงทะเบียนคำสั่ง
  บนออบเจ็กต์ `program` ที่ส่งให้ตัวลงทะเบียน OpenClaw จะประมวลผลออบเจ็กต์นั้นเป็น
  คำสั่งแม่ก่อนเรียก Plugin
- สำหรับ Plugin ช่องทาง ให้ลงทะเบียนตัวอธิบาย CLI จาก `registerCliMetadata`
  และให้ `registerFull` มุ่งเน้นเฉพาะงานขณะรันไทม์
- หาก `registerFull` ลงทะเบียนเมธอด RPC ของ Gateway ด้วย ให้เก็บเมธอดเหล่านั้นไว้ภายใต้
  คำนำหน้าเฉพาะ Plugin เนมสเปซผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`,
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

OpenClaw โหลดรายการนี้แทนรายการแบบเต็มเมื่อช่องถูกปิดใช้งาน
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้งานการโหลดแบบเลื่อนเวลา ดูว่าเรื่องนี้มีความสำคัญเมื่อใดได้ที่
[การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry)

ใช้ `defineSetupPluginEntry(...)` ร่วมกับกลุ่มตัวช่วยการตั้งค่าเฉพาะทาง:

| การนำเข้า                              | ใช้สำหรับ                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | ตัวช่วยการตั้งค่าที่ปลอดภัยต่อรันไทม์: `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ปลอดภัยต่อการนำเข้า, เอาต์พุตหมายเหตุการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าแบบมอบหมาย |
| `openclaw/plugin-sdk/channel-setup` | พื้นผิวการตั้งค่าสำหรับการติดตั้งแบบเลือกได้                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | ตัวช่วยสำหรับ CLI การตั้งค่า/ติดตั้ง ไฟล์เก็บถาวร และเอกสาร                                                                                                                                       |

เก็บ SDK ขนาดใหญ่ การลงทะเบียน CLI และบริการรันไทม์ที่ทำงานระยะยาวไว้ใน
รายการแบบเต็ม

ช่องในเวิร์กสเปซที่รวมมากับระบบซึ่งแยกพื้นผิวการตั้งค่าและรันไทม์สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ วิธีนี้ช่วยให้รายการ
การตั้งค่ายังคงส่งออก Plugin/ข้อมูลลับที่ปลอดภัยต่อการตั้งค่า พร้อมกับเปิดเผยตัวตั้งค่ารันไทม์:

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
        /* เส้นทางที่ปลอดภัยต่อการตั้งค่า */
      },
    });
  },
});
```

ใช้วิธีนี้เฉพาะเมื่อขั้นตอนการตั้งค่าจำเป็นต้องมีตัวตั้งค่ารันไทม์ขนาดเล็กหรือ
พื้นผิว Gateway ที่ปลอดภัยต่อการตั้งค่าก่อนโหลดรายการช่องแบบเต็มจริง ๆ
`registerSetupRuntime` ทำงานเฉพาะการโหลดแบบ `"setup-runtime"` เท่านั้น ควรจำกัดไว้
เฉพาะเส้นทางหรือเมธอดสำหรับการกำหนดค่าที่ต้องมีอยู่ก่อนการเปิดใช้งาน
แบบเต็มที่เลื่อนเวลาไว้

## โหมดการลงทะเบียน

`api.registrationMode` แจ้งให้ Plugin ทราบว่าโหลดด้วยวิธีใด:

| โหมด               | เมื่อใด                                               | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | การเริ่มต้น Gateway ตามปกติ                             | ทุกอย่าง                                                                                                              |
| `"discovery"`      | การค้นหาความสามารถแบบอ่านอย่างเดียว                     | การลงทะเบียนช่องพร้อมตัวอธิบาย CLI แบบคงที่ โค้ดรายการอาจโหลดได้ แต่ให้ข้ามซ็อกเก็ต เวิร์กเกอร์ ไคลเอนต์ และบริการ |
| `"tool-discovery"` | การโหลดแบบจำกัดขอบเขตเพื่อแสดงรายการหรือเรียกใช้เครื่องมือของ Plugin ที่ระบุ | ลงทะเบียนเฉพาะความสามารถ/เครื่องมือ โดยไม่เปิดใช้งานช่อง                                                                |
| `"setup-only"`     | ช่องที่ปิดใช้งาน/ยังไม่ได้กำหนดค่า                      | ลงทะเบียนช่องเท่านั้น                                                                                               |
| `"setup-runtime"`  | ขั้นตอนการตั้งค่าที่มีรันไทม์พร้อมใช้งาน                  | ลงทะเบียนช่องพร้อมเฉพาะรันไทม์ขนาดเล็กที่จำเป็นก่อนโหลดรายการแบบเต็ม                               |
| `"cli-metadata"`   | การเก็บข้อมูลช่วยเหลือระดับราก / เมทาดาทา CLI                   | ตัวอธิบาย CLI เท่านั้น                                                                                                    |

`defineChannelPluginEntry` จัดการการแบ่งนี้โดยอัตโนมัติ หากใช้
`definePluginEntry` โดยตรงกับช่อง ให้ตรวจสอบโหมดด้วยตนเองและจำไว้ว่า
`"tool-discovery"` จะข้ามการลงทะเบียนช่อง:

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
    // ลงทะเบียนเฉพาะพื้นผิวความสามารถ (ผู้ให้บริการ/เครื่องมือ) โดยไม่มีช่อง
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // การลงทะเบียนเฉพาะรันไทม์ที่มีภาระหนัก
  api.registerService(/* ... */);
}
```

บริการที่ทำงานระยะยาวอาจส่งเหตุการณ์การทำให้ใช้ไม่ได้หรือเหตุการณ์วงจรชีวิตขนาดเล็กผ่าน
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
ส่วนตัวพิมพ์เล็กหนึ่งส่วน เพย์โหลดต้องเป็น JSON ที่มีขนาดจำกัด และขอบเขตต้องเป็น
`operator.read`, `operator.write` หรือ `operator.admin` ตัวส่งเหตุการณ์มีอยู่เฉพาะ
ตลอดอายุการทำงานของบริการ และจะถูกเพิกถอนหลังหยุดทำงานหรือเริ่มต้นล้มเหลว ควรใช้
เพย์โหลดเวอร์ชันหรือการทำให้ใช้ไม่ได้แทนเรคคอร์ดแบบเต็ม เพื่อให้ไคลเอนต์ที่ได้รับอนุญาตอ่าน
สถานะมาตรฐานอีกครั้งผ่านเมธอด Gateway ที่จำกัดขอบเขตของ Plugin

โหมดการค้นหาสร้างสแนปช็อตรีจิสทรีที่ไม่เปิดใช้งาน แต่ยังอาจ
ประเมินรายการ Plugin และออบเจ็กต์ Plugin ของช่อง เพื่อให้ OpenClaw
ลงทะเบียนความสามารถของช่องและตัวอธิบาย CLI แบบคงที่ได้ ให้ถือว่าการประเมินโมดูล
ในโหมดการค้นหาเชื่อถือได้แต่ต้องมีภาระเบา: ห้ามมีไคลเอนต์เครือข่าย
โพรเซสย่อย ลิสเทนเนอร์ การเชื่อมต่อฐานข้อมูล เวิร์กเกอร์เบื้องหลัง
การอ่านข้อมูลรับรอง หรือผลข้างเคียงอื่น ๆ ของรันไทม์ที่ทำงานอยู่ในระดับบนสุด

ให้ถือว่า `"setup-runtime"` เป็นช่วงเวลาที่พื้นผิวการเริ่มต้นเฉพาะการตั้งค่าต้อง
มีอยู่โดยไม่เข้าสู่รันไทม์ช่องแบบเต็มที่รวมมากับระบบซ้ำ สิ่งที่เหมาะสมได้แก่
การลงทะเบียนช่อง เส้นทาง HTTP ที่ปลอดภัยต่อการตั้งค่า เมธอด Gateway ที่ปลอดภัยต่อการตั้งค่า
และตัวช่วยการตั้งค่าแบบมอบหมาย บริการเบื้องหลังที่มีภาระหนัก ตัวลงทะเบียน CLI และ
การเริ่มต้น SDK ของผู้ให้บริการ/ไคลเอนต์ยังคงควรอยู่ใน `"full"`

## รูปแบบ Plugin

OpenClaw จำแนก Plugin ที่โหลดตามลักษณะการลงทะเบียน:

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
- [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup) - แมนิเฟสต์ รายการการตั้งค่า การโหลดแบบเลื่อนเวลา
- [Plugin ช่อง](/th/plugins/sdk-channel-plugins) - การสร้างออบเจ็กต์ `ChannelPlugin`
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การลงทะเบียนผู้ให้บริการและฮุก
