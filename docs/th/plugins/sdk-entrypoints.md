---
read_when:
    - คุณต้องใช้ลายเซ็นชนิดที่แน่นอนของ definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (full เทียบกับ setup เทียบกับข้อมูลเมตา CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้น
sidebarTitle: Entry Points
summary: เอกสารอ้างอิงสำหรับ definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเข้าใช้งานของ Plugin
x-i18n:
    generated_at: "2026-05-06T09:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

ทุก Plugin ส่งออกอ็อบเจกต์ entry เริ่มต้น SDK มีตัวช่วยสามรายการสำหรับ
สร้างอ็อบเจกต์เหล่านี้

สำหรับ Plugin ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลดรันไทม์ไปยัง
JavaScript ที่บิลด์แล้วเมื่อมีให้ใช้:

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

`extensions` และ `setupEntry` ยังคงเป็น entry ซอร์สที่ใช้ได้สำหรับการพัฒนา
ในเวิร์กสเปซและ git checkout แนะนำให้ใช้ `runtimeExtensions` และ
`runtimeSetupEntry` เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ
npm หลีกเลี่ยงการคอมไพล์ TypeScript ระหว่างรันไทม์ จำเป็นต้องระบุ entry รันไทม์
อย่างชัดเจน: `runtimeSetupEntry` ต้องมี `setupEntry` และหากไม่มีอาร์ติแฟกต์
`runtimeExtensions` หรือ `runtimeSetupEntry` การติดตั้ง/การค้นหาจะล้มเหลว
แทนที่จะถอยกลับไปใช้ซอร์สแบบเงียบ ๆ หากแพ็กเกจที่ติดตั้งแล้วประกาศเฉพาะ
entry ซอร์ส TypeScript OpenClaw จะใช้เพียร์ `dist/*.js` ที่บิลด์แล้วซึ่งตรงกัน
เมื่อมีอยู่ จากนั้นจึงถอยกลับไปใช้ซอร์ส TypeScript

พาธ entry ทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจของ Plugin entry รันไทม์และ
เพียร์ JavaScript ที่บิลด์แล้วซึ่งอนุมานได้ ไม่ได้ทำให้พาธซอร์ส `extensions`
หรือ `setupEntry` ที่หลุดออกนอกแพ็กเกจกลายเป็นพาธที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบ walkthrough อยู่ใช่ไหม?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือทีละขั้นตอน
</Tip>

## `definePluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ Plugin ของ provider, Plugin เครื่องมือ, Plugin hook และทุกอย่างที่
**ไม่ใช่** ช่องทางรับส่งข้อความ

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
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | สคีมาวัตถุว่าง      |
| `register`     | `(api: OpenClawPluginApi) => void`                               | ใช่    | -                   |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับสล็อตแบบเอกสิทธิ์: `"memory"` หรือ `"context-engine"`
- `configSchema` อาจเป็นฟังก์ชันสำหรับการประเมินแบบ lazy
- OpenClaw จะแก้ค่าและ memoize สคีมานั้นในการเข้าถึงครั้งแรก ดังนั้นตัวสร้างสคีมาที่แพง
  จะทำงานเพียงครั้งเดียว

## `defineChannelPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` ด้วยการเชื่อมต่อเฉพาะช่องทาง เรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผย seam เมทาดาทา CLI
สำหรับ root-help แบบไม่บังคับ และ gate `registerFull` ตามโหมดการลงทะเบียน

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
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | ใช่    | -                   |
| `name`                | `string`                                                         | ใช่    | -                   |
| `description`         | `string`                                                         | ใช่    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | ใช่    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่    | สคีมาวัตถุว่าง      |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | ไม่    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | ไม่    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | ไม่    | -                   |

- `setRuntime` จะถูกเรียกระหว่างการลงทะเบียนเพื่อให้คุณเก็บ reference ของรันไทม์ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) โดยจะถูกข้ามระหว่างการจับเมทาดาทา CLI
- `registerCliMetadata` ทำงานระหว่าง `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` และ
  `api.registrationMode === "full"`
  ใช้เป็นตำแหน่งมาตรฐานสำหรับตัวบรรยาย CLI ที่ช่องทางเป็นเจ้าของ เพื่อให้ root help
  ไม่ก่อให้เกิดการ activate, snapshot การค้นหารวมเมทาดาทาคำสั่งแบบคงที่ และ
  การลงทะเบียนคำสั่ง CLI ปกติยังคงเข้ากันได้กับการโหลด Plugin แบบเต็ม
- การลงทะเบียนเพื่อค้นหาเป็นแบบไม่ก่อให้เกิดการ activate ไม่ใช่ import-free OpenClaw อาจ
  ประเมิน entry ของ Plugin ที่เชื่อถือได้และโมดูล Plugin ช่องทางเพื่อสร้าง
  snapshot ดังนั้นให้ import ระดับบนสุดไม่มี side effect และวาง socket,
  client, worker และ service ไว้หลังพาธเฉพาะ `"full"`
- `registerFull` ทำงานเฉพาะเมื่อ `api.registrationMode === "full"` โดยจะถูกข้าม
  ระหว่างการโหลดเฉพาะการตั้งค่า
- เช่นเดียวกับ `definePluginEntry`, `configSchema` สามารถเป็น factory แบบ lazy และ OpenClaw
  จะ memoize สคีมาที่แก้ค่าแล้วในการเข้าถึงครั้งแรก
- สำหรับคำสั่ง CLI ระดับ root ที่ Plugin เป็นเจ้าของ แนะนำให้ใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคง lazy-loaded โดยไม่หายไปจาก
  parse tree ของ CLI ระดับ root สำหรับ Plugin ช่องทาง แนะนำให้ลงทะเบียนตัวบรรยายเหล่านั้น
  จาก `registerCliMetadata(...)` และให้ `registerFull(...)` เน้นงานที่ใช้เฉพาะรันไทม์
- หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ด้วย ให้เก็บไว้ภายใต้
  prefix เฉพาะ Plugin namespace ผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับเป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบเบา คืนค่าเพียง `{ plugin }` โดยไม่มี
การเชื่อมต่อรันไทม์หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw โหลดสิ่งนี้แทน entry แบบเต็มเมื่อช่องทางถูกปิดใช้งาน,
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้การโหลดแบบเลื่อนเวลา ดู
[การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry) เพื่อดูว่าเรื่องนี้สำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับกลุ่มตัวช่วยการตั้งค่าแบบแคบ:

- `openclaw/plugin-sdk/setup-runtime` สำหรับตัวช่วยการตั้งค่าที่ปลอดภัยต่อรันไทม์ เช่น
  adapter สำหรับแพตช์การตั้งค่าที่ import-safe, เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ proxy การตั้งค่าแบบ delegated
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิวการตั้งค่า optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับตัวช่วย CLI/archive/docs ของการตั้งค่า/ติดตั้ง

เก็บ SDK หนัก ๆ, การลงทะเบียน CLI และ service รันไทม์ที่อยู่ยาวไว้ใน
entry แบบเต็ม

ช่องทางในเวิร์กสเปซที่ bundled ซึ่งแยกพื้นผิวการตั้งค่าและรันไทม์สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ contract นั้นทำให้
entry การตั้งค่าเก็บ export ของ Plugin/secret ที่ปลอดภัยต่อการตั้งค่าไว้ได้ พร้อมกับยังเปิดเผย
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

ใช้ contract แบบ bundled นั้นเฉพาะเมื่อ flow การตั้งค่าต้องการ runtime
setter แบบเบาจริง ๆ ก่อนที่ entry ช่องทางแบบเต็มจะโหลด

## โหมดการลงทะเบียน

`api.registrationMode` บอก Plugin ของคุณว่าถูกโหลดมาอย่างไร:

| โหมด              | เมื่อใด                         | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น Gateway ปกติ          | ทุกอย่าง                                                                                                                |
| `"discovery"`     | การค้นหาความสามารถแบบอ่านอย่างเดียว | การลงทะเบียนช่องทางพร้อมตัวบรรยาย CLI แบบคงที่; โค้ด entry อาจโหลด แต่ให้ข้าม socket, worker, client และ service |
| `"setup-only"`    | ช่องทางถูกปิดใช้งาน/ยังไม่ได้กำหนดค่า | การลงทะเบียนช่องทางเท่านั้น                                                                                             |
| `"setup-runtime"` | flow การตั้งค่าที่มีรันไทม์พร้อมใช้ | การลงทะเบียนช่องทางพร้อมเฉพาะรันไทม์แบบเบาที่จำเป็นก่อน entry แบบเต็มจะโหลด                                            |
| `"cli-metadata"`  | การจับ root help / เมทาดาทา CLI  | ตัวบรรยาย CLI เท่านั้น                                                                                                  |

`defineChannelPluginEntry` จัดการการแยกนี้โดยอัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงสำหรับช่องทาง ให้ตรวจสอบโหมดด้วยตนเอง:

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

โหมด discovery สร้าง snapshot registry ที่ไม่ก่อให้เกิดการ activate แต่ยังอาจประเมิน
entry ของ Plugin และอ็อบเจกต์ Plugin ช่องทาง เพื่อให้ OpenClaw สามารถลงทะเบียน
ความสามารถของช่องทางและตัวบรรยาย CLI แบบคงที่ได้ ให้ถือว่าการประเมินโมดูลใน discovery เป็น
สิ่งที่เชื่อถือได้แต่เบา: ห้ามมี network client, subprocess, listener, การเชื่อมต่อฐานข้อมูล,
background worker, การอ่าน credential หรือ side effect รันไทม์จริงอื่น ๆ ที่ระดับบนสุด

ให้ถือว่า `"setup-runtime"` เป็นช่วงเวลาที่พื้นผิวเริ่มต้นเฉพาะการตั้งค่าต้อง
มีอยู่โดยไม่กลับเข้าไปยังรันไทม์ช่องทาง bundled แบบเต็ม สิ่งที่เหมาะคือ
การลงทะเบียนช่องทาง, route HTTP ที่ปลอดภัยต่อการตั้งค่า, เมธอด Gateway ที่ปลอดภัยต่อการตั้งค่า และ
ตัวช่วยการตั้งค่าแบบ delegated service เบื้องหลังที่หนัก, CLI registrar และ
bootstrap ของ provider/client SDK ยังคงควรอยู่ใน `"full"`

สำหรับ CLI registrar โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของคำสั่งระดับ root หนึ่งคำสั่งขึ้นไป และคุณ
  ต้องการให้ OpenClaw lazy-load โมดูล CLI จริงเมื่อเรียกใช้ครั้งแรก
- ตรวจสอบให้แน่ใจว่าตัวบรรยายเหล่านั้นครอบคลุม root คำสั่งระดับบนสุดทุกตัวที่
  registrar เปิดเผย
- จำกัดชื่อคำสั่งในตัวบรรยายให้เป็นตัวอักษร ตัวเลข hyphen และ underscore
  โดยเริ่มต้นด้วยตัวอักษรหรือตัวเลข; OpenClaw จะปฏิเสธชื่อตัวบรรยายที่อยู่นอก
  รูปแบบนั้น และตัดลำดับควบคุมเทอร์มินัลออกจากคำอธิบายก่อน
  แสดงผล help
- ใช้ `commands` อย่างเดียวเฉพาะสำหรับพาธความเข้ากันได้แบบ eager

## รูปแบบของ Plugin

OpenClaw จำแนก Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                 | คำอธิบาย                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ประเภทความสามารถเดียว (เช่น เฉพาะผู้ให้บริการ)           |
| **hybrid-capability** | ความสามารถหลายประเภท (เช่น ผู้ให้บริการ + คำพูด) |
| **hook-only**         | เฉพาะ hook เท่านั้น ไม่มีความสามารถ                        |
| **non-capability**    | เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ        |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) - API การลงทะเบียนและข้อมูลอ้างอิง subpath
- [ตัวช่วย Runtime](/th/plugins/sdk-runtime) - `api.runtime` และ `createPluginRuntimeStore`
- [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup) - manifest, จุดเข้า setup, การโหลดแบบเลื่อนออกไป
- [Channel Plugins](/th/plugins/sdk-channel-plugins) - การสร้างอ็อบเจกต์ `ChannelPlugin`
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การลงทะเบียนผู้ให้บริการและ hook
