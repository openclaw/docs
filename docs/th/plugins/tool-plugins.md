---
read_when:
    - คุณต้องการสร้าง Plugin OpenClaw แบบเรียบง่ายที่เพิ่มเฉพาะเครื่องมือสำหรับเอเจนต์เท่านั้น
    - คุณต้องการใช้ defineToolPlugin แทนการเขียนข้อมูลเมตาของไฟล์ manifest สำหรับ Plugin ด้วยตนเอง
    - คุณต้องสร้างโครงเริ่มต้น สร้าง ตรวจสอบความถูกต้อง ทดสอบ หรือเผยแพร่ Plugin ที่มีเฉพาะเครื่องมือ
sidebarTitle: Tool Plugins
summary: สร้างเครื่องมือเอเจนต์แบบมีชนิดข้อมูลอย่างง่ายด้วย defineToolPlugin และ openclaw plugins init/build/validate
title: Plugin เครื่องมือ
x-i18n:
    generated_at: "2026-07-19T07:56:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6363ccc810e969e1efa2aa0b4208f27244f01db196713fc2dc25cf106b86429
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` สร้าง Plugin ที่เพิ่มเฉพาะเครื่องมือที่เอเจนต์เรียกใช้ได้เท่านั้น โดยไม่มี
ช่องทาง ผู้ให้บริการโมเดล ฮุก บริการ หรือแบ็กเอนด์การตั้งค่า และสร้าง
เมทาดาทาของแมนิเฟสต์ที่ OpenClaw ต้องใช้เพื่อค้นหาเครื่องมือโดยไม่ต้องโหลดโค้ดรันไทม์
ของ Plugin

สำหรับ Plugin ที่มีผู้ให้บริการ ช่องทาง ฮุก บริการ หรือความสามารถแบบผสม ให้เริ่มจาก
[การสร้าง Plugin](/th/plugins/building-plugins), [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
หรือ [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน

## ข้อกำหนด

- Node 22.22.3+, Node 24.15+ หรือ Node 25.9+
- เอาต์พุตแพ็กเกจ TypeScript ESM
- `typebox` ใน `dependencies` (ไม่ใช่เพียง `devDependencies` เพราะ Plugin ที่สร้างขึ้น
  จะนำเข้าแพ็กเกจนี้ขณะรันไทม์)
- `openclaw >=2026.5.17` ซึ่งเป็นเวอร์ชันแรกที่ส่งออก
  `openclaw/plugin-sdk/tool-plugin`
- รากแพ็กเกจที่เผยแพร่ `dist/`, `openclaw.plugin.json` และ
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

`plugins init` สร้างโครงร่างดังนี้:

| ไฟล์                   | วัตถุประสงค์                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | จุดเริ่มต้น `defineToolPlugin` ที่มีเครื่องมือ `echo` หนึ่งรายการ                     |
| `src/index.test.ts`    | การทดสอบเมทาดาทาที่ยืนยันรายการเครื่องมือ                             |
| `tsconfig.json`        | เอาต์พุต TypeScript แบบ NodeNext ไปยัง `dist/`                             |
| `vitest.config.ts`     | การกำหนดค่า Vitest สำหรับ `src/**/*.test.ts`                              |
| `package.json`         | สคริปต์ การขึ้นต่อกันขณะรันไทม์ และ `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | เมทาดาทาของแมนิเฟสต์ที่สร้างขึ้นสำหรับเครื่องมือเริ่มต้น                  |

`npm run plugin:build` เรียกใช้ `npm run build` (tsc) แล้วตามด้วย
`openclaw plugins build --entry ./dist/index.js` ส่วน `npm run plugin:validate`
จะสร้างใหม่และเรียกใช้ `openclaw plugins validate --entry ./dist/index.js`
เมื่อการตรวจสอบสำเร็จ จะแสดงข้อความ:

```text
Plugin stock-quotes ใช้งานได้
```

ตัวเลือกของ `openclaw plugins init <id>`:

| แฟล็ก                 | ค่าเริ่มต้น            | ผลลัพธ์                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | ไดเรกทอรีเอาต์พุต                       |
| `--name <name>`      | `<id>` แบบตัวพิมพ์ชื่อเรื่อง | ชื่อที่แสดง                           |
| `--type <type>`      | `tool`             | ประเภทโครงร่าง: `tool` หรือ `provider`    |
| `--force`            | ปิด                | เขียนทับไดเรกทอรีเอาต์พุตที่มีอยู่ |

## เขียนเครื่องมือ

`defineToolPlugin` รับข้อมูลระบุตัวตนของ Plugin สคีมาการกำหนดค่าที่ไม่บังคับ และ
รายการเครื่องมือแบบคงที่ โดยอนุมานประเภทพารามิเตอร์และการกำหนดค่าจาก
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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
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

ชื่อเครื่องมือคือ API ที่เสถียร ควรเลือกชื่อที่ไม่ซ้ำ เป็นตัวพิมพ์เล็ก และ
เฉพาะเจาะจงเพียงพอที่จะหลีกเลี่ยงการชนกับเครื่องมือหลักหรือ Plugin อื่น

## เครื่องมือแบบไม่บังคับและเครื่องมือแบบแฟกทอรี

ตั้งค่า `optional: true` เมื่อผู้ใช้ควรอนุญาตเครื่องมือนี้ในรายการที่อนุญาตอย่างชัดเจนก่อน
ส่งไปยังโมเดล โดย `openclaw plugins build` จะเขียนรายการแมนิเฟสต์
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

ใช้ `factory` เมื่อเครื่องมือต้องใช้บริบทเครื่องมือขณะรันไทม์ก่อนที่จะ
สร้างได้ เช่น เพื่อเลือกไม่ใช้สำหรับการรันเฉพาะครั้ง ตรวจสอบสถานะแซนด์บ็อกซ์ หรือผูก
ตัวช่วยขณะรันไทม์ เมทาดาทายังคงเป็นแบบคงที่แม้ว่าเครื่องมือจริงจะสร้างขึ้น
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

แฟกทอรียังคงประกาศชื่อเครื่องมือแบบตายตัวไว้ล่วงหน้า ใช้ `definePluginEntry`
โดยตรงเมื่อ Plugin คำนวณชื่อเครื่องมือแบบไดนามิก หรือรวมเครื่องมือ
เข้ากับฮุก บริการ ผู้ให้บริการ หรือคำสั่ง

## ค่าที่ส่งคืน

`defineToolPlugin` ห่อค่าที่ส่งคืนแบบธรรมดาให้อยู่ในรูปแบบผลลัพธ์เครื่องมือ
ของ OpenClaw:

- ส่งคืนสตริงเมื่อควรให้โมเดลเห็นข้อความนั้นตรงตามต้นฉบับ
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

ใช้เครื่องมือแบบแฟกทอรีเมื่อต้องการ `AgentToolResult` แบบกำหนดเอง หรือต้องการนำ
การใช้งาน `api.registerTool` ที่มีอยู่กลับมาใช้ใหม่

## สัญญาเอาต์พุต

เพิ่ม `outputSchema` เมื่อเครื่องมือส่งคืนข้อมูลที่เข้ากันได้กับ JSON และมีความเสถียร ค่านี้อธิบาย
ค่าต้นฉบับที่เก็บไว้ใน `AgentToolResult.details` ไม่ใช่ข้อความที่จัดรูปแบบแล้ว
ใน `content`:

```typescript
tool({
  name: "shipment_list",
  description: "List shipments.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[โหมดโค้ด](/tools/code-mode) และ [การค้นหาเครื่องมือ](/th/tools/tool-search) เปลี่ยน
สคีมานี้ให้เป็นคำแนะนำเอาต์พุตแบบ TypeScript ที่มีขอบเขต ซึ่งช่วยให้โมเดลเรียกใช้และ
แปลงผลลัพธ์ที่ทราบได้ในโปรแกรมเดียว แทนที่จะใช้การโต้ตอบกับโมเดลอีกหนึ่งรอบ
เพื่อสังเกตรูปแบบของผลลัพธ์

OpenClaw คอมไพล์สคีมาก่อนเรียกใช้แค็ตตาล็อก จากนั้นตรวจสอบ
ค่า `details` สุดท้ายหลังฮุกของเครื่องมือ ก่อนส่งคืนผ่านบริดจ์
สคีมาที่ไม่ถูกต้องไม่สามารถเรียกใช้เครื่องมือได้ ส่วนผลลัพธ์ที่ไม่ตรงกันจะทำให้การเรียก
ที่เสร็จสมบูรณ์ล้มเหลว ให้รวมรูปแบบผลลัพธ์ทั้งหมดที่ไม่โยนข้อยกเว้น รวมถึงรูปแบบข้อผิดพลาด
แบบมีโครงสร้าง หรือไม่ต้องระบุสคีมาหากผลลัพธ์ไม่เสถียร ห้ามใส่ข้อมูลลับ
หรือค่าที่ละเอียดอ่อนในคำอธิบายสคีมา เพราะเมทาดาทาเอาต์พุตที่เชื่อถือได้อาจ
ปรากฏต่อโมเดลได้
ใช้ `{ additionalProperties: false }` ในชั้นออบเจ็กต์เมื่อต้องการคำแนะนำเอาต์พุต
แบบกะทัดรัดและครบถ้วน สคีมาแบบเปิดหรือแบบตัดทอนยังคงเข้าถึงได้ผ่าน
`tools.describe(...)` แต่จะไม่ถูกประกาศว่าเป็นสัญญาดัชนีด่วนที่ครบถ้วน

เครื่องมือแบบแฟกทอรีประกาศ `outputSchema` บน `AnyAgentTool` จริงที่
ส่งคืน การประกาศ `tool({ factory })` แบบคงที่ไม่รับ
สคีมาเอาต์พุตแยกต่างหาก เพราะอาจไม่สอดคล้องกับเครื่องมือขณะรันไทม์

## การกำหนดค่า

`configSchema` เป็นตัวเลือก ไม่ต้องระบุค่านี้ แล้ว OpenClaw จะใช้สคีมาออบเจ็กต์ว่าง
แบบเข้มงวด โดยแมนิเฟสต์ที่สร้างขึ้นยังคงมี `configSchema`

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

เมื่อมี `configSchema` อาร์กิวเมนต์ `execute` ตัวที่สองจะกำหนดประเภทจากค่านี้:

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

OpenClaw อ่านการกำหนดค่า Plugin จากรายการของ Plugin ในการกำหนดค่า Gateway
ห้ามฝังข้อมูลลับไว้ในซอร์สโค้ดหรือตัวอย่างเอกสาร ให้ใช้การกำหนดค่า ตัวแปร
สภาพแวดล้อม หรือ SecretRefs ตามโมเดลความปลอดภัยของ Plugin

## เมทาดาทาที่สร้างขึ้น

OpenClaw ต้องอ่านแมนิเฟสต์ของ Plugin ก่อนนำเข้าโค้ดรันไทม์ของ Plugin
`defineToolPlugin` เปิดเผยเมทาดาทาแบบคงที่เพื่อจุดประสงค์นี้ และ
`openclaw plugins build` เขียนเมทาดาทาดังกล่าวลงในแพ็กเกจ เรียกใช้ตัวสร้างอีกครั้งหลังจาก
เปลี่ยนรหัส ชื่อ คำอธิบาย สคีมาการกำหนดค่า การเปิดใช้งาน หรือชื่อเครื่องมือ
ของ Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

แมนิเฟสต์ที่สร้างขึ้นสำหรับ Plugin ที่มีเครื่องมือหนึ่งรายการ:

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

`contracts.tools` คือสัญญาการค้นพบที่สำคัญ โดยบอก OpenClaw ว่า Plugin ใด
เป็นเจ้าของแต่ละเครื่องมือ โดยไม่ต้องโหลดรันไทม์ของ Plugin ที่ติดตั้งทุกตัว
แมนิเฟสต์ที่ล้าสมัยอาจทำให้เครื่องมือหายไปจากการค้นพบ หรือทำให้ข้อผิดพลาด
ในการลงทะเบียนถูกระบุว่าเกิดจาก Plugin ผิดตัว

## เมทาดาทาแพ็กเกจ

`openclaw plugins build` ยังปรับ `package.json` ให้สอดคล้องกับจุดเริ่มต้นขณะรันไทม์
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

เผยแพร่ JavaScript ที่สร้างแล้ว (`./dist/index.js`) ไม่ใช่จุดเริ่มต้นซอร์ส TypeScript
จุดเริ่มต้นจากซอร์สใช้ได้เฉพาะการพัฒนาภายในเวิร์กสเปซเท่านั้น

## ตรวจสอบใน CI

`plugins build --check` จะล้มเหลวโดยไม่เขียนไฟล์ใหม่เมื่อเมทาดาทาที่สร้างขึ้น
ล้าสมัย:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` ตรวจสอบว่า:

- `openclaw.plugin.json` มีอยู่และผ่านตัวโหลดแมนิเฟสต์ตามปกติ
- จุดเริ่มต้นปัจจุบันส่งออกเมทาดาทา `defineToolPlugin`
- ฟิลด์แมนิเฟสต์ที่สร้างขึ้นตรงกับเมทาดาทาของจุดเริ่มต้น
- `contracts.tools` ตรงกับชื่อเครื่องมือที่ประกาศไว้
- `package.json` ชี้ `openclaw.extensions` ไปยังจุดเริ่มต้นขณะรันไทม์ที่เลือก

## ติดตั้งและตรวจสอบภายในเครื่อง

จากเช็กเอาต์ OpenClaw แยกต่างหากหรือ CLI ที่ติดตั้งแล้ว ให้ติดตั้งพาธแพ็กเกจ:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

สำหรับการทดสอบเบื้องต้นของแพ็กเกจ ให้แพ็กก่อนแล้วจึงติดตั้งทาร์บอล:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

หลังจากติดตั้ง ให้รีสตาร์ตหรือโหลด Gateway ใหม่ แล้วขอให้เอเจนต์ใช้
เครื่องมือ หากมองไม่เห็นเครื่องมือ ให้ตรวจสอบรันไทม์ของ Plugin และแค็ตตาล็อก
เครื่องมือที่มีผลบังคับใช้ก่อนแก้ไขโค้ด (ดู [การแก้ไขปัญหา](#troubleshooting))

## การเผยแพร่

เผยแพร่ผ่าน ClawHub เมื่อแพ็กเกจพร้อมแล้ว `clawhub package publish`
รับแหล่งที่มาได้แก่ โฟลเดอร์ในเครื่อง, ที่เก็บ GitHub (`owner/repo[@ref]`) หรือ
URL ของ tarball

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

ติดตั้งโดยใช้ตัวระบุตำแหน่ง ClawHub ที่ชัดเจน:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

ข้อกำหนดแพ็กเกจ npm แบบเปล่ายังคงติดตั้งจาก npm ในช่วงเปลี่ยนผ่านการเปิดตัว แต่
ClawHub เป็นช่องทางที่แนะนำสำหรับการค้นพบและเผยแพร่ Plugin ของ OpenClaw
ดูขอบเขตเจ้าของและการรีวิวรุ่นเผยแพร่ที่ [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)

## การแก้ไขปัญหา

### `plugin entry not found: ./dist/index.js`

ไม่มีไฟล์รายการเข้าที่เลือกไว้ เรียกใช้ `npm run build` แล้วเรียกใช้
`openclaw plugins build --entry ./dist/index.js` หรือ
`openclaw plugins validate --entry ./dist/index.js` อีกครั้ง

### `plugin entry does not expose defineToolPlugin metadata`

รายการเข้าไม่ได้ส่งออกค่าที่สร้างโดย `defineToolPlugin` ยืนยันว่า
การส่งออกเริ่มต้นของโมดูลเป็นผลลัพธ์จาก `defineToolPlugin(...)` หรือส่ง
รายการเข้าที่ถูกต้องด้วย `--entry`

### `openclaw.plugin.json generated metadata is stale`

ไฟล์กำกับไม่ตรงกับข้อมูลเมตาของรายการเข้าอีกต่อไป เรียกใช้:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

คอมมิตการเปลี่ยนแปลงทั้ง `openclaw.plugin.json` และ `package.json`

### `package.json openclaw.extensions must include ./dist/index.js`

ข้อมูลเมตาของแพ็กเกจชี้ไปยังรายการเข้ารันไทม์อื่น เรียกใช้
`openclaw plugins build --entry ./dist/index.js` เพื่อให้ตัวสร้างปรับ
ข้อมูลเมตาของแพ็กเกจให้ตรงกับรายการเข้าที่ต้องการจัดส่ง

### `Cannot find package 'typebox'`

Plugin ที่สร้างแล้วนำเข้า `typebox` ขณะรันไทม์ ให้เก็บไว้ใน `dependencies`
ติดตั้งใหม่ สร้างใหม่ และเรียกใช้การตรวจสอบอีกครั้ง

### เครื่องมือไม่ปรากฏหลังการติดตั้ง

ตรวจสอบสิ่งต่อไปนี้ตามลำดับ:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` มี `contracts.tools` พร้อมชื่อเครื่องมือที่คาดไว้
4. `package.json` มี `openclaw.extensions: ["./dist/index.js"]`
5. Gateway ได้รับการรีสตาร์ตหรือโหลดใหม่หลังจากติดตั้ง Plugin

## ดูเพิ่มเติม

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [จุดเข้าของ Plugin](/th/plugins/sdk-entrypoints)
- [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- [ไฟล์กำกับ Plugin](/th/plugins/manifest)
- [CLI สำหรับ Plugin](/th/cli/plugins)
- [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)
