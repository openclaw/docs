---
read_when:
- You want to create a new OpenClaw plugin
- คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
- คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ tool หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
  generated_at: '2026-04-25T13:52:46Z'
  model: gpt-5.4
  provider: openai
  source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
  source_path: plugins/building-plugins.md
  workflow: 15
---

Plugins ขยายความสามารถของ OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบ realtime, เสียงแบบ realtime, การเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, web fetch, web search, agent tools หรือการรวมกันแบบใดก็ได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณเข้าไปใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) หรือ npm แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลองใช้ ClawHub ก่อนและ
fallback ไปที่ npm โดยอัตโนมัติ

## ข้อกำหนดเบื้องต้น

- Node >= 22 และ package manager (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ plugins ภายใน repo: clone repository แล้วและรัน `pnpm install` แล้ว

## Plugin แบบไหน?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw เข้ากับแพลตฟอร์มส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ custom endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียน agent tools, event hooks หรือ services — ดูต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ channel plugin ที่ไม่รับประกันว่าจะติดตั้งอยู่เมื่อ onboarding/setup
กำลังทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` มันจะสร้าง setup adapter + wizard แบบคู่
ที่ประกาศข้อกำหนดเรื่องการติดตั้งและ fail closed สำหรับการเขียน config จริง
จนกว่าจะติดตั้ง plugin แล้ว

## เริ่มต้นอย่างรวดเร็ว: tool plugin

ตัวอย่างนี้จะสร้าง Plugin ขั้นต่ำที่ลงทะเบียน agent tool หนึ่งตัว Channel
และ provider plugins มีคู่มือเฉพาะแยกต่างหากซึ่งลิงก์ไว้ด้านบน

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    ทุก Plugin ต้องมี manifest แม้ว่าจะไม่มี config ก็ตาม ดู
    [Manifest](/th/plugins/manifest) สำหรับ schema แบบเต็ม snippets การเผยแพร่ไปยัง ClawHub แบบ canonical
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

    `definePluginEntry` ใช้สำหรับ plugins ที่ไม่ใช่ channel สำหรับ channels ให้ใช้
    `defineChannelPluginEntry` — ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือกของ entry point แบบเต็ม ดู [Entry Points](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **External plugins:** validate และเผยแพร่ด้วย ClawHub จากนั้นติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw จะตรวจสอบ ClawHub ก่อน npm เช่นกันสำหรับสเปกแพ็กเกจแบบเปล่าอย่าง
    `@myorg/openclaw-my-plugin`

    **In-repo plugins:** วางไว้ใต้ tree ของ bundled plugin workspace — ระบบจะค้นพบอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้หลายรายการผ่านออบเจ็กต์ `api`:

| ความสามารถ           | เมธอดการลงทะเบียน                            | คู่มือแบบละเอียด                                                                 |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Text inference (LLM) | `api.registerProvider(...)`                   | [Provider Plugins](/th/plugins/sdk-provider-plugins)                                 |
| CLI inference backend | `api.registerCliBackend(...)`                | [CLI Backends](/th/gateway/cli-backends)                                             |
| Channel / messaging  | `api.registerChannel(...)`                    | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                   |
| Speech (TTS/STT)     | `api.registerSpeechProvider(...)`             | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice       | `api.registerRealtimeVoiceProvider(...)`      | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Media understanding  | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Image generation     | `api.registerImageGenerationProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Music generation     | `api.registerMusicGenerationProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Video generation     | `api.registerVideoGenerationProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web fetch            | `api.registerWebFetchProvider(...)`           | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web search           | `api.registerWebSearchProvider(...)`          | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Tool-result middleware | `api.registerAgentToolResultMiddleware(...)` | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                             |
| Agent tools          | `api.registerTool(...)`                       | ด้านล่าง                                                                          |
| Custom commands      | `api.registerCommand(...)`                    | [Entry Points](/th/plugins/sdk-entrypoints)                                          |
| Plugin hooks         | `api.on(...)`                                 | [Plugin hooks](/th/plugins/hooks)                                                    |
| Internal event hooks | `api.registerHook(...)`                       | [Entry Points](/th/plugins/sdk-entrypoints)                                          |
| HTTP routes          | `api.registerHttpRoute(...)`                  | [Internals](/th/plugins/architecture-internals#gateway-http-routes)                  |
| CLI subcommands      | `api.registerCli(...)`                        | [Entry Points](/th/plugins/sdk-entrypoints)                                          |

สำหรับ registration API แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Bundled plugins สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
ต้องการเขียนผลลัพธ์ของ tool ใหม่แบบ async ก่อนที่โมเดลจะเห็นเอาต์พุต ให้ประกาศ
runtimes เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่คือ seam ที่เชื่อถือได้สำหรับ bundled-plugin; external
plugins ควรเลือกใช้ Plugin hooks ปกติของ OpenClaw เว้นแต่ OpenClaw จะขยาย
นโยบายความเชื่อถือแบบ explicit สำหรับความสามารถนี้ในอนาคต

หาก Plugin ของคุณลงทะเบียน custom gateway RPC methods ให้คงไว้ภายใต้
prefix เฉพาะของ plugin namespaces สำหรับ admin ของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ resolve ไปยัง
`operator.admin` เสมอ แม้ plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

ความหมายของ hook guard ที่ควรจำไว้:

- `before_tool_call`: `{ block: true }` เป็นแบบสิ้นสุดและจะหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถูกมองว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการทำงานของ agent ชั่วคราวและแจ้งให้ผู้ใช้อนุมัติผ่าน exec approval overlay, ปุ่มบน Telegram, interactions ของ Discord หรือคำสั่ง `/approve` บนทุกช่องทาง
- `before_install`: `{ block: true }` เป็นแบบสิ้นสุดและจะหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` จะถูกมองว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นแบบสิ้นสุดและจะหยุด handlers ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถูกมองว่าไม่มีการตัดสินใจ
- `message_received`: ให้ใช้ฟิลด์ `threadId` ที่มี type เมื่อคุณต้องการการกำหนดเส้นทาง inbound thread/topic เก็บ `metadata` ไว้สำหรับส่วนเสริมเฉพาะช่องทาง
- `message_sending`: ให้ใช้ฟิลด์การกำหนดเส้นทางแบบมี type อย่าง `replyToId` / `threadId` แทนคีย์ metadata เฉพาะช่องทาง

คำสั่ง `/approve` รองรับทั้ง exec และ plugin approvals พร้อม bounded fallback: เมื่อไม่พบ exec approval id OpenClaw จะลอง id เดิมผ่าน plugin approvals อีกครั้ง การส่งต่อ plugin approval สามารถกำหนดค่าแยกได้ผ่าน `approvals.plugin` ใน config

หากโครงสร้าง approval แบบกำหนดเองของคุณต้องตรวจจับ bounded fallback กรณีเดียวกัน ให้ใช้
`isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงของการหมดอายุ approval ด้วยตนเอง

ดู [Plugin hooks](/th/plugins/hooks) สำหรับตัวอย่างและข้อมูลอ้างอิงของ hooks

## การลงทะเบียน agent tools

Tools คือฟังก์ชันแบบมี type ที่ LLM สามารถเรียกใช้ได้ สามารถเป็นแบบ required (พร้อมใช้งานเสมอ) หรือ optional (ผู้ใช้ต้องเลือกเปิดเอง):

```typescript
register(api) {
  // Required tool — พร้อมใช้งานเสมอ
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — ผู้ใช้ต้องเพิ่มใน allowlist
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

- ชื่อ tool ต้องไม่ชนกับ core tools (หากชน ระบบจะข้าม)
- ใช้ `optional: true` สำหรับ tools ที่มี side effects หรือต้องใช้ไบนารีเพิ่มเติม
- ผู้ใช้สามารถเปิดใช้ tools ทั้งหมดจาก plugin เดียวได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## แนวทางการ import

ให้ import จากพาธย่อยที่เฉพาะเจาะจงของ `openclaw/plugin-sdk/<subpath>` เสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// ไม่ถูกต้อง: root แบบรวมทั้งหมด (เลิกใช้แล้ว และจะถูกลบออก)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิงของ subpath แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ local barrel files (`api.ts`, `runtime-api.ts`) สำหรับ
internal imports — อย่า import plugin ของตัวเองผ่าน SDK path ของมัน

สำหรับ provider plugins ให้เก็บ helper ที่เฉพาะกับ provider ไว้ใน package-root
barrels เหล่านั้น เว้นแต่ seam นั้นจะเป็นแบบทั่วไปจริง ๆ ตัวอย่าง bundled ปัจจุบัน:

- Anthropic: wrappers สำหรับ Claude stream และ helpers สำหรับ `service_tier` / beta
- OpenAI: builders ของ provider, helpers สำหรับ default-model, realtime providers
- OpenRouter: builder ของ provider พร้อม helpers สำหรับ onboarding/config

หาก helper ใดมีประโยชน์เฉพาะภายใน bundled provider package เดียว ให้เก็บไว้บน
package-root seam ของ package นั้น แทนที่จะย้ายขึ้นไปไว้ใน `openclaw/plugin-sdk/*`

ยังมี helper seams ที่สร้างขึ้นบางส่วนใน `openclaw/plugin-sdk/<bundled-id>` สำหรับ
การบำรุงรักษา bundled-plugin และความเข้ากันได้ เช่น
`plugin-sdk/feishu-setup` หรือ `plugin-sdk/zalo-setup` ให้ถือว่าสิ่งเหล่านี้เป็น
surfaces ที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ third-party plugins ใหม่

## เช็กลิสต์ก่อนส่ง

<Check>**package.json** มี metadata ของ `openclaw` ถูกต้อง</Check>
<Check>มี **openclaw.plugin.json** manifest และถูกต้อง</Check>
<Check>Entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>imports ทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เฉพาะเจาะจง</Check>
<Check>internal imports ใช้ local modules ไม่ใช่ SDK self-imports</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (สำหรับ plugins ภายใน repo)</Check>

## การทดสอบ Beta Release

1. ติดตาม release tags บน GitHub ของ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครผ่าน `Watch` > `Releases` Beta tags จะมีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี OpenClaw บน X อย่างเป็นทางการ [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้
2. ทดสอบ Plugin ของคุณกับ beta tag ทันทีที่มันปรากฏขึ้น ช่วงเวลาก่อน stable โดยทั่วไปมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง `plugin-forum` บน Discord หลังจากทดสอบแล้ว โดยระบุว่า `all good` หรืออธิบายสิ่งที่พัง หากคุณยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีบางอย่างพัง ให้เปิดหรืออัปเดต issue ที่มีชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ป้ายกำกับ `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปที่ `main` โดยตั้งชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ไว้ทั้งใน PR และในเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถติดป้ายกำกับ PR ได้ ดังนั้นชื่อ PR จึงเป็นสัญญาณฝั่ง PR สำหรับ maintainers และระบบอัตโนมัติ blocker ที่มี PR จะถูก merge; blocker ที่ไม่มีอาจยังถูกปล่อยออกไป anyway Maintainers จะติดตามเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานั้น การแก้ไขของคุณก็มักจะไปลงในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง channel plugin สำหรับการส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง provider plugin สำหรับโมเดล
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/th/plugins/sdk-overview">
    import map และเอกสารอ้างอิง registration API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, search, subagent ผ่าน api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/th/plugins/sdk-testing">
    utilities และรูปแบบสำหรับการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    เอกสารอ้างอิง schema ของ manifest แบบเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [Plugin Architecture](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugins
