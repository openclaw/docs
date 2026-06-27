---
read_when:
    - คุณต้องการสร้าง Plugin OpenClaw แบบง่ายที่เพิ่มเฉพาะเครื่องมือของเอเจนต์
    - คุณต้องการใช้ defineToolPlugin แทนการเขียนเมทาดาต้าแมนิเฟสต์ของ Plugin ด้วยตนเอง
    - คุณต้องสร้างโครงร่าง สร้าง ตรวจสอบความถูกต้อง ทดสอบ หรือเผยแพร่ Plugin แบบเครื่องมือเท่านั้น
sidebarTitle: Tool Plugins
summary: สร้างเครื่องมือเอเจนต์แบบมีชนิดข้อมูลอย่างง่ายด้วย defineToolPlugin และ openclaw plugins init/build/validate
title: Plugin เครื่องมือ
x-i18n:
    generated_at: "2026-06-27T18:09:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Plugin เครื่องมือเพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ให้กับ OpenClaw โดยไม่เพิ่มช่องทาง,
ผู้ให้บริการโมเดล, hook, service หรือแบ็กเอนด์การตั้งค่า ใช้ `defineToolPlugin` เมื่อ
Plugin เป็นเจ้าของรายการเครื่องมือแบบตายตัว และคุณต้องการให้ OpenClaw สร้างเมทาดาทา manifest
ที่ทำให้เครื่องมือเหล่านั้นค้นพบได้โดยไม่ต้องโหลดโค้ด runtime

โฟลว์ที่แนะนำคือ:

1. สร้างโครงแพ็กเกจด้วย `openclaw plugins init`
2. เขียนเครื่องมือด้วย `defineToolPlugin`
3. สร้าง JavaScript
4. สร้างเมทาดาทา `openclaw.plugin.json` และ `package.json` ด้วย
   `openclaw plugins build`
5. ตรวจสอบเมทาดาทาที่สร้างขึ้นก่อนเผยแพร่หรือติดตั้ง

สำหรับ Plugin ผู้ให้บริการ, ช่องทาง, hook, service หรือ Plugin ที่มีความสามารถผสม ให้เริ่มจาก
[การสร้าง Plugin](/th/plugins/building-plugins), [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins),
หรือ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน

## ข้อกำหนด

- Node >= 22
- เอาต์พุตแพ็กเกจ TypeScript ESM
- `typebox` สำหรับสคีมาการกำหนดค่าและพารามิเตอร์เครื่องมือ
- `openclaw >=2026.5.17` ซึ่งเป็นเวอร์ชันแรกของ OpenClaw ที่ส่งออก
  `openclaw/plugin-sdk/tool-plugin`
- รากแพ็กเกจที่สามารถจัดส่ง `dist/`, `openclaw.plugin.json` และ
  `package.json`

Plugin ที่สร้างขึ้นนำเข้า `typebox` ตอน runtime ดังนั้นให้เก็บ `typebox` ไว้ใน
`dependencies` ไม่ใช่เฉพาะ `devDependencies`

## เริ่มต้นอย่างรวดเร็ว

สร้างแพ็กเกจ Plugin ใหม่:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

โครงที่สร้างจะมี:

- `src/index.ts`: entry ของ `defineToolPlugin` พร้อมเครื่องมือ `echo`
- `src/index.test.ts`: การทดสอบเมทาดาทาขนาดเล็ก
- `tsconfig.json`: เอาต์พุต TypeScript แบบ NodeNext ไปยัง `dist/`
- `package.json`: scripts, runtime dependencies และ
  `openclaw.extensions: ["./dist/index.js"]`
- `openclaw.plugin.json`: เมทาดาทา manifest ที่สร้างขึ้นสำหรับเครื่องมือเริ่มต้น

เอาต์พุตการตรวจสอบที่คาดหวัง:

```text
Plugin stock-quotes is valid.
```

## เขียนเครื่องมือ

`defineToolPlugin` รับตัวตนของ Plugin, สคีมาการกำหนดค่าที่เป็นทางเลือก และ
รายการเครื่องมือแบบ static ประเภทของพารามิเตอร์และการกำหนดค่าจะถูกอนุมานจากสคีมา TypeBox

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

ชื่อเครื่องมือคือ API ที่เสถียร เลือกชื่อที่ไม่ซ้ำกัน เป็นตัวพิมพ์เล็ก และ
เฉพาะเจาะจงพอที่จะหลีกเลี่ยงการชนกับเครื่องมือหลักหรือ Plugin อื่น

## เครื่องมือแบบทางเลือกและ factory

ตั้งค่า `optional: true` เมื่อผู้ใช้ควร allowlist เครื่องมืออย่างชัดเจนก่อนที่จะ
ส่งเครื่องมือนั้นไปยังโมเดล:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` จะเขียนรายการ manifest `toolMetadata.<tool>.optional`
ที่ตรงกัน เพื่อให้ OpenClaw ค้นพบเครื่องมือได้โดยไม่ต้องโหลดโค้ด runtime ของ Plugin

ใช้ `factory` เมื่อเครื่องมือต้องการบริบทเครื่องมือ runtime ก่อนจึงจะสร้างได้
factory จะคงเมทาดาทาให้เป็น static ขณะยังเปิดให้เครื่องมือเลือกไม่เข้าร่วมสำหรับ
การรันเฉพาะ ตรวจสอบสถานะ sandbox หรือผูก runtime helpers ได้

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

factory ยังใช้กับชื่อเครื่องมือแบบตายตัวเท่านั้น ใช้ `definePluginEntry` โดยตรงเมื่อ
Plugin คำนวณชื่อเครื่องมือแบบไดนามิก หรือรวมเครื่องมือกับ hooks,
services, providers, commands หรือพื้นผิว runtime อื่น ๆ

## ค่าที่ส่งคืน

`defineToolPlugin` ห่อค่าที่ส่งคืนแบบปกติให้อยู่ในรูปแบบผลลัพธ์เครื่องมือของ OpenClaw:

- ส่งคืนสตริงเมื่อโมเดลควรเห็นข้อความนั้นตรงตามต้นฉบับ
- ส่งคืนค่าที่เข้ากันได้กับ JSON เมื่อคุณต้องการให้โมเดลเห็น JSON ที่จัดรูปแบบแล้ว
  และให้ OpenClaw เก็บค่าต้นฉบับไว้ใน `details`

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

ใช้เครื่องมือแบบ factory เมื่อคุณต้องการส่งคืน `AgentToolResult` แบบกำหนดเอง หรือใช้
implementation ของ `api.registerTool` ที่มีอยู่ซ้ำ ใช้ `definePluginEntry` แทน
`defineToolPlugin` เมื่อคุณต้องการเครื่องมือแบบไดนามิกเต็มรูปแบบ หรือความสามารถของ Plugin
แบบผสม

## การกำหนดค่า

`configSchema` เป็นทางเลือก หากคุณละไว้ OpenClaw จะใช้สคีมาออบเจ็กต์ว่างแบบเข้มงวด
และ manifest ที่สร้างขึ้นจะยังคงมี `configSchema`

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

เมื่อคุณใส่ `configSchema` อาร์กิวเมนต์ที่สองของ `execute` จะถูกกำหนดชนิดจาก
สคีมา:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw อ่านการกำหนดค่า Plugin จาก entry ของ Plugin ในการกำหนดค่า Gateway อย่า
hard-code secrets ในซอร์สหรือในตัวอย่างเอกสาร ใช้การกำหนดค่า ตัวแปรสภาพแวดล้อม
หรือ SecretRefs ตามโมเดลความปลอดภัยของ Plugin

## เมทาดาทาที่สร้างขึ้น

OpenClaw ค้นพบ Plugin ที่ติดตั้งจากเมทาดาทา cold metadata โดยต้องสามารถอ่าน
manifest ของ Plugin ก่อนนำเข้าโค้ด runtime ของ Plugin ได้ ดังนั้น `defineToolPlugin`
จึงเปิดเผยเมทาดาทาแบบ static และ `openclaw plugins build` จะเขียนเมทาดาทานั้น
ลงในแพ็กเกจ

รันตัวสร้างหลังเปลี่ยน id, name, description, config schema,
activation หรือชื่อเครื่องมือของ Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

สำหรับ Plugin ที่มีเครื่องมือเดียว manifest ที่สร้างขึ้นจะมีลักษณะดังนี้:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` คือสัญญาการค้นพบที่สำคัญ โดยบอก OpenClaw ว่า
Plugin ใดเป็นเจ้าของเครื่องมือแต่ละตัวโดยไม่ต้องโหลด runtime ของ Plugin ทุกตัวที่ติดตั้ง
หาก manifest ล้าสมัย เครื่องมืออาจหายไปจากการค้นพบ หรือ Plugin ที่ผิดอาจถูกระบุว่า
เป็นต้นเหตุของข้อผิดพลาดการลงทะเบียน

## เมทาดาทาแพ็กเกจ

สำหรับ workflow ของ tool-plugin แบบง่าย `openclaw plugins build` จะจัดให้
`package.json` ตรงกับ runtime entry เดียวที่เลือก:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

ใช้ JavaScript ที่ build แล้ว เช่น `./dist/index.js` สำหรับแพ็กเกจที่ติดตั้ง
entry จากซอร์สมีประโยชน์ในการพัฒนาใน workspace แต่แพ็กเกจที่เผยแพร่ไม่ควร
พึ่งพาการโหลด runtime ของ TypeScript

## ตรวจสอบใน CI

ใช้ `plugins build --check` เพื่อทำให้ CI ล้มเหลวเมื่อเมทาดาทาที่สร้างขึ้นล้าสมัย
โดยไม่เขียนไฟล์ใหม่:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` ตรวจสอบว่า:

- `openclaw.plugin.json` มีอยู่และผ่านตัวโหลด manifest ปกติ
- entry ปัจจุบันส่งออกเมทาดาทา `defineToolPlugin`
- ฟิลด์ manifest ที่สร้างขึ้นตรงกับเมทาดาทาของ entry
- `contracts.tools` ตรงกับชื่อเครื่องมือที่ประกาศ
- `package.json` ชี้ `openclaw.extensions` ไปยัง runtime entry ที่เลือก

## ติดตั้งและตรวจสอบในเครื่อง

จาก checkout ของ OpenClaw แยกต่างหาก หรือ CLI ที่ติดตั้งแล้ว ให้ติดตั้งพาธของแพ็กเกจ:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

สำหรับ smoke ของแพ็กเกจ ให้ pack ก่อนแล้วติดตั้ง tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

หลังติดตั้ง ให้เริ่มหรือรีสตาร์ท Gateway แล้วขอให้เอเจนต์ใช้
เครื่องมือ หากคุณกำลังดีบักการมองเห็นเครื่องมือ ให้ตรวจสอบ runtime ของ Plugin และ
แค็ตตาล็อกเครื่องมือที่มีผลก่อนเปลี่ยนโค้ด

## เผยแพร่

เผยแพร่ผ่าน ClawHub เมื่อแพ็กเกจพร้อม:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

ติดตั้งด้วย locator ของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

สเปกแพ็กเกจ npm แบบ bare ยังคงรองรับในช่วงเปลี่ยนผ่านการเปิดตัว แต่ ClawHub
คือพื้นผิวการค้นพบและการกระจายที่แนะนำสำหรับ Plugin ของ OpenClaw

## การแก้ปัญหา

### `plugin entry not found: ./dist/index.js`

ไฟล์ entry ที่เลือกไม่มีอยู่ รัน `npm run build` แล้วรัน
`openclaw plugins build --entry ./dist/index.js` หรือ
`openclaw plugins validate --entry ./dist/index.js` อีกครั้ง

### `plugin entry does not expose defineToolPlugin metadata`

entry ไม่ได้ส่งออกค่าที่สร้างโดย `defineToolPlugin` ตรวจสอบว่า
default export ของโมดูลคือผลลัพธ์ `defineToolPlugin(...)` หรือส่ง entry ที่ถูกต้องด้วย
`--entry`

### `openclaw.plugin.json generated metadata is stale`

manifest ไม่ตรงกับเมทาดาทาของ entry อีกต่อไป รัน:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

commit การเปลี่ยนแปลงทั้ง `openclaw.plugin.json` และ `package.json`

### `package.json openclaw.extensions must include ./dist/index.js`

เมทาดาทาแพ็กเกจชี้ไปยัง runtime entry อื่น รัน
`openclaw plugins build --entry ./dist/index.js` เพื่อให้ตัวสร้างจัดเมทาดาทาแพ็กเกจ
ให้ตรงกับ entry ที่คุณตั้งใจจะจัดส่ง

### `Cannot find package 'typebox'`

Plugin ที่ build แล้วนำเข้า `typebox` ตอน runtime ให้เก็บ `typebox` ไว้ใน
`dependencies` ติดตั้ง dependencies ของแพ็กเกจใหม่ build ใหม่ และรันการตรวจสอบอีกครั้ง

### เครื่องมือไม่ปรากฏหลังติดตั้ง

ตรวจสอบสิ่งเหล่านี้ตามลำดับ:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` มี `contracts.tools` พร้อมชื่อเครื่องมือที่คาดไว้
4. `package.json` มี `openclaw.extensions: ["./dist/index.js"]`
5. Gateway ถูกรีสตาร์ทหรือโหลดใหม่หลังติดตั้ง Plugin

## ดูเพิ่มเติม

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [entry points ของ Plugin](/th/plugins/sdk-entrypoints)
- [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- [manifest ของ Plugin](/th/plugins/manifest)
- [CLI ของ Plugin](/th/cli/plugins)
- [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)
