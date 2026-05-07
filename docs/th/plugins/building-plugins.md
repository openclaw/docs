---
read_when:
    - คุณต้องการสร้าง Plugin ใหม่ของ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin สำหรับ OpenClaw ตัวแรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ, เครื่องมือของเอเจนต์ หรือการผสมผสานใด ๆ

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณเข้าไปใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install clawhub:<package-name>` สเป็กแพ็กเกจแบบไม่ระบุแหล่งยังคง
ติดตั้งจาก npm ได้ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ใน repo: โคลน repository แล้วและรัน `pnpm install` เรียบร้อย การพัฒนา Plugin
  จาก checkout ซอร์สเป็นแบบ pnpm เท่านั้น เพราะ OpenClaw โหลด Plugin ที่รวมมาด้วย
  จากแพ็กเกจ workspace `extensions/*`

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Plugin แบ็กเอนด์ CLI" icon="terminal" href="/th/plugins/cli-backend-plugins">
    แมป CLI AI ภายในเครื่องเข้ากับตัวรันสำรองข้อความของ OpenClaw
  </Card>
  <Card title="Plugin เครื่องมือ / ฮุก" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือของเอเจนต์, event hook หรือบริการ - อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Plugin ช่องทางที่ไม่รับประกันว่าจะติดตั้งไว้เมื่อ onboarding/setup ทำงาน
ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ฟังก์ชันนี้สร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้งและปิดการเขียน config จริงไว้จนกว่าจะติดตั้ง Plugin แล้ว

## เริ่มต้นอย่างรวดเร็ว: Plugin เครื่องมือ

คำแนะนำนี้สร้าง Plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือของเอเจนต์ Plugin ช่องทาง
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

    ทุก Plugin ต้องมี manifest แม้จะไม่มี config ก็ตาม เครื่องมือที่ลงทะเบียนตอน runtime
    ต้องระบุไว้ใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบ Plugin เจ้าของได้
    โดยไม่ต้องโหลด runtime ของทุก Plugin นอกจากนี้ Plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจ ตัวอย่างนี้ตั้งค่าเป็น `true` ดู schema แบบเต็มได้ที่
    [Manifest](/th/plugins/manifest) snippet สำหรับเผยแพร่ ClawHub ที่เป็น canonical
    อยู่ใน `docs/snippets/plugin-publish/`

  </Step>

  <Step title="เขียน entry point">

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
    สำหรับตัวเลือก entry point แบบเต็ม ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub จากนั้นติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    สเป็กแพ็กเกจแบบไม่ระบุแหล่ง เช่น `@myorg/openclaw-my-plugin` จะติดตั้งจาก npm ระหว่าง
    ช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:` เมื่อคุณต้องการให้ resolve ผ่าน ClawHub

    **Plugin ใน repo:** วางไว้ใต้ tree workspace ของ Plugin ที่รวมมาด้วย - จะถูกค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้หลายรายการผ่านออบเจ็กต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือแบบละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)                               |
| แบ็กเอนด์การอนุมาน CLI  | `api.registerCliBackend(...)`                    | [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins)                             |
| ช่องทาง / การส่งข้อความ    | `api.registerChannel(...)`                       | [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การทำความเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลเว็บ              | `api.registerWebFetchProvider(...)`              | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือของเอเจนต์            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งแบบกำหนดเอง        | `api.registerCommand(...)`                       | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| ฮุกของ Plugin           | `api.on(...)`                                    | [ฮุกของ Plugin](/th/plugins/hooks)                                                  |
| ฮุก event ภายใน   | `api.registerHook(...)`                          | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| route HTTP            | `api.registerHttpRoute(...)`                     | [ภายใน](/th/plugins/architecture-internals#gateway-http-routes)                |
| คำสั่งย่อย CLI        | `api.registerCli(...)`                           | [Entry Points](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนแบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Plugin ที่รวมมาด้วยสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อจำเป็นต้อง
เขียนผลลัพธ์เครื่องมือใหม่แบบ async ก่อนที่โมเดลจะเห็น output ให้ประกาศ runtime
เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่เป็น seam ของ Plugin ที่รวมมาด้วยซึ่งได้รับความเชื่อถือ; Plugin
ภายนอกควรเลือกใช้ฮุก Plugin ของ OpenClaw ตามปกติ เว้นแต่ OpenClaw จะเพิ่มนโยบายความเชื่อถือ
อย่างชัดเจนสำหรับความสามารถนี้

หาก Plugin ของคุณลงทะเบียนเมธอด RPC ของ Gateway แบบกำหนดเอง ให้คงไว้ภายใต้ prefix
เฉพาะของ Plugin namespace ผู้ดูแลระบบหลัก (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve ไปยัง
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

ความหมายของ hook guard ที่ควรจำ:

- `before_tool_call`: `{ block: true }` เป็นค่าสุดท้ายและหยุด handler ที่มี priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` หยุดการทำงานของเอเจนต์ชั่วคราวและแจ้งผู้ใช้ให้อนุมัติผ่าน exec approval overlay, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็นค่าสุดท้ายและหยุด handler ที่มี priority ต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นค่าสุดท้ายและหยุด handler ที่มี priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: ใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการ routing thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: ใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทน key metadata เฉพาะช่องทาง

คำสั่ง `/approve` รองรับทั้งการอนุมัติ exec และ Plugin พร้อม fallback แบบมีขอบเขต: เมื่อไม่พบ id การอนุมัติ exec OpenClaw จะลองใช้ id เดิมผ่านการอนุมัติ Plugin อีกครั้ง การ forward การอนุมัติ Plugin สามารถกำหนดค่าแยกได้ผ่าน `approvals.plugin` ใน config

หากระบบอนุมัติแบบกำหนดเองจำเป็นต้องตรวจจับกรณี fallback แบบมีขอบเขตเดียวกันนี้
ให้เลือกใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการ match string การหมดอายุของ approval ด้วยตัวเอง

ดูตัวอย่างและ reference ของฮุกได้ที่ [ฮุกของ Plugin](/th/plugins/hooks)

## การลงทะเบียนเครื่องมือของเอเจนต์

เครื่องมือคือฟังก์ชันที่มี type ซึ่ง LLM สามารถเรียกใช้ได้ เครื่องมืออาจเป็นแบบจำเป็น (พร้อมใช้งานเสมอ)
หรือแบบ optional (ผู้ใช้เลือกเปิดใช้):

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

ทุกเครื่องมือที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศไว้ใน
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
ดังนั้น plugins จึงไม่ต้องทำซ้ำ `description` หรือข้อมูล schema ใน manifest ส่วน
สัญญา manifest ประกาศเพียงความเป็นเจ้าของและการค้นพบเท่านั้น การดำเนินการยังคงเรียก
implementation ของเครื่องมือที่ลงทะเบียนจริงอยู่
ตั้งค่า `toolMetadata.<tool>.optional: true` สำหรับเครื่องมือที่ลงทะเบียนด้วย
`api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw หลีกเลี่ยงการโหลด
runtime ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มใน allowlist อย่างชัดเจน

ผู้ใช้เปิดใช้งานเครื่องมือแบบ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือหลัก (conflicts จะถูกข้าม)
- เครื่องมือที่มี registration objects ผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน diagnostics ของ Plugin แทนที่จะทำให้การรัน agent ล้มเหลว
- ใช้ `optional: true` สำหรับเครื่องมือที่มี side effects หรือต้องการ binary เพิ่มเติม
- ผู้ใช้สามารถเปิดใช้งานเครื่องมือทั้งหมดจาก Plugin ได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugins สามารถเพิ่มกลุ่มคำสั่ง root `openclaw` ด้วย `api.registerCli` ได้ ระบุ
`descriptors` สำหรับ root ของคำสั่งระดับบนสุดทุกคำสั่ง เพื่อให้ OpenClaw สามารถแสดงและ route
คำสั่งได้โดยไม่ต้องโหลด runtime ของทุก Plugin อย่างกระตือรือร้น

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

หลังติดตั้ง ให้ตรวจสอบการลงทะเบียน runtime และดำเนินการคำสั่ง:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## แนวทางการ import

import จาก path แบบเจาะจง `openclaw/plugin-sdk/<subpath>` เสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
internal imports - ห้าม import Plugin ของคุณเองผ่าน SDK path ของมัน

สำหรับ provider plugins ให้เก็บ helper เฉพาะ provider ไว้ใน barrel ที่ package-root
เหล่านั้น เว้นแต่ seam นั้นจะเป็น generic อย่างแท้จริง ตัวอย่างที่ bundled อยู่ในปัจจุบัน:

- Anthropic: wrapper สำหรับ stream ของ Claude และ helper สำหรับ `service_tier` / beta
- OpenAI: provider builders, helper สำหรับ default-model, realtime providers
- OpenRouter: provider builder พร้อม helper สำหรับ onboarding/config

หาก helper มีประโยชน์เฉพาะภายใน package ของ bundled provider เพียงตัวเดียว ให้เก็บไว้บน
seam ที่ package-root นั้น แทนที่จะยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

seam helper `openclaw/plugin-sdk/<bundled-id>` บางรายการที่สร้างขึ้นยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled-plugin เมื่อมีการติดตามการใช้งานของ owner ให้ถือว่า seam เหล่านั้นเป็น
surface ที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ third-party plugins ใหม่

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>imports ทั้งหมดใช้ path แบบเจาะจง `plugin-sdk/<subpath>`</Check>
<Check>internal imports ใช้โมดูลภายในเครื่อง ไม่ใช่ SDK self-imports</Check>
<Check>tests ผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (plugins ใน repo)</Check>

## การทดสอบ beta release

1. เฝ้าดู tag ของ GitHub release บน [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครรับผ่าน `Watch` > `Releases` tag beta จะมีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิด notifications สำหรับบัญชี X อย่างเป็นทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับ tag beta ทันทีที่ปรากฏ ช่วงเวลาก่อน stable โดยทั่วไปมีเพียงไม่กี่ชั่วโมง
3. โพสต์ใน thread ของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังการทดสอบ โดยใช้ `all good` หรือระบุสิ่งที่เสีย หากคุณยังไม่มี thread ให้สร้างขึ้นมา
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` วางลิงก์ issue ใน thread ของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และ thread Discord ของคุณ contributors ไม่สามารถใส่ label ให้ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับ maintainers และ automation blockers ที่มี PR จะถูก merge ส่วน blockers ที่ไม่มี PR อาจถูก ship อยู่ดี maintainers เฝ้าดู thread เหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงสถานะเขียว หากคุณพลาดช่วงเวลานี้ fix ของคุณน่าจะเข้าสู่รอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin สำหรับช่องทาง messaging
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin สำหรับ model provider
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/th/plugins/cli-backend-plugins">
    ลงทะเบียน backend ของ AI CLI ภายในเครื่อง
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิง import map และ API การลงทะเบียน
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิง schema ของ manifest แบบเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) - รูปแบบ manifest ของ Plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) - การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การสร้าง provider plugins
