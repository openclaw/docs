---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin ใหม่ของ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารเกี่ยวกับช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-07-04T15:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ได้โดยไม่ต้องเปลี่ยน core. Plugin สามารถเพิ่มช่องทางการส่งข้อความ, model provider, backend CLI ภายในเครื่อง, เครื่องมือของเอเจนต์, hook, media provider, หรือความสามารถอื่นที่ Plugin เป็นเจ้าของได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ภายนอกเข้าใน repository ของ OpenClaw เผยแพร่ package ไปยัง [ClawHub](/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

สเปก package แบบเปล่ายังคงติดตั้งจาก npm ได้ระหว่างช่วงเปลี่ยนผ่านของการเปิดตัว ใช้ prefix `clawhub:` เมื่อคุณต้องการให้ resolve ผ่าน ClawHub

## ข้อกำหนด

- ใช้ Node 22.19+, Node 23.11+, หรือ Node 24+ และ package manager เช่น `npm` หรือ `pnpm`
- คุ้นเคยกับโมดูล TypeScript ESM
- สำหรับงาน Plugin แบบ bundled ใน repo ให้ clone repository แล้วรัน `pnpm install`
  การพัฒนา Plugin จาก source checkout ใช้ได้เฉพาะ pnpm เพราะ OpenClaw โหลด bundled
  plugins จาก package ใน workspace `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มการส่งข้อความ
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่ม provider สำหรับ model, media, search, fetch, speech, หรือ realtime
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/th/plugins/cli-backend-plugins">
    รัน AI CLI ภายในเครื่องผ่าน model fallback ของ OpenClaw
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/th/plugins/tool-plugins">
    ลงทะเบียนเครื่องมือของเอเจนต์
  </Card>
</CardGroup>

## Quickstart

สร้าง Plugin เครื่องมือขั้นต่ำโดยลงทะเบียนเครื่องมือเอเจนต์ที่จำเป็นหนึ่งรายการ นี่คือ
รูปแบบ Plugin ที่มีประโยชน์และสั้นที่สุด และแสดง package, manifest, entry point, และ
การพิสูจน์ภายในเครื่อง

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugin ภายนอกที่เผยแพร่แล้วควรชี้ runtime entries ไปยังไฟล์ JavaScript
    ที่ build แล้ว ดู [SDK entry points](/th/plugins/sdk-entrypoints) สำหรับ contract
    ของ entry point ฉบับเต็ม

    ทุก Plugin ต้องมี manifest แม้จะไม่มี config ก็ตาม เครื่องมือ runtime
    ต้องปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบความเป็นเจ้าของได้โดยไม่ต้อง
    โหลด runtime ของทุก Plugin ล่วงหน้า ตั้งค่า `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้เริ่มทำงานเมื่อ Gateway เริ่มต้น

    พื้นผิว Plugin ที่ host เชื่อถือได้ยังถูกควบคุมด้วย manifest และต้องเปิดใช้งาน
    อย่างชัดเจนสำหรับ Plugin ที่ติดตั้งแล้ว หาก Plugin ที่ติดตั้งลงทะเบียน
    `api.registerAgentToolResultMiddleware(...)` ให้ประกาศ runtime เป้าหมายแต่ละรายการใน
    `contracts.agentToolResultMiddleware` หากลงทะเบียน
    `api.registerTrustedToolPolicy(...)` ให้ประกาศ policy id แต่ละรายการใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ทำให้การตรวจสอบตอนติดตั้ง
    และการลงทะเบียน runtime สอดคล้องกัน

    สำหรับ field ทั้งหมดของ manifest ดู [Plugin manifest](/th/plugins/manifest)

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    ใช้ `definePluginEntry` สำหรับ Plugin ที่ไม่ใช่ช่องทาง Channel plugins ใช้
    `defineChannelPluginEntry`

  </Step>

  <Step title="Test the runtime">
    สำหรับ Plugin ที่ติดตั้งแล้วหรือ Plugin ภายนอก ให้ตรวจสอบ runtime ที่โหลดแล้ว:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    หาก Plugin ลงทะเบียนคำสั่ง CLI ให้รันคำสั่งนั้นด้วย ตัวอย่างเช่น
    คำสั่ง demo ควรมีหลักฐานการรัน เช่น
    `openclaw demo-plugin ping`

    สำหรับ bundled Plugin ใน repository นี้ OpenClaw จะค้นพบ package ของ Plugin
    จาก source-checkout ใน workspace `extensions/*` รันการทดสอบที่เจาะจงใกล้ที่สุด:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    ก่อนเผยแพร่ Plugin ที่พร้อมเป็น package ให้ทดสอบรูปแบบการติดตั้งเดียวกับที่ผู้ใช้
    จะได้รับ ก่อนอื่นเพิ่มขั้นตอน build, ชี้ runtime entries เช่น
    `openclaw.extensions` ไปยัง JavaScript ที่ build แล้วอย่าง `./dist/index.js`, และตรวจสอบให้แน่ใจว่า
    `npm pack` รวม output `dist/` นั้นไว้ด้วย entry ของ source TypeScript
    ใช้สำหรับ source checkouts และเส้นทางการพัฒนาภายในเครื่องเท่านั้น

    จากนั้น pack Plugin แล้วติดตั้ง tarball ด้วย `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` ใช้ project npm ต่อ Plugin ที่ OpenClaw จัดการให้ จึงตรวจจับ
    ข้อผิดพลาดของ dependency ตอน runtime ที่การทดสอบด้วย source checkout อาจซ่อนไว้ได้ มันพิสูจน์
    รูปแบบของ package และ dependency ไม่ใช่ความน่าเชื่อถืออย่างเป็นทางการที่เชื่อมกับ catalog
    runtime imports ต้องอยู่ใน `dependencies` หรือ `optionalDependencies`;
    dependencies ที่เหลือไว้เฉพาะใน `devDependencies` จะไม่ถูกติดตั้งสำหรับ
    managed runtime project

    อย่าใช้การติดตั้ง archive/path แบบดิบเป็นหลักฐานสุดท้ายสำหรับพฤติกรรมของ Plugin
    แบบ official หรือ privileged source ดิบมีประโยชน์สำหรับการ debug ภายในเครื่อง แต่
    ไม่ได้พิสูจน์เส้นทาง dependency เดียวกับการติดตั้งผ่าน npm หรือ ClawHub หาก
    Plugin ของคุณอาศัยสถานะ Plugin official ที่เชื่อถือได้ ให้เพิ่มหลักฐานที่สอง
    ผ่านการติดตั้ง official ที่มี catalog รองรับ หรือเส้นทาง package ที่เผยแพร่แล้วซึ่ง
    บันทึกความน่าเชื่อถือแบบ official ดู
    [Plugin dependency resolution](/th/plugins/dependency-resolution) สำหรับรายละเอียด
    install-root และความเป็นเจ้าของ dependency

  </Step>

  <Step title="Publish">
    ตรวจสอบ package ก่อนเผยแพร่:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    snippet ของ ClawHub ที่เป็น canonical อยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="Install">
    ติดตั้ง package ที่เผยแพร่แล้วผ่าน ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## การลงทะเบียนเครื่องมือ

เครื่องมืออาจเป็นแบบจำเป็นหรือ optional เครื่องมือที่จำเป็นจะพร้อมใช้งานเสมอเมื่อ
เปิดใช้ Plugin เครื่องมือ optional ต้องให้ผู้ใช้ opt in

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

ทุกเครื่องมือที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องถูกประกาศใน
manifest ของ Plugin ด้วย:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

ผู้ใช้ opt in ด้วย `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

เครื่องมือ optional ควบคุมว่าเครื่องมือจะถูกเปิดเผยต่อ model หรือไม่ ใช้
[plugin permission requests](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือ hook ควรขอการอนุมัติหลังจาก model เลือกแล้วและก่อนที่
action จะทำงาน

ใช้เครื่องมือ optional สำหรับ side effects, binary ที่ไม่ปกติ, หรือความสามารถที่
ไม่ควรถูกเปิดเผยเป็นค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือ core;
รายการที่ชนจะถูกข้ามและรายงานใน diagnostics ของ Plugin การลงทะเบียนที่ malformed
รวมถึง tool descriptors ที่ไม่มี `parameters` จะถูกข้ามและ
รายงานในลักษณะเดียวกัน เครื่องมือที่ลงทะเบียนคือ typed functions ที่ model เรียกใช้ได้
หลังจาก policy และ allowlist checks ผ่านแล้ว

tool factories จะได้รับ object context ที่ runtime จัดหาให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้อง log, แสดงผล, หรือปรับตาม model ที่ active สำหรับ turn ปัจจุบัน
object อาจมี `provider`, `modelId`, และ `modelRef` ให้ถือว่าเป็น
metadata runtime เพื่อข้อมูล ไม่ใช่ boundary ด้านความปลอดภัยจาก local
operator, โค้ด Plugin ที่ติดตั้งแล้ว, หรือ runtime ของ OpenClaw ที่ถูกแก้ไข เครื่องมือภายในเครื่อง
ที่ละเอียดอ่อนยังควรต้องมีการ opt-in จาก Plugin หรือ operator อย่างชัดเจน และ fail closed
เมื่อ metadata ของ active-model ขาดหายหรือไม่เหมาะสม

manifest ประกาศความเป็นเจ้าของและการค้นพบ ส่วนการ execute ยังคงเรียกใช้
implementation ของเครื่องมือที่ลงทะเบียนแบบ live รักษา `toolMetadata.<tool>.optional: true`
ให้สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยง
การโหลด runtime ของ Plugin นั้นจนกว่าเครื่องมือจะถูก allowlist อย่างชัดเจน

## แบบแผนการ import

Import จาก SDK subpaths ที่เจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

อย่า import จาก root barrel ที่ deprecated:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

ภายใน package ของ Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับ internal imports อย่า import Plugin ของคุณเองผ่าน
SDK path helper เฉพาะ provider ควรอยู่ใน package ของ provider เว้นแต่
แนวเชื่อมต่อจะเป็น generic จริง ๆ

Custom Gateway RPC methods เป็น entry point ขั้นสูง เก็บไว้บน
prefix เฉพาะ Plugin; namespace ของ core admin เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, และ `update.*` ยังสงวนไว้
และ resolve ไปยัง `operator.admin` bridge
`openclaw/plugin-sdk/gateway-method-runtime` สงวนไว้สำหรับ HTTP routes ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

สำหรับ import map ฉบับเต็ม ดู [Plugin SDK overview](/th/plugins/sdk-overview)

## Checklist ก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>manifest **openclaw.plugin.json** มีอยู่และถูกต้อง</Check>
<Check>entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>imports ทั้งหมดใช้ path แบบเจาะจง `plugin-sdk/<subpath>`</Check>
<Check>internal imports ใช้โมดูลภายในเครื่อง ไม่ใช่ SDK self-imports</Check>
<Check>tests ผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ใน repo)</Check>

## ทดสอบกับ beta releases

1. คอยติดตามแท็กรีลีสบน GitHub ที่ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครรับข้อมูลผ่าน `Watch` > `Releases` แท็กเบต้าจะมีรูปแบบเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X อย่างเป็นทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศรีลีสได้ด้วย
2. ทดสอบ Plugin ของคุณกับแท็กเบต้าทันทีที่ปรากฏ ช่วงเวลาก่อน stable มักมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยระบุว่า `all good` หรือสิ่งที่เสีย หากคุณยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ที่มีชื่อว่า `Beta blocker: <plugin-name> - <summary>` และใส่ป้ายกำกับ `beta-blocker` ใส่ลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยใช้ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ของคุณ ผู้มีส่วนร่วมไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ตัวบล็อกที่มี PR จะถูก merge ส่วนตัวบล็อกที่ไม่มี PR อาจถูกปล่อยไปพร้อมรีลีสอยู่ดี ผู้ดูแลจะคอยดูเธรดเหล่านี้ระหว่างการทดสอบเบต้า
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณน่าจะเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางรับส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/th/plugins/cli-backend-plugins">
    ลงทะเบียนแบ็กเอนด์ AI CLI ในเครื่อง
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/th/plugins/sdk-overview">
    เอกสารอ้างอิง import map และ API การลงทะเบียน
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิง schema ของ manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [ฮุกของ Plugin](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
