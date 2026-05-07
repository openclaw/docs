---
read_when:
    - คุณต้องใช้ลายเซ็นชนิดที่แน่นอนของ definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (เต็มรูปแบบ เทียบกับ การตั้งค่า เทียบกับเมทาดาทาของ CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้นการทำงาน
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นของ Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

ทุก Plugin ส่งออกออบเจ็กต์รายการเริ่มต้นแบบดีฟอลต์หนึ่งตัว SDK มีตัวช่วยสามตัวสำหรับ
สร้างออบเจ็กต์เหล่านี้

สำหรับ Plugin ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลดรันไทม์ไปยัง
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

`extensions` และ `setupEntry` ยังคงเป็นรายการเริ่มต้นซอร์สที่ใช้ได้สำหรับการพัฒนาใน workspace และการ checkout จาก git `runtimeExtensions` และ `runtimeSetupEntry` เป็นตัวเลือกที่แนะนำ
เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm ไม่ต้องคอมไพล์
TypeScript ขณะรันไทม์ จำเป็นต้องระบุรายการเริ่มต้นรันไทม์อย่างชัดเจน: `runtimeSetupEntry`
ต้องมี `setupEntry` และ artifact ของ `runtimeExtensions` หรือ `runtimeSetupEntry`
ที่หายไปจะทำให้การติดตั้ง/การค้นพบล้มเหลว แทนที่จะ fallback กลับไปยังซอร์สแบบเงียบ ๆ หาก
แพ็กเกจที่ติดตั้งแล้วประกาศเฉพาะรายการเริ่มต้นซอร์ส TypeScript OpenClaw จะใช้
peer `dist/*.js` ที่ build แล้วและตรงกันเมื่อมีอยู่ จากนั้นจึง fallback ไปยังซอร์ส
TypeScript

เส้นทางรายการเริ่มต้นทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin รายการเริ่มต้นรันไทม์
และ peer JavaScript ที่ build แล้วซึ่งอนุมานได้ ไม่ได้ทำให้เส้นทางซอร์ส `extensions` หรือ
`setupEntry` ที่หลุดออกนอกแพ็กเกจกลายเป็นเส้นทางที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบ walkthrough ใช่ไหม?** ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
  หรือ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) สำหรับคำแนะนำทีละขั้นตอน
</Tip>

## `definePluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ Plugin ผู้ให้บริการ, Plugin เครื่องมือ, Plugin hook และสิ่งใดก็ตามที่ **ไม่ใช่**
ช่องทางการส่งข้อความ

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

| ฟิลด์          | ประเภท                                                           | จำเป็น | ดีฟอลต์              |
| -------------- | ---------------------------------------------------------------- | ------ | -------------------- |
| `id`           | `string`                                                         | ใช่    | -                    |
| `name`         | `string`                                                         | ใช่    | -                    |
| `description`  | `string`                                                         | ใช่    | -                    |
| `kind`         | `string`                                                         | ไม่ใช่ | -                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่ใช่ | สคีมาออบเจ็กต์ว่าง |
| `register`     | `(api: OpenClawPluginApi) => void`                               | ใช่    | -                    |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับสล็อตแบบ exclusive: `"memory"` หรือ `"context-engine"`
- `configSchema` สามารถเป็นฟังก์ชันสำหรับการประเมินแบบ lazy ได้
- OpenClaw จะแก้ resolve และ memoize สคีมานั้นเมื่อเข้าถึงครั้งแรก ดังนั้นตัวสร้างสคีมาที่มีค่าใช้จ่ายสูง
  จะรันเพียงครั้งเดียว

## `defineChannelPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` ด้วยการ wiring เฉพาะช่องทาง เรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผย seam เมทาดาทา CLI สำหรับ root-help แบบไม่บังคับ
และ gate `registerFull` ตามโหมดการลงทะเบียน

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

| ฟิลด์                | ประเภท                                                           | จำเป็น | ดีฟอลต์              |
| -------------------- | ---------------------------------------------------------------- | ------ | -------------------- |
| `id`                 | `string`                                                         | ใช่    | -                    |
| `name`               | `string`                                                         | ใช่    | -                    |
| `description`        | `string`                                                         | ใช่    | -                    |
| `plugin`             | `ChannelPlugin`                                                  | ใช่    | -                    |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่ใช่ | สคีมาออบเจ็กต์ว่าง |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                               | ไม่ใช่ | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                              | ไม่ใช่ | -                    |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                               | ไม่ใช่ | -                    |

- `setRuntime` จะถูกเรียกระหว่างการลงทะเบียน เพื่อให้คุณเก็บการอ้างอิงรันไทม์ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) ระบบจะข้ามขั้นตอนนี้ระหว่างการจับข้อมูลเมทาดาทา CLI
- `registerCliMetadata` ทำงานระหว่าง `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, และ
  `api.registrationMode === "full"`
  ใช้เป็นตำแหน่ง canonical สำหรับ descriptor CLI ที่ช่องทางเป็นเจ้าของ เพื่อให้ help ของ root
  ไม่กระตุ้นการทำงาน, snapshot การค้นพบมีเมทาดาทาคำสั่งแบบคงที่ และ
  การลงทะเบียนคำสั่ง CLI ปกติยังคงเข้ากันได้กับการโหลด Plugin แบบเต็ม
- การลงทะเบียนเพื่อค้นพบเป็นแบบไม่กระตุ้นการทำงาน ไม่ใช่แบบไม่ import เลย OpenClaw อาจ
  ประเมินรายการเริ่มต้น Plugin ที่เชื่อถือแล้วและโมดูล Plugin ช่องทางเพื่อสร้าง
  snapshot ดังนั้นให้ top-level import ไม่มี side effect และวาง socket,
  client, worker และ service ไว้หลังเส้นทางเฉพาะ `"full"` เท่านั้น
- `registerFull` จะรันเฉพาะเมื่อ `api.registrationMode === "full"` เท่านั้น ระบบจะข้าม
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry`, `configSchema` สามารถเป็น factory แบบ lazy และ OpenClaw
  จะ memoize สคีมาที่ resolve แล้วเมื่อเข้าถึงครั้งแรก
- สำหรับคำสั่ง CLI ระดับ root ที่ Plugin เป็นเจ้าของ แนะนำให้ใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังโหลดแบบ lazy ได้โดยไม่หายไปจาก
  parse tree ของ CLI ระดับ root สำหรับคำสั่งฟีเจอร์แบบ paired-node แนะนำให้ใช้
  `api.registerNodeCliFeature(...)` เพื่อให้คำสั่งไปอยู่ใต้ `openclaw nodes`
  สำหรับคำสั่ง Plugin แบบซ้อนอื่น ๆ ให้เพิ่ม `parentPath` และลงทะเบียนคำสั่งบน
  ออบเจ็กต์ `program` ที่ส่งให้ registrar; OpenClaw จะ resolve ไปยัง
  คำสั่งแม่ก่อนเรียก Plugin สำหรับ Plugin ช่องทาง แนะนำให้
  ลงทะเบียน descriptor เหล่านั้นจาก `registerCliMetadata(...)` และให้
  `registerFull(...)` เน้นงานเฉพาะรันไทม์
- หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ด้วย ให้เก็บเมธอดเหล่านั้นไว้บน
  prefix เฉพาะ Plugin namespace ผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับเป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบ lightweight ส่งคืนเพียง `{ plugin }` โดยไม่มี
การ wiring รันไทม์หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw โหลดรายการนี้แทนรายการแบบเต็มเมื่อช่องทางถูกปิดใช้งาน,
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้งานการโหลดแบบ deferred ดู
[การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry) เพื่อดูว่าสิ่งนี้สำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับตระกูลตัวช่วย setup แบบแคบ:

- `openclaw/plugin-sdk/setup-runtime` สำหรับตัวช่วย setup ที่ปลอดภัยสำหรับรันไทม์ เช่น
  adapter patch setup ที่ปลอดภัยต่อการ import, เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ proxy setup แบบ delegated
- `openclaw/plugin-sdk/channel-setup` สำหรับ surface setup ของ optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับตัวช่วย CLI/archive/docs ของ setup/install

เก็บ SDK ที่หนัก, การลงทะเบียน CLI และ service รันไทม์อายุยาวไว้ในรายการเริ่มต้นแบบเต็ม

ช่องทาง workspace ที่ bundled และแยก surface setup กับรันไทม์สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ contract นั้นทำให้
รายการ setup เก็บ export ของ plugin/secrets ที่ปลอดภัยสำหรับ setup ขณะยังเปิดเผย
runtime setter ได้:

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

ใช้ contract แบบ bundled นั้นเฉพาะเมื่อ flow setup ต้องการ runtime setter แบบ lightweight
ก่อนที่รายการเริ่มต้นช่องทางแบบเต็มจะโหลดจริง ๆ

## โหมดการลงทะเบียน

`api.registrationMode` บอก Plugin ของคุณว่าถูกโหลดอย่างไร:

| โหมด              | เมื่อใด                         | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น Gateway ตามปกติ     | ทุกอย่าง                                                                                                                     |
| `"discovery"`     | การค้นพบ capability แบบอ่านอย่างเดียว | การลงทะเบียนช่องทางพร้อม descriptor CLI แบบคงที่; โค้ดรายการเริ่มต้นอาจโหลดได้ แต่ให้ข้าม socket, worker, client และ service |
| `"setup-only"`    | ช่องทางที่ปิดใช้งาน/ยังไม่ได้กำหนดค่า | การลงทะเบียนช่องทางเท่านั้น                                                                                                  |
| `"setup-runtime"` | flow setup ที่มีรันไทม์พร้อมใช้งาน | การลงทะเบียนช่องทางพร้อมเฉพาะรันไทม์แบบ lightweight ที่จำเป็นก่อนรายการเริ่มต้นแบบเต็มจะโหลด                                |
| `"cli-metadata"`  | การจับข้อมูล help ระดับ root / เมทาดาทา CLI | descriptor CLI เท่านั้น                                                                                                      |

`defineChannelPluginEntry` จัดการการแยกนี้โดยอัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงสำหรับช่องทาง ให้ตรวจสอบโหมดด้วยตัวเอง:

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

โหมด discovery สร้าง snapshot registry แบบไม่กระตุ้นการทำงาน แต่อาจยังประเมิน
รายการเริ่มต้น Plugin และออบเจ็กต์ Plugin ช่องทาง เพื่อให้ OpenClaw ลงทะเบียน capability
ของช่องทางและ descriptor CLI แบบคงที่ได้ ให้มองการประเมินโมดูลใน discovery ว่า
เชื่อถือได้แต่ควร lightweight: ห้ามมี network client, subprocess, listener, การเชื่อมต่อ
ฐานข้อมูล, background worker, การอ่าน credential หรือ side effect รันไทม์สดอื่น ๆ
ที่ top level

ให้มอง `"setup-runtime"` เป็นช่วงเวลาที่ surface เริ่มต้นแบบ setup-only ต้อง
มีอยู่โดยไม่กลับเข้าไปในรันไทม์ช่องทาง bundled แบบเต็ม สิ่งที่เหมาะคือ
การลงทะเบียนช่องทาง, route HTTP ที่ปลอดภัยสำหรับ setup, เมธอด Gateway ที่ปลอดภัยสำหรับ setup และ
ตัวช่วย setup แบบ delegated ส่วน background service ที่หนัก, registrar CLI และ
bootstrap SDK ของ provider/client ยังคงควรอยู่ใน `"full"`

สำหรับ registrar CLI โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของคำสั่งรากอย่างน้อยหนึ่งคำสั่ง และคุณ
  ต้องการให้ OpenClaw โหลดโมดูล CLI จริงแบบ lazy-load เมื่อเรียกใช้ครั้งแรก
- ตรวจสอบให้แน่ใจว่า descriptor เหล่านั้นครอบคลุมรากคำสั่งระดับบนสุดทุกคำสั่งที่
  registrar เปิดเผย
- จำกัดชื่อคำสั่งของ descriptor ให้ใช้ได้เฉพาะตัวอักษร ตัวเลข ยัติภังค์ และขีดล่าง
  โดยขึ้นต้นด้วยตัวอักษรหรือตัวเลข OpenClaw จะปฏิเสธชื่อ descriptor ที่อยู่นอก
  รูปแบบนั้น และจะลบลำดับควบคุมเทอร์มินัลออกจากคำอธิบายก่อนแสดงความช่วยเหลือ
- ใช้ `commands` เพียงอย่างเดียวเฉพาะกับเส้นทางความเข้ากันได้แบบ eager เท่านั้น

## รูปแบบ Plugin

OpenClaw จัดประเภท Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                | คำอธิบาย                                           |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ประเภทความสามารถเดียว (เช่น เฉพาะผู้ให้บริการ)    |
| **hybrid-capability** | ความสามารถหลายประเภท (เช่น ผู้ให้บริการ + เสียงพูด) |
| **hook-only**         | มีเฉพาะ hook ไม่มีความสามารถ                       |
| **non-capability**    | เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ        |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) - API การลงทะเบียนและข้อมูลอ้างอิง subpath
- [ตัวช่วย Runtime](/th/plugins/sdk-runtime) - `api.runtime` และ `createPluginRuntimeStore`
- [การตั้งค่าและ Config](/th/plugins/sdk-setup) - manifest, จุดเข้าการตั้งค่า, การโหลดแบบเลื่อนเวลา
- [Channel Plugins](/th/plugins/sdk-channel-plugins) - การสร้างออบเจ็กต์ `ChannelPlugin`
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การลงทะเบียนผู้ให้บริการและ hook
