---
read_when:
    - คุณต้องใช้ลายเซ็นชนิดที่แน่นอนของ definePluginEntry หรือ defineChannelPluginEntry
    - คุณต้องการทำความเข้าใจโหมดการลงทะเบียน (แบบเต็มเทียบกับแบบตั้งค่าเทียบกับเมทาดาตาของ CLI)
    - คุณกำลังค้นหาตัวเลือกจุดเริ่มต้นการทำงาน
sidebarTitle: Entry Points
summary: ข้อมูลอ้างอิงสำหรับ definePluginEntry, defineChannelPluginEntry และ defineSetupPluginEntry
title: จุดเริ่มต้นการทำงานของ Plugin
x-i18n:
    generated_at: "2026-05-02T10:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Plugin ทุกตัวส่งออกออบเจ็กต์ entry เริ่มต้นหนึ่งตัว SDK มีตัวช่วยสามตัวสำหรับ
สร้างออบเจ็กต์เหล่านี้

สำหรับ Plugin ที่ติดตั้งแล้ว `package.json` ควรชี้การโหลดขณะรันไทม์ไปที่
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

`extensions` และ `setupEntry` ยังคงเป็น entry ซอร์สที่ใช้ได้สำหรับการพัฒนาแบบ workspace และ
git checkout ส่วน `runtimeExtensions` และ `runtimeSetupEntry` เป็นตัวเลือกที่แนะนำ
เมื่อ OpenClaw โหลดแพ็กเกจที่ติดตั้งแล้ว และช่วยให้แพ็กเกจ npm หลีกเลี่ยงการคอมไพล์
TypeScript ขณะรันไทม์ ต้องระบุ runtime entry อย่างชัดเจน: `runtimeSetupEntry`
ต้องมี `setupEntry` และหากไม่มี artifact ของ `runtimeExtensions` หรือ `runtimeSetupEntry`
การติดตั้ง/การค้นพบจะล้มเหลวแทนที่จะถอยกลับไปใช้ซอร์สแบบเงียบๆ หาก
แพ็กเกจที่ติดตั้งแล้วประกาศเฉพาะ TypeScript source entry OpenClaw จะใช้ peer
`dist/*.js` ที่ build แล้วที่ตรงกันเมื่อมีอยู่ จากนั้นจึงถอยกลับไปใช้ซอร์ส TypeScript

เส้นทาง entry ทั้งหมดต้องอยู่ภายในไดเรกทอรีแพ็กเกจ Plugin เท่านั้น Runtime entry
และ peer JavaScript ที่ build แล้วซึ่งอนุมานได้ ไม่ทำให้เส้นทางซอร์ส `extensions` หรือ
`setupEntry` ที่หลุดออกนอกแพ็กเกจกลายเป็นเส้นทางที่ใช้ได้

<Tip>
  **กำลังมองหาคู่มือแบบ walkthrough อยู่ใช่ไหม?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือทีละขั้นตอน
</Tip>

## `definePluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/plugin-entry`

สำหรับ Provider Plugin, Tool Plugin, Hook Plugin และทุกอย่างที่ **ไม่ใช่**
ช่องทางรับส่งข้อความ

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

| ฟิลด์          | ชนิด                                                             | จำเป็น | ค่าเริ่มต้น             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | ใช่      | —                   |
| `name`         | `string`                                                         | ใช่      | —                   |
| `description`  | `string`                                                         | ใช่      | —                   |
| `kind`         | `string`                                                         | ไม่       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่       | สคีมาออบเจ็กต์ว่าง |
| `register`     | `(api: OpenClawPluginApi) => void`                               | ใช่      | —                   |

- `id` ต้องตรงกับ manifest `openclaw.plugin.json` ของคุณ
- `kind` ใช้สำหรับ slot แบบ exclusive: `"memory"` หรือ `"context-engine"`
- `configSchema` สามารถเป็นฟังก์ชันเพื่อประเมินผลแบบ lazy ได้
- OpenClaw จะ resolve และ memoize สคีมานั้นเมื่อเข้าถึงครั้งแรก ดังนั้นตัวสร้างสคีมา
  ที่มีต้นทุนสูงจะทำงานเพียงครั้งเดียว

## `defineChannelPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

ห่อ `definePluginEntry` พร้อมการต่อสายเฉพาะช่องทาง เรียก
`api.registerChannel({ plugin })` โดยอัตโนมัติ เปิดเผย seam metadata ของ CLI สำหรับ root-help แบบเลือกได้
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

| ฟิลด์                 | ชนิด                                                             | จำเป็น | ค่าเริ่มต้น             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | ใช่      | —                   |
| `name`                | `string`                                                         | ใช่      | —                   |
| `description`         | `string`                                                         | ใช่      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | ใช่      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | ไม่       | สคีมาออบเจ็กต์ว่าง |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | ไม่       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | ไม่       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | ไม่       | —                   |

- `setRuntime` ถูกเรียกระหว่างการลงทะเบียนเพื่อให้คุณเก็บการอ้างอิง runtime ได้
  (โดยทั่วไปผ่าน `createPluginRuntimeStore`) โดยจะข้ามในระหว่างการเก็บ CLI metadata
- `registerCliMetadata` ทำงานระหว่าง `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` และ
  `api.registrationMode === "full"`
  ใช้ตำแหน่งนี้เป็นที่ canonical สำหรับ descriptor ของ CLI ที่ช่องทางเป็นเจ้าของ เพื่อให้ root help
  ไม่ activate, discovery snapshot รวม metadata คำสั่งแบบคงที่ และ
  การลงทะเบียนคำสั่ง CLI ปกติยังคงเข้ากันได้กับการโหลด Plugin แบบ full
- การลงทะเบียน discovery ไม่ activate แต่ไม่ใช่ import-free OpenClaw อาจ
  ประเมิน trusted plugin entry และโมดูล channel plugin เพื่อสร้าง
  snapshot ดังนั้นให้ top-level import ปลอด side effect และวาง socket,
  client, worker และ service ไว้หลังเส้นทางที่เป็น `"full"` เท่านั้น
- `registerFull` ทำงานเฉพาะเมื่อ `api.registrationMode === "full"` และจะถูกข้าม
  ระหว่างการโหลดแบบ setup-only
- เช่นเดียวกับ `definePluginEntry`, `configSchema` สามารถเป็น factory แบบ lazy และ OpenClaw
  จะ memoize สคีมาที่ resolve แล้วเมื่อเข้าถึงครั้งแรก
- สำหรับคำสั่ง root CLI ที่ Plugin เป็นเจ้าของ ให้เลือกใช้ `api.registerCli(..., { descriptors: [...] })`
  เมื่อคุณต้องการให้คำสั่งยังคง lazy-load โดยไม่หายไปจาก
  parse tree ของ root CLI สำหรับ Channel Plugin ให้เลือกลงทะเบียน descriptor เหล่านั้น
  จาก `registerCliMetadata(...)` และให้ `registerFull(...)` มุ่งเน้นงานเฉพาะ runtime
- หาก `registerFull(...)` ลงทะเบียน gateway RPC methods ด้วย ให้คงไว้บน
  prefix เฉพาะ Plugin namespace ของ core admin ที่สงวนไว้ (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) จะถูกบังคับให้เป็น
  `operator.admin` เสมอ

## `defineSetupPluginEntry`

**นำเข้า:** `openclaw/plugin-sdk/channel-core`

สำหรับไฟล์ `setup-entry.ts` แบบเบา ส่งคืนเพียง `{ plugin }` โดยไม่มี
การต่อสาย runtime หรือ CLI

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw จะโหลดสิ่งนี้แทน entry แบบ full เมื่อช่องทางถูกปิดใช้งาน,
ยังไม่ได้กำหนดค่า หรือเมื่อเปิดใช้งานการโหลดแบบเลื่อนเวลา ดู
[Setup and Config](/th/plugins/sdk-setup#setup-entry) เพื่อดูว่าเรื่องนี้สำคัญเมื่อใด

ในทางปฏิบัติ ให้จับคู่ `defineSetupPluginEntry(...)` กับกลุ่มตัวช่วย setup
แบบแคบ:

- `openclaw/plugin-sdk/setup-runtime` สำหรับตัวช่วย setup ที่ปลอดภัยต่อ runtime เช่น
  adapter แพตช์ setup ที่ import-safe, เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ delegated setup proxies
- `openclaw/plugin-sdk/channel-setup` สำหรับพื้นผิว setup แบบ optional-install
- `openclaw/plugin-sdk/setup-tools` สำหรับตัวช่วย CLI/archive/docs สำหรับ setup/install

เก็บ SDK หนักๆ, การลงทะเบียน CLI และ service runtime ที่อยู่ยาวไว้ใน entry แบบ full

ช่องทาง workspace ที่ bundle มาและแยกพื้นผิว setup กับ runtime สามารถใช้
`defineBundledChannelSetupEntry(...)` จาก
`openclaw/plugin-sdk/channel-entry-contract` แทนได้ contract นั้นช่วยให้
setup entry เก็บ export ของ plugin/secrets ที่ปลอดภัยต่อ setup ขณะยังเปิดเผย
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

ใช้ bundled contract นั้นเฉพาะเมื่อ setup flow ต้องการ runtime
setter แบบเบาจริงๆ ก่อนที่ channel entry แบบ full จะโหลด

## โหมดการลงทะเบียน

`api.registrationMode` บอก Plugin ของคุณว่าถูกโหลดอย่างไร:

| โหมด              | เมื่อ                              | สิ่งที่ต้องลงทะเบียน                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | การเริ่มต้น Gateway ปกติ            | ทุกอย่าง                                                                                                              |
| `"discovery"`     | การค้นพบ capability แบบอ่านอย่างเดียว    | การลงทะเบียนช่องทางพร้อม descriptor ของ CLI แบบคงที่ entry code อาจโหลดได้ แต่ให้ข้าม socket, worker, client และ service |
| `"setup-only"`    | ช่องทางที่ปิดใช้งาน/ยังไม่ได้กำหนดค่า     | การลงทะเบียนช่องทางเท่านั้น                                                                                               |
| `"setup-runtime"` | Setup flow ที่มี runtime พร้อมใช้งาน | การลงทะเบียนช่องทางพร้อมเฉพาะ runtime แบบเบาที่จำเป็นก่อน entry แบบ full จะโหลด                               |
| `"cli-metadata"`  | การเก็บ root help / CLI metadata  | descriptor ของ CLI เท่านั้น                                                                                                    |

`defineChannelPluginEntry` จัดการการแยกนี้โดยอัตโนมัติ หากคุณใช้
`definePluginEntry` โดยตรงสำหรับช่องทาง ให้ตรวจโหมดเอง:

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

โหมด discovery สร้าง registry snapshot แบบไม่ activate แต่ยังอาจประเมิน
plugin entry และออบเจ็กต์ channel plugin เพื่อให้ OpenClaw ลงทะเบียน capability
ของช่องทางและ descriptor ของ CLI แบบคงที่ได้ ให้ถือว่าการประเมินโมดูลใน discovery เป็น
สิ่งที่ trusted แต่เบา: ไม่มี network client, subprocess, listener, การเชื่อมต่อ database,
background worker, การอ่าน credential หรือ side effect ของ live runtime อื่นๆ ที่ top level

ให้ถือว่า `"setup-runtime"` เป็นหน้าต่างที่พื้นผิว startup แบบ setup-only ต้อง
มีอยู่โดยไม่ re-enter runtime ของ bundled channel แบบ full สิ่งที่เหมาะคือ
การลงทะเบียนช่องทาง, route HTTP ที่ปลอดภัยต่อ setup, gateway method ที่ปลอดภัยต่อ setup และ
delegated setup helper ส่วน background service หนักๆ, CLI registrar และ
การ bootstrap SDK ของ provider/client ยังคงอยู่ใน `"full"`

สำหรับ CLI registrar โดยเฉพาะ:

- ใช้ `descriptors` เมื่อ registrar เป็นเจ้าของ root command หนึ่งรายการขึ้นไป และคุณ
  ต้องการให้ OpenClaw lazy-load โมดูล CLI จริงเมื่อมีการเรียกใช้ครั้งแรก
- ตรวจให้แน่ใจว่า descriptor เหล่านั้นครอบคลุม root ของคำสั่งระดับบนสุดทุกตัวที่
  registrar เปิดเผย
- ให้ชื่อคำสั่ง descriptor ใช้เฉพาะตัวอักษร ตัวเลข hyphen และ underscore
  โดยเริ่มต้นด้วยตัวอักษรหรือตัวเลข OpenClaw จะปฏิเสธชื่อ descriptor ที่อยู่นอก
  รูปแบบนั้น และตัด terminal control sequence ออกจากคำอธิบายก่อน
  render help
- ใช้เฉพาะ `commands` เท่านั้นสำหรับเส้นทาง compatibility แบบ eager

## รูปแบบ Plugin

OpenClaw จัดประเภท Plugin ที่โหลดแล้วตามพฤติกรรมการลงทะเบียน:

| รูปแบบ                 | คำอธิบาย                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | ประเภทความสามารถหนึ่งประเภท (เช่น เฉพาะ provider)           |
| **hybrid-capability** | ความสามารถหลายประเภท (เช่น provider + speech) |
| **hook-only**         | มีเฉพาะ hooks ไม่มีความสามารถ                        |
| **non-capability**    | เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ        |

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ Plugin

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) — API การลงทะเบียนและข้อมูลอ้างอิง subpath
- [ตัวช่วยรันไทม์](/th/plugins/sdk-runtime) — `api.runtime` และ `createPluginRuntimeStore`
- [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup) — manifest, จุดเข้า setup, การโหลดแบบเลื่อนเวลา
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้างอ็อบเจ็กต์ `ChannelPlugin`
- [Plugin Provider](/th/plugins/sdk-provider-plugins) — การลงทะเบียน provider และ hooks
