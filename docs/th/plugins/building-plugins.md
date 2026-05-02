---
read_when:
    - คุณต้องการสร้าง OpenClaw Plugin ใหม่
    - คุณต้องการคู่มือเริ่มต้นใช้งานฉบับย่อสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทางใหม่ ผู้ให้บริการใหม่ เครื่องมือใหม่ หรือความสามารถอื่นให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw ตัวแรกของคุณได้ภายในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-02T10:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ, เครื่องมือของเอเจนต์ หรือการผสมผสานใดๆ
ของสิ่งเหล่านี้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณลงใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลองใช้ ClawHub ก่อนและ
ถอยกลับไปใช้ npm โดยอัตโนมัติสำหรับแพ็กเกจที่ยังใช้การแจกจ่ายผ่าน npm

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ใน repository: clone repository และทำ `pnpm install` แล้ว การพัฒนา
  Plugin จาก source checkout ใช้ได้เฉพาะ pnpm เพราะ OpenClaw โหลด Plugin ที่ bundled
  จากแพ็กเกจ workspace `extensions/*`

## Plugin แบบใด?

<CardGroup cols={3}>
  <Card title="Channel Plugin" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Tool / hook Plugin" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือเอเจนต์, event hooks หรือบริการ — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Channel Plugin ที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อ onboarding/setup
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งจะสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้งและปิดกั้นการเขียน config จริงจนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: Tool Plugin

คำแนะนำนี้สร้าง Plugin แบบน้อยที่สุดที่ลงทะเบียนเครื่องมือเอเจนต์ Channel
และ Provider Plugin มีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

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
    ต้องถูกระบุไว้ใน `contracts.tools` เพื่อให้ OpenClaw ค้นพบ Plugin เจ้าของได้
    โดยไม่ต้องโหลด runtime ของทุก Plugin นอกจากนี้ Plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจ ตัวอย่างนี้ตั้งค่าเป็น `true` ดู schema ฉบับเต็มได้ที่
    [Manifest](/th/plugins/manifest) snippet สำหรับเผยแพร่ ClawHub แบบ canonical
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

    OpenClaw ยังตรวจสอบ ClawHub ก่อน npm สำหรับ package spec แบบไม่มี prefix เช่น
    `@myorg/openclaw-my-plugin`; npm ยังเป็น fallback สำหรับแพ็กเกจที่ยังไม่ได้
    ย้ายไป ClawHub

    **Plugin ใน repository:** วางไว้ใต้แผนผัง workspace ของ Plugin ที่ bundled — จะถูกค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถได้จำนวนเท่าใดก็ได้ผ่านอ็อบเจกต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือโดยละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/th/plugins/sdk-provider-plugins)                               |
| backend การอนุมาน CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/th/gateway/cli-backends)                                           |
| ช่องทาง / การส่งข้อความ    | `api.registerChannel(...)`                       | [Channel Plugins](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลเว็บ              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือเอเจนต์            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งแบบกำหนดเอง        | `api.registerCommand(...)`                       | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/th/plugins/hooks)                                                  |
| hooks เหตุการณ์ภายใน   | `api.registerHook(...)`                          | [Entry Points](/th/plugins/sdk-entrypoints)                                        |
| route HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/th/plugins/architecture-internals#gateway-http-routes)                |
| subcommand ของ CLI        | `api.registerCli(...)`                           | [Entry Points](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนทั้งหมด ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Plugin ที่ bundled สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อจำเป็นต้อง
เขียนผลลัพธ์เครื่องมือแบบ async ใหม่ก่อนที่โมเดลจะเห็น output ให้ประกาศ runtime
เป้าหมายใน `contracts.agentToolResultMiddleware` ตัวอย่างเช่น
`["pi", "codex"]` นี่เป็น seam ของ bundled Plugin ที่เชื่อถือได้; Plugin ภายนอก
ควรเลือกใช้ OpenClaw plugin hooks ตามปกติ เว้นแต่ว่า OpenClaw จะเพิ่มนโยบายความเชื่อถือ
ที่ชัดเจนสำหรับความสามารถนี้

ถ้า Plugin ของคุณลงทะเบียนเมธอด RPC ของ Gateway แบบกำหนดเอง ให้คงไว้บน prefix
เฉพาะของ Plugin namespace แอดมินของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve เป็น
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

ความหมายของ hook guard ที่ควรจำ:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการทำงานของเอเจนต์ชั่วคราวและแจ้งให้ผู้ใช้ออกอนุมัติผ่าน exec approval overlay, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็น terminal และหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: ให้เลือกใช้ฟิลด์ typed `threadId` เมื่อต้องการ routing thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะช่องทาง
- `message_sending`: ให้เลือกใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทน key metadata เฉพาะช่องทาง

คำสั่ง `/approve` จัดการได้ทั้งการอนุมัติ exec และ Plugin ด้วย fallback แบบมีขอบเขต: เมื่อไม่พบ exec approval id OpenClaw จะลอง id เดิมซ้ำผ่านการอนุมัติของ Plugin สามารถกำหนดค่า forwarding การอนุมัติ Plugin แยกต่างหากได้ผ่าน `approvals.plugin` ใน config

ถ้า plumbing การอนุมัติแบบกำหนดเองจำเป็นต้องตรวจจับกรณี fallback แบบมีขอบเขตเดียวกันนั้น
ให้ใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงการหมดอายุของการอนุมัติด้วยตนเอง

ดูตัวอย่างและเอกสารอ้างอิง hook ได้ที่ [Plugin hooks](/th/plugins/hooks)

## การลงทะเบียนเครื่องมือเอเจนต์

เครื่องมือคือฟังก์ชันที่มี type ซึ่ง LLM สามารถเรียกได้ เครื่องมืออาจเป็นแบบ required (พร้อมใช้งานเสมอ)
หรือ optional (ผู้ใช้เลือกเปิดใช้):

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

ทุกเครื่องมือที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องถูกประกาศใน
manifest ของ Plugin ด้วย:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

ผู้ใช้เปิดใช้เครื่องมือ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือหลัก (รายการที่ขัดแย้งกันจะถูกข้าม)
- เครื่องมือที่มีออบเจ็กต์การลงทะเบียนผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน diagnostics ของ Plugin แทนที่จะทำให้การรัน agent เสียหาย
- ใช้ `optional: true` สำหรับเครื่องมือที่มีผลข้างเคียงหรือต้องใช้ไบนารีเพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก Plugin ได้โดยเพิ่มรหัส Plugin ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugin สามารถเพิ่มกลุ่มคำสั่ง `openclaw` ระดับรากได้ด้วย `api.registerCli` ระบุ
`descriptors` สำหรับรากคำสั่งระดับบนสุดทุกคำสั่ง เพื่อให้ OpenClaw แสดงและกำหนดเส้นทาง
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

ให้ import จากพาธ `openclaw/plugin-sdk/<subpath>` ที่เจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การ import ภายใน อย่า import Plugin ของคุณเองผ่านพาธ SDK ของมัน

สำหรับ Plugin ของ provider ให้เก็บ helper เฉพาะ provider ไว้ใน barrel ระดับรากของแพ็กเกจเหล่านั้น
เว้นแต่ seam นั้นจะเป็นแบบทั่วไปจริง ๆ ตัวอย่างที่ bundled อยู่ในปัจจุบัน:

- Anthropic: wrapper สำหรับสตรีม Claude และ helper ของ `service_tier` / beta
- OpenAI: builder ของ provider, helper สำหรับโมเดลเริ่มต้น, provider แบบ realtime
- OpenRouter: builder ของ provider พร้อม helper สำหรับ onboarding/config

หาก helper มีประโยชน์เฉพาะภายในแพ็กเกจ provider ที่ bundled แพ็กเกจเดียว ให้เก็บไว้บน
seam ระดับรากของแพ็กเกจนั้น แทนที่จะยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

seam helper ที่สร้างขึ้นบางรายการใน `openclaw/plugin-sdk/<bundled-id>` ยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled Plugin เมื่อมีการติดตามการใช้งานของเจ้าของไว้แล้ว ให้ถือว่าสิ่งเหล่านี้เป็น
surface ที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ Plugin บุคคลที่สามใหม่

## เช็กลิสต์ก่อนส่ง

<Check>**package.json** มี metadata ของ `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเข้าใช้งานใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การ import ทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การ import ภายในใช้โมดูลภายในเครื่อง ไม่ใช่การ self-import ผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (สำหรับ Plugin ใน repo)</Check>

## การทดสอบรุ่น beta

1. ติดตามแท็ก release บน GitHub ที่ [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครติดตามผ่าน `Watch` > `Releases` แท็ก beta มีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X อย่างเป็นทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับแท็ก beta ทันทีที่ปรากฏ โดยปกติช่วงเวลาก่อน stable จะมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยระบุ `all good` หรือสิ่งที่เสีย หากคุณยังไม่มีเธรด ให้สร้างขึ้นมา
4. หากมีบางอย่างเสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` โดยตั้งชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ของคุณ contributor ไม่สามารถใส่ label ให้ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับ maintainer และ automation ตัว blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มี PR อาจถูกปล่อยไปตามเดิม maintainer จะติดตามเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ fix ของคุณน่าจะถูกนำเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin สำหรับช่องทางข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin สำหรับ provider โมเดล
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/th/plugins/sdk-overview">
    import map และเอกสารอ้างอิง API การลงทะเบียน
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

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ Plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง Plugin สำหรับช่องทาง
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง Plugin สำหรับ provider
