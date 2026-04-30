---
read_when:
    - คุณต้องการสร้าง Plugin ใหม่ของ OpenClaw
    - คุณต้องการคู่มือเริ่มต้นใช้งานอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw แรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ,
การสร้างวิดีโอ, การดึงข้อมูลจากเว็บ, การค้นหาเว็บ, เครื่องมือเอเจนต์ หรือการผสมผสานใดๆ
ของความสามารถเหล่านี้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณลงใน repository ของ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install <package-name>` OpenClaw จะลอง ClawHub ก่อน และ
fallback ไปยัง npm โดยอัตโนมัติสำหรับ package ที่ยังใช้การแจกจ่ายผ่าน npm อยู่

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการ package (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ใน repo: clone repository แล้วและทำ `pnpm install` เสร็จแล้ว

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มส่งข้อความ (Discord, IRC เป็นต้น)
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, proxy หรือ endpoint แบบกำหนดเอง)
  </Card>
  <Card title="Plugin เครื่องมือ / hook" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือเอเจนต์, event hook หรือบริการ — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Plugin ช่องทางที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อการ onboarding/setup
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ซึ่งจะสร้างคู่ setup adapter + wizard
ที่ประกาศข้อกำหนดการติดตั้ง และปิดกั้นอย่างปลอดภัยสำหรับการเขียน config จริง
จนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: Plugin เครื่องมือ

คำแนะนำนี้สร้าง Plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือเอเจนต์ Plugin ช่องทาง
และ Plugin ผู้ให้บริการมีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

<Steps>
  <Step title="สร้าง package และ manifest">
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

    Plugin ทุกตัวต้องมี manifest แม้จะไม่มี config และ Plugin ทุกตัวควร
    ประกาศ `activation.onStartup` อย่างตั้งใจ เครื่องมือที่ลงทะเบียนตอน runtime ต้องมี
    การ import ตอนเริ่มต้น ดังนั้นตัวอย่างนี้จึงตั้งค่าเป็น `true` ดู
    [Manifest](/th/plugins/manifest) สำหรับ schema ฉบับเต็ม snippet สำหรับเผยแพร่ไปยัง ClawHub
    ที่เป็น canonical อยู่ใน `docs/snippets/plugin-publish/`

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
    `defineChannelPluginEntry` — ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือก entry point ทั้งหมด ดู [Entry Point](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** validate และเผยแพร่ด้วย ClawHub แล้วติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw ยังตรวจสอบ ClawHub ก่อน npm สำหรับ spec ของ package แบบ bare เช่น
    `@myorg/openclaw-my-plugin`; npm ยังคงเป็น fallback สำหรับ package ที่
    ยังไม่ได้ย้ายไป ClawHub

    **Plugin ใน repo:** วางไว้ใต้ workspace tree ของ Plugin ที่ bundled — จะถูกค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin เดียวสามารถลงทะเบียนความสามารถจำนวนเท่าใดก็ได้ผ่าน object `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือโดยละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)                               |
| backend การอนุมาน CLI  | `api.registerCliBackend(...)`                    | [CLI Backend](/th/gateway/cli-backends)                                           |
| ช่องทาง / การส่งข้อความ    | `api.registerChannel(...)`                       | [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การทำความเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลจากเว็บ              | `api.registerWebFetchProvider(...)`              | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือเอเจนต์            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งแบบกำหนดเอง        | `api.registerCommand(...)`                       | [Entry Point](/th/plugins/sdk-entrypoints)                                        |
| hook ของ Plugin           | `api.on(...)`                                    | [hook ของ Plugin](/th/plugins/hooks)                                                  |
| hook เหตุการณ์ภายใน   | `api.registerHook(...)`                          | [Entry Point](/th/plugins/sdk-entrypoints)                                        |
| route HTTP            | `api.registerHttpRoute(...)`                     | [ภายในระบบ](/th/plugins/architecture-internals#gateway-http-routes)                |
| subcommand ของ CLI        | `api.registerCli(...)`                           | [Entry Point](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนทั้งหมด ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Plugin ที่ bundled สามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อ
ต้องการเขียนผลลัพธ์ของเครื่องมือใหม่แบบ async ก่อนที่โมเดลจะเห็น output ประกาศ
runtime เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่เป็น seam ของ Plugin ที่ bundled และเชื่อถือได้; Plugin
ภายนอกควรเลือกใช้ hook ของ Plugin OpenClaw ตามปกติ เว้นแต่ OpenClaw จะเพิ่ม
นโยบายความเชื่อถือที่ชัดเจนสำหรับความสามารถนี้

หาก Plugin ของคุณลงทะเบียนเมธอด RPC ของ Gateway แบบกำหนดเอง ให้เก็บไว้บน
prefix เฉพาะของ Plugin namespace สำหรับ admin ใน core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และ resolve เป็น
`operator.admin` เสมอ แม้ว่า Plugin จะขอ scope ที่แคบกว่าก็ตาม

ความหมายของ hook guard ที่ควรจำไว้:

- `before_tool_call`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_tool_call`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` จะหยุดการทำงานของเอเจนต์ชั่วคราวและแจ้งผู้ใช้ให้อนุมัติผ่าน exec approval overlay, ปุ่ม Telegram, interaction ของ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `before_install`: `{ block: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็น terminal และหยุด handler ที่มี priority ต่ำกว่า
- `message_sending`: `{ cancel: false }` จะถือว่าไม่มีการตัดสินใจ
- `message_received`: เลือกใช้ฟิลด์ typed `threadId` เมื่อคุณต้องการ routing ของ thread/topic ขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเสริมเฉพาะช่องทาง
- `message_sending`: เลือกใช้ฟิลด์ routing แบบ typed `replyToId` / `threadId` แทน key metadata เฉพาะช่องทาง

คำสั่ง `/approve` จัดการทั้งการอนุมัติของ exec และ Plugin ด้วย fallback แบบมีขอบเขต: เมื่อไม่พบ exec approval id, OpenClaw จะลอง id เดิมซ้ำผ่านการอนุมัติของ Plugin การส่งต่อการอนุมัติของ Plugin สามารถกำหนดค่าแยกต่างหากผ่าน `approvals.plugin` ใน config

หาก plumbing การอนุมัติแบบกำหนดเองต้องตรวจจับกรณี fallback แบบมีขอบเขตเดียวกันนี้
ให้เลือกใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่ string หมดอายุของการอนุมัติด้วยตนเอง

ดู [hook ของ Plugin](/th/plugins/hooks) สำหรับตัวอย่างและข้อมูลอ้างอิงของ hook

## การลงทะเบียนเครื่องมือเอเจนต์

เครื่องมือคือฟังก์ชันที่มี type ซึ่ง LLM สามารถเรียกได้ โดยอาจเป็นแบบจำเป็น (พร้อมใช้งานเสมอ)
หรือเป็นแบบ optional (ผู้ใช้ opt-in):

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

ผู้ใช้เปิดใช้เครื่องมือ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือของ core (conflict จะถูกข้าม)
- เครื่องมือที่มี object การลงทะเบียนผิดรูปแบบ รวมถึงขาด `parameters` จะถูกข้ามและรายงานใน diagnostics ของ Plugin แทนที่จะทำให้การรันเอเจนต์ล้มเหลว
- ใช้ `optional: true` สำหรับเครื่องมือที่มี side effect หรือข้อกำหนด binary เพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก Plugin หนึ่งตัวได้โดยเพิ่ม id ของ Plugin ลงใน `tools.allow`

## ข้อปฏิบัติในการ import

ให้ import จาก path แบบเจาะจง `openclaw/plugin-sdk/<subpath>` เสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับข้อมูลอ้างอิง subpath ฉบับเต็ม โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การ import ภายใน ห้าม import Plugin ของคุณเองผ่านพาธ SDK ของมัน

สำหรับ Plugin ผู้ให้บริการ ให้เก็บตัวช่วยเฉพาะผู้ให้บริการไว้ใน barrel ที่ package-root
เหล่านั้น เว้นแต่ว่า seam นั้นจะเป็นแบบทั่วไปจริงๆ ตัวอย่างที่มาพร้อมปัจจุบัน:

- Anthropic: wrapper สตรีม Claude และตัวช่วย `service_tier` / beta
- OpenAI: builder ผู้ให้บริการ, ตัวช่วยโมเดลเริ่มต้น, ผู้ให้บริการแบบเรียลไทม์
- OpenRouter: builder ผู้ให้บริการ รวมถึงตัวช่วย onboarding/config

หากตัวช่วยมีประโยชน์เฉพาะภายในแพ็กเกจผู้ให้บริการที่มาพร้อมเพียงหนึ่งรายการ ให้เก็บไว้บน
seam ที่ package-root นั้น แทนที่จะยกระดับเข้าไปใน `openclaw/plugin-sdk/*`

seam ตัวช่วย `openclaw/plugin-sdk/<bundled-id>` บางรายการที่สร้างขึ้นยังคงมีอยู่สำหรับ
การบำรุงรักษา Plugin ที่มาพร้อม เมื่อมีการติดตามการใช้งานของเจ้าของ ให้ถือว่าสิ่งเหล่านั้นเป็น
พื้นผิวที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ Plugin บุคคลที่สามใหม่

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มีเมทาดาทา `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>จุดเข้าใช้งานใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การ import ทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เฉพาะเจาะจง</Check>
<Check>การ import ภายในใช้โมดูลภายในเครื่อง ไม่ใช่การ self-import ผ่าน SDK</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ภายใน repo)</Check>

## การทดสอบรุ่น beta

1. เฝ้าดูแท็ก release ของ GitHub บน [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และสมัครรับข้อมูลผ่าน `Watch` > `Releases` แท็ก beta จะมีลักษณะเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิดการแจ้งเตือนสำหรับบัญชี X ทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับแท็ก beta ทันทีที่ปรากฏ ช่วงเวลาก่อน stable โดยทั่วไปมีเพียงไม่กี่ชั่วโมง
3. โพสต์ในเธรดของ Plugin ของคุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยระบุ `all good` หรือสิ่งที่พัง หากยังไม่มีเธรด ให้สร้างเธรดหนึ่งรายการ
4. หากมีบางอย่างพัง ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ป้ายกำกับ `beta-blocker` วางลิงก์ issue ไว้ในเธรดของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และเธรด Discord ของคุณ ผู้ร่วมพัฒนาไม่สามารถใส่ป้ายกำกับ PR ได้ ดังนั้นชื่อจึงเป็นสัญญาณฝั่ง PR สำหรับผู้ดูแลและระบบอัตโนมัติ blocker ที่มี PR จะถูก merge; blocker ที่ไม่มี PR อาจถูกปล่อยไปอยู่ดี ผู้ดูแลจะเฝ้าดูเธรดเหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลานี้ การแก้ไขของคุณมีแนวโน้มจะเข้าในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางการรับส่งข้อความ
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    แผนที่ import และข้อมูลอ้างอิง API การลงทะเบียน
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, การค้นหา, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Manifest ของ Plugin" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิง schema ของ manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง SDK ของ Plugin
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ Plugin
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) — การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) — การสร้าง Plugin ผู้ให้บริการ
