---
doc-schema-version: 1
read_when:
    - คุณต้องการสร้าง Plugin OpenClaw ใหม่
    - คุณต้องการคู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเลือกระหว่างเอกสารของช่องทาง ผู้ให้บริการ แบ็กเอนด์ CLI เครื่องมือ หรือฮุก
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยายความสามารถของ OpenClaw โดยไม่ต้องเปลี่ยน core Plugin สามารถเพิ่มช่องทางรับส่งข้อความ,
ผู้ให้บริการโมเดล, แบ็กเอนด์ CLI ในเครื่อง, เครื่องมือของเอเจนต์, hook, ผู้ให้บริการสื่อ,
หรือความสามารถอื่นที่ Plugin เป็นเจ้าของได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ภายนอกเข้าไปใน repository ของ OpenClaw เผยแพร่
แพ็กเกจไปยัง [ClawHub](/th/clawhub) แล้วผู้ใช้ติดตั้งด้วย:

```bash
openclaw plugins install clawhub:<package-name>
```

สเป็กแพ็กเกจแบบเปล่ายังคงติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้
คำนำหน้า `clawhub:` เมื่อคุณต้องการให้ resolve ผ่าน ClawHub

## ข้อกำหนด

- ใช้ Node 22.19 หรือใหม่กว่า และตัวจัดการแพ็กเกจ เช่น `npm` หรือ `pnpm`
- คุ้นเคยกับโมดูล TypeScript ESM
- สำหรับงาน Plugin ที่ bundled อยู่ใน repo ให้ clone repository แล้วรัน `pnpm install`
  การพัฒนา Plugin จาก source checkout ใช้ได้เฉพาะ pnpm เท่านั้น เพราะ OpenClaw โหลด Plugin ที่ bundled
  จากแพ็กเกจ workspace ใน `extensions/*`

## เลือกรูปแบบ Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล, สื่อ, การค้นหา, การดึงข้อมูล, เสียงพูด หรือ realtime
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/th/plugins/cli-backend-plugins">
    รัน AI CLI ในเครื่องผ่าน fallback โมเดลของ OpenClaw
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/th/plugins/tool-plugins">
    ลงทะเบียนเครื่องมือของเอเจนต์
  </Card>
</CardGroup>

## เริ่มต้นอย่างรวดเร็ว

สร้าง Plugin เครื่องมือแบบน้อยที่สุดโดยลงทะเบียนเครื่องมือของเอเจนต์ที่จำเป็นหนึ่งรายการ นี่คือ
รูปแบบ Plugin ที่สั้นที่สุดแต่ยังมีประโยชน์ และแสดงแพ็กเกจ, manifest, entry point และ
หลักฐานในเครื่อง

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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

    Plugin ภายนอกที่เผยแพร่แล้วควรชี้ runtime entries ไปยังไฟล์ JavaScript ที่ build แล้ว
    ดู [SDK entry points](/th/plugins/sdk-entrypoints) สำหรับสัญญา entry
    point ฉบับเต็ม

    ทุก Plugin ต้องมี manifest แม้จะไม่มี config ก็ตาม เครื่องมือ runtime
    ต้องปรากฏใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบความเป็นเจ้าของได้โดยไม่ต้อง
    โหลด runtime ของทุก Plugin ล่วงหน้า ตั้งค่า `activation.onStartup`
    อย่างตั้งใจ ตัวอย่างนี้เริ่มทำงานเมื่อ Gateway เริ่มต้น

    พื้นผิวของ Plugin ที่ host เชื่อถือยังถูก gate ด้วย manifest และต้องเปิดใช้อย่างชัดเจน
    สำหรับ Plugin ที่ติดตั้งแล้วด้วย หาก Plugin ที่ติดตั้งลงทะเบียน
    `api.registerAgentToolResultMiddleware(...)` ให้ประกาศ runtime เป้าหมายแต่ละรายการใน
    `contracts.agentToolResultMiddleware` หากลงทะเบียน
    `api.registerTrustedToolPolicy(...)` ให้ประกาศ policy id แต่ละรายการใน
    `contracts.trustedToolPolicies` การประกาศเหล่านี้ทำให้การตรวจสอบตอนติดตั้ง
    และการลงทะเบียน runtime สอดคล้องกัน

    สำหรับทุกฟิลด์ของ manifest ดู [Plugin manifest](/th/plugins/manifest)

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

    ใช้ `definePluginEntry` สำหรับ Plugin ที่ไม่ใช่ channel Plugin แบบ channel ใช้
    `defineChannelPluginEntry`

  </Step>

  <Step title="Test the runtime">
    สำหรับ Plugin ที่ติดตั้งแล้วหรือ Plugin ภายนอก ให้ตรวจสอบ runtime ที่โหลดแล้ว:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    หาก Plugin ลงทะเบียนคำสั่ง CLI ให้รันคำสั่งนั้นด้วย ตัวอย่างเช่น
    คำสั่งเดโมควรมีหลักฐานการรัน เช่น
    `openclaw demo-plugin ping`

    สำหรับ Plugin ที่ bundled ใน repository นี้ OpenClaw จะค้นพบแพ็กเกจ Plugin แบบ source-checkout
    จาก workspace `extensions/*` รันการทดสอบแบบเจาะจงที่ใกล้ที่สุด:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    ตรวจสอบแพ็กเกจก่อนเผยแพร่:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    snippet มาตรฐานของ ClawHub อยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="Install">
    ติดตั้งแพ็กเกจที่เผยแพร่แล้วผ่าน ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## การลงทะเบียนเครื่องมือ

เครื่องมืออาจเป็นแบบจำเป็นหรือไม่บังคับ เครื่องมือที่จำเป็นจะพร้อมใช้งานเสมอเมื่อ
Plugin เปิดใช้งาน เครื่องมือที่ไม่บังคับต้องให้ผู้ใช้เลือกเปิดใช้

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

ทุกเครื่องมือที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศใน
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

ผู้ใช้เลือกเปิดใช้ด้วย `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

เครื่องมือที่ไม่บังคับควบคุมว่าเครื่องมือถูกเปิดเผยต่อโมเดลหรือไม่ ใช้
[คำขอสิทธิ์ของ Plugin](/th/plugins/plugin-permission-requests) เมื่อเครื่องมือ
หรือ hook ควรขออนุมัติหลังจากโมเดลเลือกแล้วและก่อนที่
การกระทำจะรัน

ใช้เครื่องมือที่ไม่บังคับสำหรับ side effect, binary ที่ไม่ปกติ หรือความสามารถที่
ไม่ควรถูกเปิดเผยโดยค่าเริ่มต้น ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือ core;
รายการที่ชนกันจะถูกข้ามและรายงานใน diagnostics ของ Plugin การลงทะเบียนที่มีรูปแบบผิด
รวมถึง descriptor ของเครื่องมือที่ไม่มี `parameters` จะถูกข้ามและ
รายงานแบบเดียวกัน เครื่องมือที่ลงทะเบียนคือฟังก์ชันที่มี type ซึ่งโมเดลเรียกได้
หลังจากผ่านการตรวจสอบ policy และ allowlist แล้ว

factory ของเครื่องมือจะได้รับออบเจ็กต์ context ที่ runtime ส่งให้ ใช้ `ctx.activeModel`
เมื่อเครื่องมือต้อง log, แสดงผล หรือปรับให้เข้ากับโมเดลที่ active สำหรับ
turn ปัจจุบัน ออบเจ็กต์นี้อาจมี `provider`, `modelId` และ `modelRef` ให้ถือว่าเป็น
metadata runtime เพื่อข้อมูลเท่านั้น ไม่ใช่ขอบเขตความปลอดภัยต่อ operator ในเครื่อง,
โค้ด Plugin ที่ติดตั้งแล้ว หรือ runtime ของ OpenClaw ที่ถูกแก้ไข เครื่องมือในเครื่องที่อ่อนไหว
ยังควรกำหนดให้ต้องมีการ opt-in จาก Plugin หรือ operator อย่างชัดเจน และ fail closed
เมื่อ metadata ของ active-model ขาดหายหรือไม่เหมาะสม

manifest ประกาศความเป็นเจ้าของและการค้นพบ; การรันยังคงเรียก implementation ของเครื่องมือที่ลงทะเบียนแบบ live
รักษา `toolMetadata.<tool>.optional: true`
ให้สอดคล้องกับ `api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยง
การโหลด runtime ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มเข้า allowlist อย่างชัดเจน

## ข้อกำหนดการ import

Import จาก subpath ของ SDK ที่เจาะจง:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

อย่า import จาก root barrel ที่ deprecated แล้ว:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

ภายในแพ็กเกจ Plugin ของคุณ ให้ใช้ไฟล์ barrel ในเครื่อง เช่น `api.ts` และ
`runtime-api.ts` สำหรับ internal imports อย่า import Plugin ของคุณเองผ่าน
path ของ SDK helper เฉพาะ provider ควรอยู่ในแพ็กเกจ provider เว้นแต่
จุดเชื่อมต่อจะเป็นแบบ generic จริงๆ

เมธอด RPC ของ Gateway แบบกำหนดเองเป็น entry point ขั้นสูง เก็บไว้ภายใต้
คำนำหน้าเฉพาะ Plugin; namespace ของ core admin เช่น `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` และ `update.*` ยังคงถูกสงวนไว้
และ resolve ไปยัง `operator.admin` bridge
`openclaw/plugin-sdk/gateway-method-runtime` ถูกสงวนไว้สำหรับ route HTTP ของ Plugin
ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]`

สำหรับแผนที่ import ฉบับเต็ม ดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Checklist ก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>Entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>Import ทั้งหมดใช้ path แบบเจาะจง `plugin-sdk/<subpath>`</Check>
<Check>Internal imports ใช้โมดูลในเครื่อง ไม่ใช่ SDK self-imports</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ใน repo)</Check>

## ทดสอบกับ release beta

1. เฝ้าดูแท็ก GitHub release ใน [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และ subscribe ผ่าน `Watch` > `Releases` แท็ก beta จะมีรูปแบบเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X ทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับแท็ก beta ทันทีที่ปรากฏ หน้าต่างเวลาก่อน stable โดยปกติมีเพียงไม่กี่ชั่วโมง
3. โพสต์ใน thread ของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยระบุ `all good` หรือสิ่งที่เสีย หากยังไม่มี thread ให้สร้างหนึ่งรายการ
4. หากมีสิ่งที่เสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` วางลิงก์ issue ใน thread ของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และ thread Discord ของคุณ Contributor ไม่สามารถใส่ label ให้ PR ได้ ดังนั้นชื่อ PR จึงเป็นสัญญาณฝั่ง PR สำหรับ maintainer และ automation blocker ที่มี PR จะถูก merge; blocker ที่ไม่มี PR อาจ ship ต่อไป maintainer จะเฝ้าดู thread เหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณมักจะ land ในรอบถัดไป

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
    แผนที่ import และข้อมูลอ้างอิง API การลงทะเบียน
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/th/plugins/sdk-testing">
    Utilities และรูปแบบสำหรับการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิง schema ของ manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [Plugin hooks](/th/plugins/hooks)
- [สถาปัตยกรรม Plugin](/th/plugins/architecture)
