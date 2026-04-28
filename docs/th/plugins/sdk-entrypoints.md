---
read_when:
- คุณต้องการลายเซ็นชนิดข้อมูลที่แน่นอนของ `definePluginEntry` หรือ `defineChannelPluginEntry`
- คุณต้องการเข้าใจโหมดการลงทะเบียน (full เทียบกับ setup เทียบกับ CLI metadata)
- You are looking up entry point options
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ `definePluginEntry`, `defineChannelPluginEntry` และ `defineSetupPluginEntry`
title: จุดเริ่มต้นของ Plugin
x-i18n:
  generated_at: '2026-04-25T13:54:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
  source_path: plugins/sdk-entrypoints.md
  workflow: 15
---

ทุก Plugin จะ export default entry object หนึ่งตัว SDK มี helper สามตัวสำหรับ
สร้างมัน

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

`extensions` และ `setupEntry` ยังคงเป็น source entry ที่ใช้ได้สำหรับการพัฒนาใน workspace และ git
checkout ส่วน `runtimeExtensions` และ `runtimeSetupEntry` จะถูกเลือกใช้ก่อน
เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm ไม่ต้องคอมไพล์
TypeScript ตอนรัน หากแพ็กเกจที่ติดตั้งแล้วประกาศเพียง source entry แบบ TypeScript
OpenClaw จะใช้ peer `dist/*.js` ที่ build แล้วและตรงกันเมื่อมี จากนั้นจึง fallback ไปยัง source TypeScript

พาธของ entry ทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin เท่านั้น runtime entries
และ built JavaScript peers ที่อนุมานได้จะไม่ทำให้ source path ของ `extensions` หรือ
`setupEntry` ที่หนีออกนอกแพ็กเกจกลายเป็นพาธที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบทีละขั้นตอนอยู่หรือไม่?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins)
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ provider plugins, tool plugins, hook plugins และทุกอย่างที่ **ไม่ใช่**
messaging channel

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

| ฟิลด์          | ชนิดข้อมูล                                                        | จำเป็น | ค่าเริ่มต้น          |
| -------------- | ----------------------------------------------------------------- | ------ | -------------------- |
| `id`           | `string`                                                          | ใช่    | —                    |
| `name`         | `string`                                                          | ใช่    | —                    |
| `description`  | `string`                                                          | ใช่    | —                    |
| `kind`         | `string`                                                          | ไม่    | —                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema`  | ไม่    | empty object schema  |
| `register`     | `(api: OpenClawPluginApi) => void`                                | ใช่    | —                    |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับสล็อตแบบ exclusive: `"memory"` หรือ `"context-engine"`
- `configSchema` สามารถเป็นฟังก์ชันเพื่อประเมินค่าแบบ lazy ได้
- OpenClaw จะ resolve และ memoize schema นั้นเมื่อมีการเข้าถึงครั้งแรก ดังนั้นตัวสร้าง schema ที่มีต้นทุนสูง
  จะทำงานเพียงครั้งเดียว

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

ครอบ `definePluginEntry` ด้วยการเชื่อมต่อเฉพาะของ channel โดยจะเรียก
`api.registerChannel({ plugin })` อัตโนมัติ เปิด seam ของ CLI metadata สำหรับ root-help แบบไม่บังคับ
และ gate `registerFull` ตาม registration mode

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

| ฟิลด์                 | ชนิดข้อมูล                                                        | จำเป็น | ค่าเริ่มต้น          |
| --------------------- | ----------------------------------------------------------------- | ------ | -------------------- |
| `id`                  | `string`                                                          | ใช่    | —                    |
| `name`                | `string`                                                          | ใช่    | —                    |
| `description`         | `string`                                                          | ใช่    | —                    |
| `plugin`              | `ChannelPlugin`                                                   | ใช่    | —                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema`  | ไม่    | empty object schema  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                                | ไม่    | —                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                                | ไม่    | —                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                                | ไม่    | —                    |

- `setRuntime` จะถูกเรียกระหว่างการลงทะเบียน เพื่อให้คุณเก็บอ้างอิง runtime ไว้ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) มันจะถูกข้ามระหว่างการจับ CLI metadata
- `registerCliMetadata` จะทำงานเมื่อ `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` และ
  `api.registrationMode === "full"`
  ให้ใช้มันเป็นตำแหน่งหลักสำหรับ CLI descriptor ที่เป็นเจ้าของโดย channel เพื่อให้ root help
  ไม่กระตุ้นการทำงาน, snapshot ของ discovery รวม static command metadata และ
  การลงทะเบียนคำสั่ง CLI ปกติยังเข้ากันได้กับการโหลด Plugin แบบเต็ม
- การลงทะเบียนแบบ discovery ไม่กระตุ้นการทำงาน แต่ก็ไม่ได้ปลอด import ทั้งหมด OpenClaw อาจ
  ประเมิน trusted plugin entry และโมดูล channel plugin เพื่อสร้าง
  snapshot ดังนั้นให้คง top-level imports ให้ปราศจาก side effect และวาง sockets,
  clients, workers และ services ไว้หลังเส้นทางที่ใช้เฉพาะ `"full"`
- `registerFull` จะทำงานเฉพาะเมื่อ `api.registrationMode === "full"` มันจะถูกข้าม
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry`, `configSchema` สามารถเป็น lazy factory ได้ และ OpenClaw
  จะ memoize schema ที่ resolve แล้วในการเข้าถึงครั้งแรก
- สำหรับคำสั่ง root CLI ที่ Plugin เป็นเจ้าของ ให้เลือกใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคง lazy-loaded โดยไม่หายไปจาก
  parse tree ของ root CLI สำหรับ channel plugins ให้ลงทะเบียน descriptor เหล่านั้น
  จาก `registerCliMetadata(...)` และให้ `registerFull(...)` โฟกัสกับงานที่มี runtime เท่านั้น
- หาก `registerFull(...)` ลงทะเบียน gateway RPC methods ด้วย ให้คง methods เหล่านั้นไว้บน
  prefix ที่เฉพาะกับ Plugin namespace ของผู้ดูแลระบบแกนหลักที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับเป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบ lightweight โดยจะคืนค่าเพียง `{ plugin }` โดยไม่มี
การเชื่อม runtime หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw จะโหลดสิ่งนี้แทน full entry เมื่อ channel ถูกปิดใช้งาน
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้ deferred loading ดู
[Setup and Config](/th/plugins/sdk-setup#setup-entry) ว่าเรื่องนี้สำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับตระกูล helper สำหรับ setup แบบแคบ:

- `openclaw/plugin-sdk/setup-runtime` สำหรับ helper การตั้งค่าที่ปลอดภัยต่อ runtime เช่น
  import-safe setup patch adapters, เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ delegated setup proxies
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิวการตั้งค่า optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับ helper ด้าน setup/install CLI/archive/docs

ให้เก็บ SDK ขนาดใหญ่ การลงทะเบียน CLI และบริการ runtime แบบยาวนานไว้ใน full
entry

ช่องทาง bundled workspace ที่แยกพื้นผิว setup และ runtime สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ สัญญานี้ช่วยให้
setup entry คง export ของ plugin/secrets ที่ปลอดภัยต่อ setup ไว้ได้ ขณะเดียวกันยังเปิดเผย
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
});
```

ให้ใช้ bundled contract นี้เฉพาะเมื่อ flow ของ setup ต้องการ lightweight runtime
setter จริง ๆ ก่อนที่ full channel entry จะถูกโหลด

## Registration mode

`api.registrationMode` จะบอก Plugin ของคุณว่าถูกโหลดอย่างไร:

| โหมด              | เมื่อใด                            | ควรลงทะเบียนอะไร                                                                                                      |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น gateway ตามปกติ       | ทุกอย่าง                                                                                                               |
| `"discovery"`     | การค้นหาความสามารถแบบอ่านอย่างเดียว | การลงทะเบียน channel พร้อม static CLI descriptors; โค้ด entry อาจถูกโหลด แต่ให้ข้าม sockets, workers, clients และ services |
| `"setup-only"`    | channel ที่ปิดใช้/ยังไม่กำหนดค่า   | การลงทะเบียน channel เท่านั้น                                                                                         |
| `"setup-runtime"` | flow ของ setup ที่มี runtime พร้อม | การลงทะเบียน channel พร้อม lightweight runtime เท่าที่จำเป็นก่อนโหลด full entry                                      |
| `"cli-metadata"`  | การจับ root help / CLI metadata   | CLI descriptors เท่านั้น                                                                                               |

`defineChannelPluginEntry` จะจัดการการแยกนี้ให้อัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงสำหรับ channel ให้ตรวจสอบโหมดด้วยตัวเอง:

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

  // การลงทะเบียนหนักที่ใช้เฉพาะ runtime
  api.registerService(/* ... */);
}
```

โหมด discovery จะสร้าง snapshot ของ registry แบบไม่กระตุ้นการทำงาน มันอาจยังคงประเมิน
plugin entry และอ็อบเจ็กต์ channel plugin เพื่อให้ OpenClaw ลงทะเบียน
ความสามารถของ channel และ static CLI descriptors ได้ ให้ถือว่าการประเมินโมดูลใน discovery เป็นสิ่งที่เชื่อถือได้
แต่ต้อง lightweight: ห้ามมี network clients, subprocesses, listeners, database
connections, background workers, การอ่านข้อมูลรับรอง หรือ side effect ของ runtime แบบ live อื่น ๆ ที่ระดับ top-level

ให้ถือว่า `"setup-runtime"` เป็นหน้าต่างที่พื้นผิว startup แบบ setup-only ต้อง
มีอยู่ได้โดยไม่ re-enter ไปยัง bundled channel runtime แบบเต็ม สิ่งที่เหมาะคือ
การลงทะเบียน channel, HTTP routes ที่ปลอดภัยต่อ setup, gateway methods ที่ปลอดภัยต่อ setup และ
delegated setup helpers ส่วนบริการเบื้องหลังขนาดใหญ่, CLI registrars และ
การบูต provider/client SDK ยังควรอยู่ใน `"full"`

สำหรับ CLI registrars โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของ root commands ตั้งแต่หนึ่งคำสั่งขึ้นไป และคุณ
  ต้องการให้ OpenClaw lazy-load โมดูล CLI จริงเมื่อมีการเรียกครั้งแรก
- ตรวจสอบให้แน่ใจว่า descriptor เหล่านั้นครอบคลุมทุก top-level command root ที่
  registrar เปิดเผย
- ตั้งชื่อคำสั่งใน descriptor ให้มีเฉพาะตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง
  โดยเริ่มต้นด้วยตัวอักษรหรือตัวเลข OpenClaw จะปฏิเสธชื่อ descriptor ที่ไม่ตรง
  รูปแบบนี้ และจะลบ terminal control sequences ออกจากคำอธิบายก่อน
  เรนเดอร์ help
- ใช้ `commands` เพียงอย่างเดียวเฉพาะกับเส้นทางความเข้ากันได้แบบ eager

## รูปแบบของ Plugin

OpenClaw จัดประเภท Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                | คำอธิบาย                                            |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | ความสามารถชนิดเดียว (เช่น provider-only)            |
| **hybrid-capability** | หลายชนิดความสามารถ (เช่น provider + speech)         |
| **hook-only**         | มีแต่ hooks ไม่มี capabilities                      |
| **non-capability**    | มี tools/commands/services แต่ไม่มี capabilities    |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview) — API การลงทะเบียนและเอกสารอ้างอิง subpath
- [Runtime Helpers](/th/plugins/sdk-runtime) — `api.runtime` และ `createPluginRuntimeStore`
- [Setup and Config](/th/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้างอ็อบเจ็กต์ `ChannelPlugin`
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การลงทะเบียน provider และ hooks
