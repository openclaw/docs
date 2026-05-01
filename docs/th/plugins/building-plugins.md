---
read_when:
    - คุณต้องการสร้าง Plugin ใหม่สำหรับ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง OpenClaw Plugin แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-01T10:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c80b831161c93b0a7f65baf1ccea705ccc27b8226180c0fd0ef15fbbefa3d83
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins ขยาย OpenClaw ด้วยความสามารถใหม่: channels, model providers,
speech, realtime transcription, realtime voice, media understanding, image
generation, video generation, web fetch, web search, agent tools หรือการผสมผสานใด ๆ

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณลงใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลอง ClawHub ก่อน และ
fallback ไปยัง npm โดยอัตโนมัติสำหรับแพ็กเกจที่ยังใช้การจัดจำหน่ายผ่าน npm

## ข้อกำหนดเบื้องต้น

- Node >= 22 และ package manager (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ใน repository: clone repository แล้วและทำ `pnpm install` เสร็จแล้ว

## Plugin แบบใด?

<CardGroup cols={3}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่ม model provider (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียน agent tools, event hooks หรือ services — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ channel plugin ที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อ onboarding/setup
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งจะสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้ง และปฏิเสธการเขียน config จริงอย่างปลอดภัย
จนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: tool plugin

คู่มือนี้สร้าง Plugin ขั้นต่ำที่ลงทะเบียน agent tool หนึ่งรายการ Channel
และ provider plugins มีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

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

    ทุก Plugin ต้องมี manifest แม้จะไม่มี config และทุก Plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจ เครื่องมือที่ลงทะเบียนใน runtime ต้องการ
    startup import ดังนั้นตัวอย่างนี้จึงตั้งค่าเป็น `true` ดู schema แบบเต็มได้ที่
    [Manifest](/th/plugins/manifest) snippet สำหรับเผยแพร่ไปยัง ClawHub แบบ canonical
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

    `definePluginEntry` ใช้สำหรับ Plugin ที่ไม่ใช่ channel สำหรับ channels ให้ใช้
    `defineChannelPluginEntry` — ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือก entry point ทั้งหมด ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub แล้วติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ยังตรวจสอบ ClawHub ก่อน npm สำหรับ bare package specs เช่น
    `@myorg/openclaw-my-plugin`; npm ยังคงเป็น fallback สำหรับแพ็กเกจที่ยัง
    ไม่ได้ migrate ไปยัง ClawHub

    **Plugin ใน repository:** วางไว้ใต้ bundled plugin workspace tree — ระบบจะค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้หลายรายการผ่านอ็อบเจกต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือแบบละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Text inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/th/plugins/sdk-provider-plugins)                               |
| CLI inference backend  | `api.registerCliBackend(...)`                    | [CLI Backends](/th/gateway/cli-backends)                                           |
| Channel / messaging    | `api.registerChannel(...)`                       | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Image generation       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-result middleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/th/plugins/sdk-overview#registration-api)                          |
| Agent tools            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| Custom commands        | `api.registerCommand(...)`                       | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/th/plugins/hooks)                                                  |
| Internal event hooks   | `api.registerHook(...)`                          | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/th/plugins/architecture-internals#gateway-http-routes)                |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/th/plugins/sdk-entrypoints)                                        |

สำหรับ registration API ทั้งหมด ดู [SDK Overview](/th/plugins/sdk-overview#registration-api)

Bundled plugins สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อจำเป็นต้อง
rewrite ผลลัพธ์ของเครื่องมือแบบ async ก่อนที่โมเดลจะเห็น output ประกาศ
targeted runtimes ใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่เป็น seam ที่เชื่อถือได้สำหรับ bundled-plugin; Plugin ภายนอก
ควรเลือกใช้ OpenClaw plugin hooks ปกติ เว้นแต่ OpenClaw จะเพิ่ม
นโยบายความเชื่อถือแบบชัดเจนสำหรับความสามารถนี้

หาก Plugin ของคุณลงทะเบียน custom gateway RPC methods ให้เก็บไว้ภายใต้
prefix เฉพาะของ Plugin namespace ฝั่ง admin หลัก (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้ และ resolve ไปยัง
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

Semantics ของ hook guard ที่ควรจำ:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handlers ที่มี priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการทำงานของ agent ชั่วคราวและแจ้งให้ผู้ใช้อนุมัติผ่าน exec approval overlay, ปุ่ม Telegram, Discord interactions หรือคำสั่ง `/approve` บน channel ใดก็ได้
- `before_install`: `{ block: true }` เป็น terminal และหยุด handlers ที่มี priority ต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handlers ที่มี priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: ให้ใช้ฟิลด์แบบ typed `threadId` เมื่อคุณต้องการ inbound thread/topic routing เก็บ `metadata` ไว้สำหรับส่วนเสริมเฉพาะ channel
- `message_sending`: ให้ใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทน metadata keys เฉพาะ channel

คำสั่ง `/approve` จัดการทั้ง exec และ plugin approvals ด้วย bounded fallback: เมื่อไม่พบ exec approval id OpenClaw จะลอง id เดิมอีกครั้งผ่าน plugin approvals การส่งต่อ plugin approval สามารถกำหนดค่าแยกต่างหากได้ผ่าน `approvals.plugin` ใน config

หาก approval plumbing แบบกำหนดเองจำเป็นต้องตรวจจับ bounded fallback case เดียวกันนี้
ให้ใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการ match สตริง approval-expiry เอง

ดูตัวอย่างและ hook reference ได้ที่ [Plugin hooks](/th/plugins/hooks)

## การลงทะเบียน agent tools

Tools คือฟังก์ชันแบบ typed ที่ LLM สามารถเรียกใช้ได้ โดยอาจเป็นแบบ required (พร้อมใช้งานเสมอ)
หรือ optional (ผู้ใช้ opt-in):

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

ผู้ใช้เปิดใช้ optional tools ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับ core tools (conflicts จะถูกข้าม)
- Tools ที่มี registration objects ผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน plugin diagnostics แทนที่จะทำให้ agent runs ล้มเหลว
- ใช้ `optional: true` สำหรับ tools ที่มี side effects หรือต้องการ binary เพิ่มเติม
- ผู้ใช้สามารถเปิดใช้ tools ทั้งหมดจาก Plugin ได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugins สามารถเพิ่ม root `openclaw` command groups ด้วย `api.registerCli` ระบุ
`descriptors` สำหรับ command root ระดับบนสุดทุกตัว เพื่อให้ OpenClaw แสดงและ route
คำสั่งได้โดยไม่ต้องโหลดทุก plugin runtime ล่วงหน้า

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

## แบบแผนการนำเข้า

นำเข้าจากพาธ `openclaw/plugin-sdk/<subpath>` ที่เจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การนำเข้าภายใน — อย่านำเข้า Plugin ของคุณเองผ่านพาธ SDK ของมัน

สำหรับ Plugin ผู้ให้บริการ ให้เก็บตัวช่วยเฉพาะผู้ให้บริการไว้ใน barrel ระดับรากแพ็กเกจ
เหล่านั้น เว้นแต่ว่า seam นั้นจะเป็นแบบทั่วไปจริงๆ ตัวอย่างที่บันเดิลอยู่ในปัจจุบัน:

- Anthropic: ตัวห่อ Claude stream และตัวช่วย `service_tier` / beta
- OpenAI: ตัวสร้างผู้ให้บริการ, ตัวช่วยโมเดลเริ่มต้น, ผู้ให้บริการแบบเรียลไทม์
- OpenRouter: ตัวสร้างผู้ให้บริการ พร้อมตัวช่วย onboarding/config

หากตัวช่วยมีประโยชน์เฉพาะภายในแพ็กเกจผู้ให้บริการที่บันเดิลไว้เพียงแพ็กเกจเดียว ให้เก็บไว้บน
seam ระดับรากแพ็กเกจนั้น แทนที่จะโปรโมตเข้าไปใน `openclaw/plugin-sdk/*`

seam ตัวช่วย `openclaw/plugin-sdk/<bundled-id>` ที่สร้างขึ้นบางรายการยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled-plugin เมื่อมีการติดตามการใช้งานของเจ้าของ ให้ถือว่าสิ่งเหล่านี้เป็น
พื้นผิวที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ Plugin บุคคลที่สามใหม่

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีเมทาดาทา `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเข้าใช้งานใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การนำเข้าทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การนำเข้าภายในใช้โมดูลภายในเครื่อง ไม่ใช่การนำเข้าตัวเองผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ใน repo)</Check>

## การทดสอบ beta release

1. เฝ้าดูแท็ก release บน GitHub ที่ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครรับผ่าน `Watch` > `Releases` แท็ก beta จะมีรูปแบบเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี OpenClaw X อย่างเป็นทางการ [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับแท็ก beta ทันทีที่แท็กนั้นปรากฏ โดยทั่วไปช่วงเวลาก่อน stable จะมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังจากทดสอบ โดยใช้ `all good` หรือสิ่งที่เสีย หากคุณยังไม่มีเธรด ให้สร้างเธรดหนึ่ง
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ที่มีชื่อว่า `Beta blocker: <plugin-name> - <summary>` และใส่ป้ายกำกับ `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ ตัว blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มี PR อาจถูกปล่อยไปอยู่ดี ผู้ดูแลจะเฝ้าดูเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณน่าจะเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางการรับส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/th/plugins/sdk-overview">
    แผนที่การนำเข้าและข้อมูลอ้างอิง API การลงทะเบียน
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิงสคีมา manifest ทั้งหมด
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ Plugin
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) — การสร้าง Plugin ผู้ให้บริการ
