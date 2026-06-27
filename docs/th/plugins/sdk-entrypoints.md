---
read_when:
    - คุณต้องมีลายเซ็นชนิดข้อมูลที่แน่นอนของ defineToolPlugin, definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (full เทียบกับ setup เทียบกับข้อมูลเมตาของ CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้น
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ defineToolPlugin, definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเข้าใช้งานของ Plugin
x-i18n:
    generated_at: "2026-06-27T18:07:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Plugin ทุกตัวส่งออกออบเจ็กต์ entry เริ่มต้น SDK มีตัวช่วยสำหรับ
สร้างออบเจ็กต์เหล่านี้

สำหรับ Plugin ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลด runtime ไปยัง
JavaScript ที่ build แล้วเมื่อมี:

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

`extensions` และ `setupEntry` ยังคงเป็น source entry ที่ใช้ได้สำหรับการพัฒนา
ใน workspace และ git checkout ส่วน `runtimeExtensions` และ `runtimeSetupEntry`
เป็นตัวเลือกที่แนะนำเมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm
หลีกเลี่ยงการ compile TypeScript ตอน runtime ได้ ต้องระบุ runtime entries
อย่างชัดเจน: `runtimeSetupEntry` ต้องมี `setupEntry` และ artifact ของ
`runtimeExtensions` หรือ `runtimeSetupEntry` ที่หายไปจะทำให้ install/discovery
ล้มเหลวแทนที่จะ fallback ไปยัง source อย่างเงียบๆ หากแพ็กเกจที่ติดตั้งแล้ว
ประกาศเฉพาะ TypeScript source entry, OpenClaw จะใช้ peer `dist/*.js`
ที่ build แล้วซึ่งตรงกันเมื่อมีอยู่ จากนั้นจึง fallback ไปยัง TypeScript source

เส้นทาง entry ทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin เท่านั้น Runtime entries
และ inferred built JavaScript peers ไม่ทำให้ source path ของ `extensions` หรือ
`setupEntry` ที่หลุดออกนอกแพ็กเกจกลายเป็นเส้นทางที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบ walkthrough อยู่หรือไม่** ดู [Tool Plugins](/th/plugins/tool-plugins),
  [Channel Plugins](/th/plugins/sdk-channel-plugins), หรือ
  [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือแบบทีละขั้นตอน
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

สำหรับ Plugin แบบง่ายที่เพิ่มเฉพาะเครื่องมือของ agent เท่านั้น `defineToolPlugin` ช่วยให้
source สำหรับเขียนมีขนาดเล็ก, infer ประเภท config และพารามิเตอร์เครื่องมือจาก schema ของ TypeBox,
ห่อ return value ธรรมดาให้อยู่ในรูปแบบ tool-result ของ OpenClaw, และ
เปิดเผย metadata แบบ static ที่ `openclaw plugins build` เขียนลงใน manifest ของ Plugin

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

- `configSchema` เป็นตัวเลือก หากละไว้ OpenClaw จะใช้ schema วัตถุว่างแบบเข้มงวด
  และ manifest ที่สร้างขึ้นจะยังรวม `configSchema`
- `execute` ส่งคืน string ธรรมดาหรือค่าที่ serialize เป็น JSON ได้ ตัวช่วยจะห่อ
  ค่านั้นเป็นผลลัพธ์เครื่องมือแบบ text พร้อม `details`
- ชื่อเครื่องมือเป็นแบบ static `openclaw plugins build` derive `contracts.tools`
  จากเครื่องมือที่ประกาศไว้ ดังนั้นผู้เขียนไม่ต้องทำชื่อซ้ำด้วยตนเอง
- การโหลด runtime ยังคงเข้มงวด Plugin ที่ติดตั้งแล้วยังต้องมี
  `openclaw.plugin.json` และ `package.json` `openclaw.extensions`; OpenClaw
  จะไม่ execute โค้ด Plugin เพื่อ infer ข้อมูล manifest ที่ขาดหายไป

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ provider plugins, tool plugins ขั้นสูง, hook plugins, และทุกอย่างที่
**ไม่ใช่** ช่องทางส่งข้อความ

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| ฟิลด์          | ประเภท                                                           | จำเป็น | ค่าเริ่มต้น          |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`           | `string`                                                         | ใช่    | -                   |
| `name`         | `string`                                                         | ใช่    | -                   |
| `description`  | `string`                                                         | ใช่    | -                   |
| `kind`         | `string`                                                         | ไม่    | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | Schema วัตถุว่าง |
| `register`     | `(api: OpenClawPluginApi) => void`                               | ใช่    | -                   |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับช่องแบบ exclusive: `"memory"` หรือ `"context-engine"`
- `configSchema` เป็น function ได้เพื่อการประเมินแบบ lazy
- OpenClaw resolve และ memoize schema นั้นในการเข้าถึงครั้งแรก ดังนั้นตัวสร้าง schema
  ที่มีค่าใช้จ่ายสูงจะทำงานเพียงครั้งเดียว

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` พร้อม wiring เฉพาะ channel เรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ, เปิดเผย seam ของ metadata CLI
สำหรับ root-help ที่เป็นตัวเลือก, และ gate `registerFull` ตามโหมดการลงทะเบียน

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

| ฟิลด์                | ประเภท                                                           | จำเป็น | ค่าเริ่มต้น          |
| -------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                 | `string`                                                         | ใช่    | -                   |
| `name`               | `string`                                                         | ใช่    | -                   |
| `description`        | `string`                                                         | ใช่    | -                   |
| `plugin`             | `ChannelPlugin`                                                  | ใช่    | -                   |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | Schema วัตถุว่าง |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | ไม่    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                              | ไม่    | -                   |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                               | ไม่    | -                   |

- `setRuntime` ถูกเรียกระหว่างการลงทะเบียน เพื่อให้คุณเก็บ reference ของ runtime ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) และจะถูกข้ามระหว่างการ capture metadata ของ CLI
- `registerCliMetadata` ทำงานระหว่าง `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, และ
  `api.registrationMode === "full"`
  ใช้เป็นตำแหน่ง canonical สำหรับ CLI descriptors ที่ channel เป็นเจ้าของ เพื่อให้ root help
  ไม่กระตุ้นการเปิดใช้งาน, discovery snapshots รวม metadata คำสั่งแบบ static, และ
  การลงทะเบียนคำสั่ง CLI ปกติยังเข้ากันได้กับการโหลด Plugin แบบเต็ม
- การลงทะเบียน discovery เป็นแบบไม่กระตุ้นการเปิดใช้งาน ไม่ใช่แบบไม่ import OpenClaw อาจ
  ประเมิน entry ของ Plugin ที่เชื่อถือได้และโมดูล channel plugin เพื่อสร้าง
  snapshot ดังนั้นควรรักษา top-level imports ให้ไม่มี side effect และวาง sockets,
  clients, workers, และ services ไว้หลัง path ที่ใช้เฉพาะ `"full"`
- `registerFull` ทำงานเฉพาะเมื่อ `api.registrationMode === "full"` และจะถูกข้าม
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry`, `configSchema` เป็น lazy factory ได้ และ OpenClaw
  memoize schema ที่ resolve แล้วในการเข้าถึงครั้งแรก
- สำหรับคำสั่ง root CLI ที่ Plugin เป็นเจ้าของ ให้เลือกใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคง lazy-loaded โดยไม่หายไปจาก
  parse tree ของ root CLI สำหรับคำสั่ง feature แบบ paired-node ให้เลือกใช้
  `api.registerNodeCliFeature(...)` เพื่อให้คำสั่งไปอยู่ภายใต้ `openclaw nodes`
  สำหรับคำสั่ง Plugin แบบซ้อนอื่นๆ ให้เพิ่ม `parentPath` และลงทะเบียนคำสั่งบน
  ออบเจ็กต์ `program` ที่ส่งให้ registrar; OpenClaw จะ resolve ไปยัง
  parent command ก่อนเรียก Plugin สำหรับ channel plugins ให้เลือก
  ลงทะเบียน descriptors เหล่านั้นจาก `registerCliMetadata(...)` และให้
  `registerFull(...)` มุ่งเน้นงานเฉพาะ runtime
- หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ด้วย ให้เก็บไว้บน
  prefix เฉพาะ Plugin namespace สำหรับ core admin ที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูก coerce เป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบ lightweight ส่งคืนเพียง `{ plugin }` โดยไม่มี
runtime หรือ CLI wiring

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw โหลดสิ่งนี้แทน entry แบบเต็มเมื่อ channel ถูกปิดใช้งาน,
ยังไม่ได้กำหนดค่า, หรือเมื่อเปิดใช้งาน deferred loading ดู
[Setup and Config](/th/plugins/sdk-setup#setup-entry) เพื่อดูว่าเรื่องนี้สำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับกลุ่มตัวช่วย setup
แบบแคบ:

- `openclaw/plugin-sdk/setup-runtime` สำหรับตัวช่วย setup ที่ปลอดภัยสำหรับ runtime เช่น
  `createSetupTranslator`, setup patch adapters ที่ import-safe, output แบบ lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, และ delegated setup proxies
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิว setup ของ optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับตัวช่วย CLI/archive/docs ด้าน setup/install

เก็บ SDK หนักๆ, การลงทะเบียน CLI, และบริการ runtime ที่มีอายุยาวไว้ใน entry
แบบเต็ม

Workspace channels ที่ bundle มาด้วยซึ่งแยกพื้นผิว setup และ runtime สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ contract นั้นช่วยให้
setup entry เก็บ exports ของ plugin/secrets ที่ setup-safe ได้ ขณะยังเปิดเผย
runtime setter:

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
        /* setup-safe route */
      },
    });
  },
});
```

ใช้ bundled contract นั้นเฉพาะเมื่อ flow ของ setup ต้องการ runtime
setter แบบ lightweight หรือพื้นผิว Gateway ที่ setup-safe ก่อนที่ channel entry แบบเต็มจะโหลดจริงๆ
`registerSetupRuntime` ทำงานเฉพาะสำหรับการโหลด `"setup-runtime"` เท่านั้น; จำกัดไว้ที่
route หรือ method เฉพาะ config ที่ต้องมีอยู่ก่อนการเปิดใช้งานแบบเต็มที่ defer ไว้

## โหมดการลงทะเบียน

`api.registrationMode` บอก Plugin ของคุณว่าถูกโหลดอย่างไร:

| โหมด              | เมื่อใด                              | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น Gateway ตามปกติ            | ทุกอย่าง                                                                                                              |
| `"discovery"`     | การค้นหาความสามารถแบบอ่านอย่างเดียว    | การลงทะเบียนช่องทางพร้อมตัวอธิบาย CLI แบบคงที่; โค้ดจุดเข้าอาจโหลดได้ แต่ให้ข้ามซ็อกเก็ต, เวิร์กเกอร์, ไคลเอนต์ และบริการ |
| `"setup-only"`    | ช่องทางที่ปิดใช้งาน/ยังไม่ได้กำหนดค่า     | การลงทะเบียนช่องทางเท่านั้น                                                                                               |
| `"setup-runtime"` | โฟลว์การตั้งค่าที่มีรันไทม์พร้อมใช้งาน | การลงทะเบียนช่องทางพร้อมเฉพาะรันไทม์ขนาดเบาที่จำเป็นก่อนโหลดจุดเข้าแบบเต็ม                               |
| `"cli-metadata"`  | การจับข้อมูลวิธีใช้รูท / เมทาดาทา CLI  | ตัวอธิบาย CLI เท่านั้น                                                                                                    |

`defineChannelPluginEntry` จัดการการแยกนี้โดยอัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงสำหรับช่องทาง ให้ตรวจสอบโหมดเอง:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

โหมด Discovery สร้างสแนปช็อตรีจิสทรีที่ไม่ทำให้เกิดการเปิดใช้งาน โดยยังอาจประเมิน
จุดเข้า Plugin และออบเจกต์ Plugin ของช่องทาง เพื่อให้ OpenClaw สามารถลงทะเบียน
ความสามารถของช่องทางและตัวอธิบาย CLI แบบคงที่ได้ ให้ถือว่าการประเมินโมดูลใน Discovery
เชื่อถือได้แต่ต้องเบา: ไม่มีไคลเอนต์เครือข่าย, โพรเซสย่อย, ตัวรับฟัง, การเชื่อมต่อฐานข้อมูล,
เวิร์กเกอร์เบื้องหลัง, การอ่านข้อมูลรับรอง หรือผลข้างเคียงอื่นของรันไทม์จริงที่ระดับบนสุด

ให้ถือว่า `"setup-runtime"` เป็นช่วงเวลาที่พื้นผิวการเริ่มต้นแบบตั้งค่าเท่านั้นต้อง
มีอยู่ได้โดยไม่ย้อนเข้าไปยังรันไทม์ช่องทางแบบบันเดิลเต็มอีกครั้ง สิ่งที่เหมาะสมคือ
การลงทะเบียนช่องทาง, เส้นทาง HTTP ที่ปลอดภัยสำหรับการตั้งค่า, เมธอด Gateway ที่ปลอดภัยสำหรับการตั้งค่า และ
ตัวช่วยตั้งค่าที่มอบหมายต่อไป ส่วนบริการเบื้องหลังขนาดใหญ่, ตัวลงทะเบียน CLI และ
การบูตสแตรป SDK ของผู้ให้บริการ/ไคลเอนต์ยังคงอยู่ใน `"full"`

สำหรับตัวลงทะเบียน CLI โดยเฉพาะ:

- ใช้ `descriptors` เมื่อตัวลงทะเบียนเป็นเจ้าของคำสั่งรูทหนึ่งรายการขึ้นไป และคุณ
  ต้องการให้ OpenClaw โหลดโมดูล CLI จริงแบบ lazy-load เมื่อถูกเรียกใช้ครั้งแรก
- ตรวจสอบให้แน่ใจว่าตัวอธิบายเหล่านั้นครอบคลุมรูทคำสั่งระดับบนสุดทุกตัวที่
  ตัวลงทะเบียนเปิดเผย
- จำกัดชื่อคำสั่งของตัวอธิบายให้มีเฉพาะตัวอักษร, ตัวเลข, ยัติภังค์ และขีดล่าง
  โดยขึ้นต้นด้วยตัวอักษรหรือตัวเลข; OpenClaw จะปฏิเสธชื่อตัวอธิบายที่อยู่นอก
  รูปแบบนั้น และจะตัดลำดับควบคุมเทอร์มินัลออกจากคำอธิบายก่อน
  แสดงวิธีใช้
- ใช้ `commands` เพียงอย่างเดียวเฉพาะกับเส้นทางความเข้ากันได้แบบ eager เท่านั้น

## รูปแบบ Plugin

OpenClaw จำแนก Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                 | คำอธิบาย                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ประเภทความสามารถเดียว (เช่น เฉพาะผู้ให้บริการ)           |
| **hybrid-capability** | หลายประเภทความสามารถ (เช่น ผู้ให้บริการ + เสียงพูด) |
| **hook-only**         | เฉพาะ hooks ไม่มีความสามารถ                        |
| **non-capability**    | เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ        |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) - API การลงทะเบียนและข้อมูลอ้างอิง subpath
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime) - `api.runtime` และ `createPluginRuntimeStore`
- [การตั้งค่าและ Config](/th/plugins/sdk-setup) - manifest, จุดเข้าการตั้งค่า, การโหลดแบบเลื่อนเวลา
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้างออบเจกต์ `ChannelPlugin`
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การลงทะเบียนผู้ให้บริการและ hooks
