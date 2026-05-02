---
read_when:
    - คุณต้องการสร้าง OpenClaw Plugin ใหม่
    - คุณต้องการคู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw ตัวแรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-02T20:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงพูดแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ, เครื่องมือ agent หรือการผสมผสานใด ๆ

คุณไม่จำเป็นต้องเพิ่ม plugin ของคุณลงใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install clawhub:<package-name>` สเปกแพ็กเกจแบบเปล่ายังคง
ติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านของการเปิดตัว

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ plugin ใน repo: clone repository แล้วและรัน `pnpm install` เรียบร้อย การพัฒนา plugin
  จาก checkout ซอร์สโค้ดรองรับเฉพาะ pnpm เพราะ OpenClaw โหลด plugin ที่ bundle มา
  จากแพ็กเกจ workspace `extensions/*`

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือ agent, event hook หรือ service — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ channel plugin ที่ไม่รับประกันว่าจะติดตั้งอยู่เมื่อ onboarding/setup
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้ง และปิดกั้นการเขียน config จริงจนกว่า plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: tool plugin

คำแนะนำนี้สร้าง plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือ agent สำหรับ channel
และ provider plugin มีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

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

    ทุก plugin ต้องมี manifest แม้จะไม่มี config เครื่องมือที่ลงทะเบียนตอน runtime
    ต้องระบุใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบ plugin เจ้าของ
    ได้โดยไม่ต้องโหลด runtime ของทุก plugin นอกจากนี้ plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจ ตัวอย่างนี้ตั้งค่าเป็น `true` ดู
    [Manifest](/th/plugins/manifest) สำหรับ schema เต็ม snippet สำหรับเผยแพร่ ClawHub
    ที่เป็นแหล่งอ้างอิงหลักอยู่ใน `docs/snippets/plugin-publish/`

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

    `definePluginEntry` ใช้สำหรับ plugin ที่ไม่ใช่ channel สำหรับ channel ให้ใช้
    `defineChannelPluginEntry` — ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือก entry point ทั้งหมด ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบความถูกต้องและเผยแพร่ด้วย ClawHub จากนั้นติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    สเปกแพ็กเกจแบบเปล่า เช่น `@myorg/openclaw-my-plugin` ติดตั้งจาก npm ระหว่าง
    ช่วงเปลี่ยนผ่านของการเปิดตัว ใช้ `clawhub:` เมื่อต้องการให้ resolve ผ่าน ClawHub

    **Plugin ใน repo:** วางไว้ใต้ tree workspace ของ bundled plugin — จะถูกค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

plugin เดียวสามารถลงทะเบียนความสามารถได้จำนวนเท่าใดก็ได้ผ่านอ็อบเจกต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือโดยละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/th/plugins/sdk-provider-plugins)                               |
| backend การอนุมาน CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/th/gateway/cli-backends)                                           |
| ช่องทาง / การรับส่งข้อความ    | `api.registerChannel(...)`                       | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงพูดแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การทำความเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลเว็บ              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือ agent            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งแบบกำหนดเอง        | `api.registerCommand(...)`                       | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| hook ของ Plugin           | `api.on(...)`                                    | [Plugin hooks](/th/plugins/hooks)                                                  |
| hook เหตุการณ์ภายใน   | `api.registerHook(...)`                          | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| เส้นทาง HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/th/plugins/architecture-internals#gateway-http-routes)                |
| คำสั่งย่อย CLI        | `api.registerCli(...)`                           | [Entry Points](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนทั้งหมด ดู [SDK Overview](/th/plugins/sdk-overview#registration-api)

bundled plugin สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
ต้องการเขียนผลลัพธ์เครื่องมือแบบ async ใหม่ก่อนที่โมเดลจะเห็น output ประกาศ
runtime เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่คือ seam ของ bundled-plugin ที่เชื่อถือได้ ส่วน plugin ภายนอก
ควรใช้ hook ของ OpenClaw plugin แบบปกติ เว้นแต่ OpenClaw จะเพิ่ม
นโยบายความเชื่อถืออย่างชัดเจนสำหรับความสามารถนี้

หาก plugin ของคุณลงทะเบียนเมธอด Gateway RPC แบบกำหนดเอง ให้เก็บไว้ใน
prefix เฉพาะของ plugin namespace ของผู้ดูแลระบบหลัก (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และ resolve เป็น
`operator.admin` เสมอ แม้ว่า plugin จะขอ scope ที่แคบกว่าก็ตาม

หลัก semantics ของ hook guard ที่ควรจำ:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` หยุดการทำงานของ agent ชั่วคราวและขออนุมัติจากผู้ใช้ผ่าน exec approval overlay, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_install`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` ถือว่าไม่มีการตัดสินใจ
- `message_received`: แนะนำให้ใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการ route thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะช่องทาง
- `message_sending`: แนะนำให้ใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทนคีย์ metadata เฉพาะช่องทาง

คำสั่ง `/approve` จัดการทั้ง exec approval และ plugin approval พร้อม fallback แบบมีขอบเขต: เมื่อไม่พบ exec approval id OpenClaw จะลอง id เดิมซ้ำผ่าน plugin approval การ forward plugin approval สามารถกำหนดค่าแยกต่างหากได้ผ่าน `approvals.plugin` ใน config

หาก plumbing การอนุมัติแบบกำหนดเองต้องตรวจจับกรณี fallback แบบมีขอบเขตเดียวกันนี้
แนะนำให้ใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริง approval-expiry ด้วยตนเอง

ดูตัวอย่างและ reference ของ hook ได้ที่ [Plugin hooks](/th/plugins/hooks)

## การลงทะเบียนเครื่องมือ agent

เครื่องมือคือฟังก์ชันแบบ typed ที่ LLM สามารถเรียกได้ อาจเป็นแบบจำเป็น (พร้อมใช้งานเสมอ)
หรือแบบ optional (ผู้ใช้เลือกเปิดใช้):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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
manifest ของ plugin ด้วย:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw จับและ cache descriptor ที่ตรวจสอบแล้วจากเครื่องมือที่ลงทะเบียน
ดังนั้น plugin ไม่ต้อง duplicate `description` หรือข้อมูล schema ใน manifest
manifest contract ประกาศเฉพาะ ownership และ discovery เท่านั้น ส่วนการ execute ยังเรียก
implementation ของเครื่องมือที่ลงทะเบียนจริง

ผู้ใช้เปิดใช้เครื่องมือ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือหลัก (รายการที่ขัดแย้งจะถูกข้าม)
- เครื่องมือที่มีอ็อบเจ็กต์การลงทะเบียนผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน diagnostics ของ plugin แทนที่จะทำให้การรัน agent ล้มเหลว
- ใช้ `optional: true` สำหรับเครื่องมือที่มีผลข้างเคียงหรือต้องการไบนารีเพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก plugin ได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugins สามารถเพิ่มกลุ่มคำสั่งราก `openclaw` ด้วย `api.registerCli` ได้ ระบุ
`descriptors` สำหรับรากคำสั่งระดับบนสุดทุกคำสั่ง เพื่อให้ OpenClaw แสดงและกำหนดเส้นทาง
คำสั่งได้โดยไม่ต้องโหลด runtime ของ plugin ทุกตัวล่วงหน้า

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

ให้ import จากพาธ `openclaw/plugin-sdk/<subpath>` ที่เจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การ import ภายใน อย่า import plugin ของคุณเองผ่านพาธ SDK ของมัน

สำหรับ provider plugins ให้เก็บตัวช่วยเฉพาะผู้ให้บริการไว้ใน barrel ที่รากแพ็กเกจ
เหล่านั้น เว้นแต่ว่า seam นั้นจะเป็นแบบทั่วไปจริงๆ ตัวอย่าง bundled ปัจจุบัน:

- Anthropic: wrapper สำหรับสตรีม Claude และตัวช่วย `service_tier` / beta
- OpenAI: builder ของผู้ให้บริการ, ตัวช่วยโมเดลเริ่มต้น, ผู้ให้บริการแบบเรียลไทม์
- OpenRouter: builder ของผู้ให้บริการ รวมถึงตัวช่วย onboarding/config

หากตัวช่วยมีประโยชน์เฉพาะภายในแพ็กเกจผู้ให้บริการ bundled เพียงตัวเดียว ให้เก็บไว้บน
seam รากแพ็กเกจนั้น แทนที่จะยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

seam ตัวช่วย `openclaw/plugin-sdk/<bundled-id>` ที่สร้างขึ้นบางรายการยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled-plugin เมื่อมีการติดตามการใช้งานของเจ้าของ ให้ถือว่าสิ่งเหล่านี้เป็น
พื้นผิวที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ plugin ภายนอกใหม่

## เช็กลิสต์ก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>manifest **openclaw.plugin.json** มีอยู่และถูกต้อง</Check>
<Check>จุดเข้าใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การ import ทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การ import ภายในใช้โมดูลภายในเครื่อง ไม่ใช่ SDK self-import</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (plugins ภายใน repo)</Check>

## การทดสอบรุ่น beta

1. เฝ้าดูแท็ก GitHub release บน [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครรับข้อมูลผ่าน `Watch` > `Releases` แท็ก beta มีรูปแบบคล้าย `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X ทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ plugin ของคุณกับแท็ก beta ทันทีที่ปรากฏ ช่วงเวลาก่อน stable โดยทั่วไปมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยใช้ `all good` หรือระบุสิ่งที่เสีย หากยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` วางลิงก์ issue ในเธรดของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ของคุณ Contributors ใส่ label ให้ PR ไม่ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับ maintainer และ automation blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มี PR อาจถูกปล่อยไปพร้อม release อยู่ดี Maintainers จะเฝ้าดูเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณมีแนวโน้มจะเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง plugin ช่องทางการส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    อ้างอิง import map และ API การลงทะเบียน
  </Card>
  <Card title="ตัวช่วย Runtime" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    อ้างอิงสคีมา manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ plugin
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้าง plugin ช่องทาง
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง plugin ผู้ให้บริการ
