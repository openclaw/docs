---
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องมีคู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw ตัวแรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, การดึงเว็บ, การค้นเว็บ, เครื่องมือเอเจนต์ หรือ
การผสมผสานใดๆ

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณเข้าไปในที่เก็บ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) และผู้ใช้ติดตั้งด้วย
`openclaw plugins install clawhub:<package-name>` สเปกแพ็กเกจแบบเปล่ายังคง
ติดตั้งจาก npm ในช่วงเปลี่ยนผ่านการเปิดตัว

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ในที่เก็บ: โคลนที่เก็บและทำ `pnpm install` แล้ว การพัฒนา Plugin
  จากซอร์สเช็กเอาต์รองรับเฉพาะ pnpm เพราะ OpenClaw โหลด Plugin ที่รวมมา
  จากแพ็กเกจเวิร์กสเปซ `extensions/*`

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ (Discord, IRC เป็นต้น)
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, พร็อกซี หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Plugin เครื่องมือ / hook" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือเอเจนต์, hook เหตุการณ์ หรือบริการ - อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Plugin ช่องทางที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อการเริ่มใช้งาน/การตั้งค่า
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งจะสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้ง และปิดกั้นการเขียนค่าคอนฟิกจริงจนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: Plugin เครื่องมือ

คำแนะนำนี้สร้าง Plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือเอเจนต์ Plugin ช่องทาง
และ Plugin ผู้ให้บริการมีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

<Steps>
  <Step title="สร้างแพ็กเกจและ manifest">
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

    ทุก Plugin ต้องมี manifest แม้จะไม่มีค่าคอนฟิกก็ตาม เครื่องมือที่ลงทะเบียนตอนรันไทม์
    ต้องถูกระบุไว้ใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบ Plugin เจ้าของ
    ได้โดยไม่ต้องโหลดรันไทม์ของทุก Plugin นอกจากนี้ Plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจ ตัวอย่างนี้ตั้งค่าเป็น `true` ดู
    [Manifest](/th/plugins/manifest) สำหรับ schema ฉบับเต็ม snippet สำหรับเผยแพร่ ClawHub
    แบบ canonical อยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="เขียนจุดเข้าใช้งาน">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` ใช้สำหรับ Plugin ที่ไม่ใช่ช่องทาง สำหรับช่องทาง ให้ใช้
    `defineChannelPluginEntry` - ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือกจุดเข้าใช้งานทั้งหมด ดู [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub จากนั้นติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    สเปกแพ็กเกจแบบเปล่า เช่น `@myorg/openclaw-my-plugin` จะติดตั้งจาก npm ในช่วง
    เปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:` เมื่อต้องการการ resolve ผ่าน ClawHub

    **Plugin ในที่เก็บ:** วางไว้ใต้แผนผังเวิร์กสเปซ Plugin ที่รวมมา - จะถูกค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถจำนวนเท่าใดก็ได้ผ่านอ็อบเจ็กต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือโดยละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)                               |
| backend การอนุมานของ CLI  | `api.registerCliBackend(...)`                    | [backend ของ CLI](/th/gateway/cli-backends)                                           |
| ช่องทาง / การรับส่งข้อความ    | `api.registerChannel(...)`                       | [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงเว็บ              | `api.registerWebFetchProvider(...)`              | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นเว็บ             | `api.registerWebSearchProvider(...)`             | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือเอเจนต์            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งแบบกำหนดเอง        | `api.registerCommand(...)`                       | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |
| hook ของ Plugin           | `api.on(...)`                                    | [hook ของ Plugin](/th/plugins/hooks)                                                  |
| hook เหตุการณ์ภายใน   | `api.registerHook(...)`                          | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |
| route ของ HTTP            | `api.registerHttpRoute(...)`                     | [ภายใน](/th/plugins/architecture-internals#gateway-http-routes)                |
| คำสั่งย่อยของ CLI        | `api.registerCli(...)`                           | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนฉบับเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Plugin ที่รวมมาสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อจำเป็นต้อง
เขียนผลลัพธ์เครื่องมือใหม่แบบ async ก่อนที่โมเดลจะเห็นเอาต์พุต ประกาศรันไทม์
เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่คือ seam ที่เชื่อถือได้สำหรับ Plugin ที่รวมมา; Plugin
ภายนอกควรเลือกใช้ hook ของ OpenClaw Plugin ตามปกติ เว้นแต่ OpenClaw จะเพิ่ม
นโยบายความเชื่อถือที่ชัดเจนสำหรับความสามารถนี้

หาก Plugin ของคุณลงทะเบียนเมธอด RPC ของ gateway แบบกำหนดเอง ให้เก็บไว้บน
prefix เฉพาะ Plugin namespace สำหรับผู้ดูแลระบบของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve เป็น
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

ความหมายของตัวป้องกัน hook ที่ควรจำ:

- `before_tool_call`: `{ block: true }` เป็นจุดสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` หยุดการทำงานของเอเจนต์ชั่วคราวและแจ้งผู้ใช้ให้อนุมัติผ่าน overlay การอนุมัติ exec, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็นจุดสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นจุดสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` ถือว่าไม่มีการตัดสินใจ
- `message_received`: ควรใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการกำหนดเส้นทางเธรด/หัวข้อขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะช่องทาง
- `message_sending`: ควรใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทนคีย์ metadata เฉพาะช่องทาง

คำสั่ง `/approve` จัดการทั้งการอนุมัติ exec และ Plugin ด้วย fallback แบบจำกัด: เมื่อไม่พบ id การอนุมัติ exec OpenClaw จะลอง id เดิมอีกครั้งผ่านการอนุมัติ Plugin การส่งต่อการอนุมัติ Plugin สามารถกำหนดค่าแยกได้ผ่าน `approvals.plugin` ใน config

หากระบบการอนุมัติแบบกำหนดเองต้องตรวจจับกรณี fallback แบบจำกัดเดียวกันนี้
ควรใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงหมดอายุการอนุมัติด้วยตนเอง

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่างและข้อมูลอ้างอิง hook

## การลงทะเบียนเครื่องมือเอเจนต์

เครื่องมือคือฟังก์ชันที่มีชนิดซึ่ง LLM สามารถเรียกได้ อาจเป็นแบบจำเป็น (พร้อมใช้งานเสมอ)
หรือแบบทางเลือก (ผู้ใช้เลือกใช้):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw จับและแคช descriptor ที่ผ่านการตรวจสอบแล้วจากเครื่องมือที่ลงทะเบียนไว้
ดังนั้น Plugin จึงไม่ต้องทำซ้ำ `description` หรือข้อมูล schema ใน manifest
สัญญา manifest ประกาศเฉพาะความเป็นเจ้าของและการค้นพบเท่านั้น การเรียกใช้งานยังคงเรียก
implementation ของเครื่องมือที่ลงทะเบียนแบบสดอยู่
ตั้งค่า `toolMetadata.<tool>.optional: true` สำหรับเครื่องมือที่ลงทะเบียนด้วย
`api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw สามารถหลีกเลี่ยงการโหลด
runtime ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มเข้า allowlist อย่างชัดเจน

ผู้ใช้เปิดใช้เครื่องมือแบบ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือของ core (รายการที่ขัดแย้งจะถูกข้าม)
- เครื่องมือที่มีอ็อบเจกต์การลงทะเบียนผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน diagnostics ของ Plugin แทนที่จะทำให้การรัน agent ล้มเหลว
- ใช้ `optional: true` สำหรับเครื่องมือที่มี side effects หรือต้องการ binary เพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก Plugin ได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugin สามารถเพิ่มกลุ่มคำสั่ง root ของ `openclaw` ด้วย `api.registerCli` ได้ ระบุ
`descriptors` สำหรับ root ของคำสั่งระดับบนสุดทุกคำสั่ง เพื่อให้ OpenClaw สามารถแสดงและ route
คำสั่งได้โดยไม่ต้องโหลด runtime ของทุก Plugin ล่วงหน้า

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

หลังติดตั้ง ให้ตรวจสอบการลงทะเบียน runtime และเรียกใช้คำสั่ง:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## ข้อตกลงการ import

ให้ import จาก path แบบเจาะจง `openclaw/plugin-sdk/<subpath>` เสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
internal imports - ห้าม import Plugin ของคุณเองผ่าน path SDK ของมัน

สำหรับ provider plugins ให้เก็บ helper เฉพาะ provider ไว้ใน barrel ระดับ package-root เหล่านั้น
เว้นแต่ seam จะเป็น generic อย่างแท้จริง ตัวอย่าง bundled ปัจจุบัน:

- Anthropic: wrapper สตรีม Claude และ helper ของ `service_tier` / beta
- OpenAI: provider builders, helper ของ default-model, realtime providers
- OpenRouter: provider builder พร้อม helper สำหรับ onboarding/config

หาก helper มีประโยชน์เฉพาะภายใน package ของ bundled provider เดียว ให้เก็บไว้บน
seam ระดับ package-root นั้นแทนการยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

seam helper ที่สร้างขึ้นบางรายการของ `openclaw/plugin-sdk/<bundled-id>` ยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled-plugin เมื่อมีการติดตามการใช้งานโดยเจ้าของ ให้ถือว่าสิ่งเหล่านี้เป็น
surface ที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ third-party plugins ใหม่

## เช็กลิสต์ก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>imports ทั้งหมดใช้ path แบบเจาะจง `plugin-sdk/<subpath>`</Check>
<Check>internal imports ใช้โมดูลภายในเครื่อง ไม่ใช่ SDK self-imports</Check>
<Check>Tests ผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ภายใน repo)</Check>

## การทดสอบ beta release

1. ติดตาม tag release บน GitHub ที่ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และ subscribe ผ่าน `Watch` > `Releases` tag beta จะมีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี OpenClaw X อย่างเป็นทางการ [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับ tag beta ทันทีที่ปรากฏ โดยปกติช่วงเวลาก่อน stable จะมีเพียงไม่กี่ชั่วโมง
3. โพสต์ใน thread ของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ พร้อมระบุ `all good` หรือสิ่งที่เสีย หากคุณยังไม่มี thread ให้สร้างขึ้นมา
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` ใส่ลิงก์ issue ใน thread ของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และ thread Discord ของคุณ contributor ไม่สามารถติด label ให้ PR ได้ ดังนั้น title คือสัญญาณฝั่ง PR สำหรับ maintainer และ automation blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มี PR อาจถูก ship ต่อไป maintainer จะติดตาม thread เหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณน่าจะเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางการส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin provider โมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิง import map และ registration API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, search, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    utilities และรูปแบบสำหรับการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิง schema manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) - รูปแบบ manifest ของ plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) - การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การสร้าง provider plugins
