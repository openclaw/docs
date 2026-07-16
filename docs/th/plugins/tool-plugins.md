---
read_when:
    - คุณต้องการสร้าง Plugin OpenClaw แบบเรียบง่ายที่เพิ่มเฉพาะเครื่องมือสำหรับเอเจนต์เท่านั้น
    - คุณต้องการใช้ defineToolPlugin แทนการเขียนข้อมูลเมตาของไฟล์ Manifest ของ Plugin ด้วยตนเอง
    - คุณต้องสร้างโครงร่าง สร้าง ตรวจสอบความถูกต้อง ทดสอบ หรือเผยแพร่ Plugin ที่มีเฉพาะเครื่องมือ
sidebarTitle: Tool Plugins
summary: สร้างเครื่องมือเอเจนต์แบบมีชนิดข้อมูลอย่างง่ายด้วย defineToolPlugin และ openclaw plugins init/build/validate
title: Plugin เครื่องมือ
x-i18n:
    generated_at: "2026-07-16T19:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` สร้าง Plugin ที่เพิ่มเฉพาะเครื่องมือที่เอเจนต์เรียกใช้ได้เท่านั้น โดยไม่มี
ช่องทาง ผู้ให้บริการโมเดล hook บริการ หรือแบ็กเอนด์การตั้งค่า ระบบจะสร้าง
ข้อมูลเมตาของ manifest ที่ OpenClaw ต้องใช้เพื่อค้นหาเครื่องมือโดยไม่ต้องโหลดโค้ด
รันไทม์ของ Plugin

สำหรับ Plugin ที่เป็นผู้ให้บริการ ช่องทาง hook บริการ หรือมีความสามารถแบบผสม ให้เริ่มจาก
[การสร้าง Plugin](/th/plugins/building-plugins), [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
หรือ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน

## ข้อกำหนด

- Node 22.22.3+, Node 24.15+ หรือ Node 25.9+
- เอาต์พุตแพ็กเกจ TypeScript ESM
- `typebox` ใน `dependencies` (ไม่ใช่เพียง `devDependencies` เพราะ Plugin ที่สร้างขึ้น
  จะนำเข้าแพ็กเกจนี้ขณะรันไทม์)
- `openclaw >=2026.5.17` ซึ่งเป็นเวอร์ชันแรกที่ส่งออก
  `openclaw/plugin-sdk/tool-plugin`
- รูทแพ็กเกจที่จัดส่ง `dist/`, `openclaw.plugin.json` และ
  `package.json`

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` สร้างโครงเริ่มต้นดังนี้:

| ไฟล์                   | วัตถุประสงค์                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | จุดเริ่มต้น `defineToolPlugin` พร้อมเครื่องมือ `echo` หนึ่งรายการ                     |
| `src/index.test.ts`    | การทดสอบข้อมูลเมตาที่ตรวจยืนยันรายการเครื่องมือ                             |
| `tsconfig.json`        | เอาต์พุต TypeScript แบบ NodeNext ไปยัง `dist/`                             |
| `vitest.config.ts`     | การกำหนดค่า Vitest สำหรับ `src/**/*.test.ts`                              |
| `package.json`         | สคริปต์ การขึ้นต่อกันขณะรันไทม์ และ `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | ข้อมูลเมตา manifest ที่สร้างขึ้นสำหรับเครื่องมือเริ่มต้น                  |

`npm run plugin:build` เรียกใช้ `npm run build` (tsc) แล้วจึงเรียก
`openclaw plugins build --entry ./dist/index.js` ส่วน `npm run plugin:validate`
จะสร้างใหม่และเรียกใช้ `openclaw plugins validate --entry ./dist/index.js`
เมื่อการตรวจสอบสำเร็จ จะแสดงข้อความ:

```text
Plugin stock-quotes is valid.
```

ตัวเลือกของ `openclaw plugins init <id>`:

| แฟล็ก                 | ค่าเริ่มต้น            | ผล                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | ไดเรกทอรีเอาต์พุต                       |
| `--name <name>`      | `<id>` แบบขึ้นต้นแต่ละคำด้วยตัวพิมพ์ใหญ่ | ชื่อที่แสดง                           |
| `--type <type>`      | `tool`             | ประเภทโครงเริ่มต้น: `tool` หรือ `provider`    |
| `--force`            | ปิด                | เขียนทับไดเรกทอรีเอาต์พุตที่มีอยู่ |

## เขียนเครื่องมือ

`defineToolPlugin` รับข้อมูลระบุตัวตนของ Plugin สคีมาการกำหนดค่าที่ไม่บังคับ และ
รายการเครื่องมือแบบคงที่ ระบบจะอนุมานประเภทพารามิเตอร์และการกำหนดค่าจาก
สคีมา TypeBox

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

ชื่อเครื่องมือคือ API ที่ต้องคงเสถียร ให้เลือกชื่อที่ไม่ซ้ำ เป็นตัวพิมพ์เล็ก และ
เฉพาะเจาะจงเพียงพอเพื่อหลีกเลี่ยงการชนกับเครื่องมือหลักหรือ Plugin อื่น

## เครื่องมือแบบไม่บังคับและแบบ factory

ตั้งค่า `optional: true` เมื่อผู้ใช้ควรอนุญาตเครื่องมือใน allowlist อย่างชัดเจนก่อน
ส่งไปยังโมเดล `openclaw plugins build` จะเขียนรายการ manifest
`toolMetadata.<tool>.optional` ที่ตรงกัน เพื่อให้ OpenClaw ทราบว่า
เครื่องมือนี้เป็นแบบไม่บังคับโดยไม่ต้องโหลดโค้ดรันไทม์ของ Plugin

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

ใช้ `factory` เมื่อเครื่องมือต้องใช้บริบทเครื่องมือขณะรันไทม์ก่อนจึงจะ
สร้างได้ เช่น เพื่อยกเลิกการใช้งานสำหรับการรันหนึ่งโดยเฉพาะ ตรวจสอบสถานะแซนด์บ็อกซ์ หรือผูก
ตัวช่วยขณะรันไทม์ ข้อมูลเมตาจะยังคงเป็นแบบคงที่ แม้เครื่องมือจริงจะถูกสร้าง
ขณะรันไทม์

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

factory ยังคงต้องประกาศชื่อเครื่องมือคงที่ไว้ล่วงหน้า ใช้ `definePluginEntry`
โดยตรงเมื่อ Plugin คำนวณชื่อเครื่องมือแบบไดนามิก หรือรวมเครื่องมือ
เข้ากับ hook บริการ ผู้ให้บริการ หรือคำสั่ง

## ค่าที่ส่งคืน

`defineToolPlugin` ห่อค่าที่ส่งคืนแบบธรรมดาให้อยู่ในรูปแบบผลลัพธ์เครื่องมือ
ของ OpenClaw:

- ส่งคืนสตริงเมื่อโมเดลควรเห็นข้อความนั้นตรงตามต้นฉบับ
- ส่งคืนค่าที่เข้ากันได้กับ JSON เมื่อต้องการให้โมเดลเห็น JSON ที่จัดรูปแบบแล้ว
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

ใช้เครื่องมือแบบ factory เมื่อต้องการ `AgentToolResult` แบบกำหนดเอง หรือต้องการนำ
การใช้งาน `api.registerTool` ที่มีอยู่กลับมาใช้ซ้ำ

## การกำหนดค่า

`configSchema` เป็นตัวเลือก หากละไว้ OpenClaw จะใช้สคีมาออบเจ็กต์ว่าง
แบบเข้มงวด โดย manifest ที่สร้างขึ้นจะยังคงมี `configSchema`

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

เมื่อมี `configSchema` อาร์กิวเมนต์ `execute` ตัวที่สองจะมีประเภทที่อนุมานจากสคีมานั้น:

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

OpenClaw อ่านการกำหนดค่าของ Plugin จากรายการของ Plugin ในการกำหนดค่า Gateway
อย่าฮาร์ดโค้ดข้อมูลลับในซอร์สโค้ดหรือตัวอย่างเอกสาร ให้ใช้การกำหนดค่า ตัวแปร
สภาพแวดล้อม หรือ SecretRefs ตามโมเดลความปลอดภัยของ Plugin

## ข้อมูลเมตาที่สร้างขึ้น

OpenClaw ต้องอ่าน manifest ของ Plugin ก่อนนำเข้าโค้ดรันไทม์ของ Plugin
`defineToolPlugin` เปิดเผยข้อมูลเมตาแบบคงที่สำหรับจุดประสงค์นี้ และ
`openclaw plugins build` จะเขียนข้อมูลดังกล่าวลงในแพ็กเกจ เรียกใช้ตัวสร้างอีกครั้งหลังจาก
เปลี่ยน id ชื่อ คำอธิบาย สคีมาการกำหนดค่า การเปิดใช้งาน หรือชื่อเครื่องมือ
ของ Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

manifest ที่สร้างขึ้นสำหรับ Plugin ที่มีเครื่องมือหนึ่งรายการ:

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

`contracts.tools` คือสัญญาการค้นพบที่สำคัญ โดยระบุให้ OpenClaw ทราบว่า
Plugin ใดเป็นเจ้าของเครื่องมือแต่ละรายการ โดยไม่ต้องโหลดรันไทม์ของ Plugin ที่ติดตั้งไว้ทุกตัว
manifest ที่ล้าสมัยอาจทำให้เครื่องมือหายไปจากการค้นพบ หรือทำให้ข้อผิดพลาด
ในการลงทะเบียนถูกระบุว่าเกิดจาก Plugin ผิดตัว

## ข้อมูลเมตาของแพ็กเกจ

`openclaw plugins build` ยังปรับ `package.json` ให้ตรงกับจุดเริ่มต้นรันไทม์
ที่เลือก:

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

จัดส่ง JavaScript ที่สร้างแล้ว (`./dist/index.js`) ไม่ใช่จุดเริ่มต้นซอร์ส TypeScript
จุดเริ่มต้นแบบซอร์สใช้ได้เฉพาะการพัฒนาภายในเวิร์กสเปซเท่านั้น

## ตรวจสอบใน CI

`plugins build --check` จะล้มเหลวโดยไม่เขียนไฟล์ใหม่เมื่อข้อมูลเมตาที่สร้างขึ้น
ล้าสมัย:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` ตรวจสอบว่า:

- `openclaw.plugin.json` มีอยู่และผ่านตัวโหลด manifest ตามปกติ
- จุดเริ่มต้นปัจจุบันส่งออกข้อมูลเมตา `defineToolPlugin`
- ฟิลด์ manifest ที่สร้างขึ้นตรงกับข้อมูลเมตาของจุดเริ่มต้น
- `contracts.tools` ตรงกับชื่อเครื่องมือที่ประกาศไว้
- `package.json` ชี้ `openclaw.extensions` ไปยังจุดเริ่มต้นรันไทม์ที่เลือก

## ติดตั้งและตรวจสอบภายในเครื่อง

จาก checkout แยกของ OpenClaw หรือ CLI ที่ติดตั้งแล้ว ให้ติดตั้งพาธแพ็กเกจ:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

สำหรับการทดสอบเบื้องต้นของแพ็กเกจ ให้แพ็กก่อนแล้วติดตั้ง tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

หลังติดตั้ง ให้รีสตาร์ตหรือโหลด Gateway ใหม่ แล้วขอให้เอเจนต์ใช้
เครื่องมือ หากมองไม่เห็นเครื่องมือ ให้ตรวจสอบรันไทม์ของ Plugin และแค็ตตาล็อกเครื่องมือ
ที่มีผลอยู่ก่อนแก้ไขโค้ด (ดู [การแก้ไขปัญหา](#troubleshooting))

## เผยแพร่

เผยแพร่ผ่าน ClawHub เมื่อแพ็กเกจพร้อมแล้ว `clawhub package publish`
รับแหล่งที่มาได้แก่ โฟลเดอร์ภายในเครื่อง รีโพ GitHub (`owner/repo[@ref]`) หรือ
URL ของ tarball

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

ติดตั้งด้วยตัวระบุตำแหน่ง ClawHub ที่ระบุอย่างชัดเจน:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

ข้อกำหนดแพ็กเกจ npm แบบเปล่ายังคงติดตั้งจาก npm ได้ในช่วงเปลี่ยนผ่านการเปิดตัว แต่
ClawHub คือช่องทางที่แนะนำสำหรับการค้นพบและเผยแพร่ Plugin ของ OpenClaw
ดูขอบเขตเจ้าของและการตรวจสอบรุ่นได้ที่ [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)

## การแก้ไขปัญหา

### `plugin entry not found: ./dist/index.js`

ไม่มีไฟล์จุดเริ่มต้นที่เลือก เรียกใช้ `npm run build` แล้วเรียก
`openclaw plugins build --entry ./dist/index.js` หรือ
`openclaw plugins validate --entry ./dist/index.js` อีกครั้ง

### `plugin entry does not expose defineToolPlugin metadata`

จุดเริ่มต้นไม่ได้ส่งออกค่าที่สร้างโดย `defineToolPlugin` ยืนยันว่า
ค่าเริ่มต้นที่โมดูลส่งออกคือผลลัพธ์ `defineToolPlugin(...)` หรือส่ง
จุดเริ่มต้นที่ถูกต้องด้วย `--entry`

### `openclaw.plugin.json generated metadata is stale`

manifest ไม่ตรงกับข้อมูลเมตาของจุดเริ่มต้นอีกต่อไป ให้เรียกใช้:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

คอมมิตการเปลี่ยนแปลงทั้ง `openclaw.plugin.json` และ `package.json`

### `package.json openclaw.extensions must include ./dist/index.js`

ข้อมูลเมตาของแพ็กเกจชี้ไปยังจุดเริ่มต้นรันไทม์อื่น ให้เรียกใช้
`openclaw plugins build --entry ./dist/index.js` เพื่อให้ตัวสร้างปรับ
ข้อมูลเมตาของแพ็กเกจให้ตรงกับจุดเริ่มต้นที่ต้องการจัดส่ง

### `Cannot find package 'typebox'`

Plugin ที่สร้างแล้วนำเข้า `typebox` ขณะรันไทม์ ให้คงไว้ใน `dependencies`
ติดตั้งใหม่ สร้างใหม่ และเรียกใช้การตรวจสอบอีกครั้ง

### เครื่องมือไม่ปรากฏหลังติดตั้ง

ตรวจสอบรายการต่อไปนี้ตามลำดับ:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` มี `contracts.tools` พร้อมชื่อเครื่องมือตามที่คาดไว้
4. `package.json` มี `openclaw.extensions: ["./dist/index.js"]`
5. Gateway ถูกรีสตาร์ตหรือโหลดใหม่หลังจากติดตั้ง Plugin

## ดูเพิ่มเติม

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest)
- [CLI สำหรับ Plugin](/th/cli/plugins)
- [การเผยแพร่บน ClawHub](/th/clawhub/publishing)
