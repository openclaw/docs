---
read_when:
    - คุณต้องการสร้าง OpenClaw Plugin ใหม่
    - คุณต้องการคู่มือเริ่มต้นอย่างรวดเร็วสำหรับการพัฒนา Plugin
    - คุณกำลังเพิ่มช่องทาง ผู้ให้บริการ เครื่องมือ หรือความสามารถอื่นใหม่ให้กับ OpenClaw
sidebarTitle: Getting Started
summary: สร้าง Plugin OpenClaw ตัวแรกของคุณได้ในไม่กี่นาที
title: การสร้าง Plugin
x-i18n:
    generated_at: "2026-05-04T02:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ,
การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ, เครื่องมือของเอเจนต์ หรือการผสมผสาน
รูปแบบใดก็ได้

คุณไม่จำเป็นต้องเพิ่ม Plugin ของคุณลงในคลังเก็บ OpenClaw เผยแพร่ไปยัง
[ClawHub](/th/tools/clawhub) แล้วผู้ใช้ติดตั้งด้วย
`openclaw plugins install clawhub:<package-name>` สเป็กแพ็กเกจที่ไม่มีคำนำหน้ายังคง
ติดตั้งจาก npm ระหว่างช่วงตัดระบบของการเปิดตัว

## ข้อกำหนดเบื้องต้น

- Node >= 22 และตัวจัดการแพ็กเกจ (npm หรือ pnpm)
- คุ้นเคยกับ TypeScript (ESM)
- สำหรับ Plugin ภายในคลังเก็บ: โคลนคลังเก็บและรัน `pnpm install` แล้ว การพัฒนา
  Plugin จากชุดซอร์สที่เช็กเอาต์ใช้ได้เฉพาะ pnpm เพราะ OpenClaw โหลด Plugin ที่บันเดิลมา
  จากแพ็กเกจเวิร์กสเปซ `extensions/*`

## Plugin ประเภทใด?

<CardGroup cols={3}>
  <Card title="Plugin ช่องทาง" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ (Discord, IRC ฯลฯ)
  </Card>
  <Card title="Plugin ผู้ให้บริการ" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    เพิ่มผู้ให้บริการโมเดล (LLM, พร็อกซี หรือปลายทางกำหนดเอง)
  </Card>
  <Card title="Plugin เครื่องมือ / ฮุก" icon="wrench" href="/th/plugins/hooks">
    ลงทะเบียนเครื่องมือของเอเจนต์, ฮุกเหตุการณ์ หรือบริการ — อ่านต่อด้านล่าง
  </Card>
</CardGroup>

สำหรับ Plugin ช่องทางที่ไม่รับประกันว่าจะถูกติดตั้งเมื่อการเริ่มต้นใช้งาน/การตั้งค่า
ทำงาน ให้ใช้ `createOptionalChannelSetupSurface(...)` จาก
`openclaw/plugin-sdk/channel-setup` ฟังก์ชันนี้สร้างคู่อะแดปเตอร์การตั้งค่า + วิซาร์ด
ที่ประกาศข้อกำหนดการติดตั้งและปิดกั้นการเขียนค่ากำหนดจริงอย่างปลอดภัย
จนกว่า Plugin จะถูกติดตั้ง

## เริ่มต้นอย่างรวดเร็ว: Plugin เครื่องมือ

คำแนะนำทีละขั้นตอนนี้สร้าง Plugin ขั้นต่ำที่ลงทะเบียนเครื่องมือของเอเจนต์ Plugin ช่องทาง
และ Plugin ผู้ให้บริการมีคู่มือเฉพาะที่ลิงก์ไว้ด้านบน

<Steps>
  <Step title="สร้างแพ็กเกจและแมนิเฟสต์">
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

    Plugin ทุกตัวต้องมีแมนิเฟสต์ แม้จะไม่มีการกำหนดค่า เครื่องมือที่ลงทะเบียนขณะรันไทม์
    ต้องอยู่ในรายการ `contracts.tools` เพื่อให้ OpenClaw ค้นพบ Plugin เจ้าของ
    ได้โดยไม่ต้องโหลดรันไทม์ของ Plugin ทุกตัว Plugin ควรประกาศ
    `activation.onStartup` อย่างตั้งใจด้วย ตัวอย่างนี้ตั้งค่าเป็น `true` ดู
    [แมนิเฟสต์](/th/plugins/manifest) สำหรับสคีมาฉบับเต็ม ตัวอย่างการเผยแพร่ ClawHub
    แบบมาตรฐานอยู่ใน `docs/snippets/plugin-publish/`

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
    `defineChannelPluginEntry` — ดู [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
    สำหรับตัวเลือกจุดเข้าใช้งานทั้งหมด ดู [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ทดสอบและเผยแพร่">

    **Plugin ภายนอก:** ตรวจสอบและเผยแพร่ด้วย ClawHub แล้วติดตั้ง:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    สเป็กแพ็กเกจที่ไม่มีคำนำหน้าอย่าง `@myorg/openclaw-my-plugin` จะติดตั้งจาก npm ระหว่าง
    ช่วงตัดระบบของการเปิดตัว ใช้ `clawhub:` เมื่อต้องการใช้การค้นหาแพ็กเกจผ่าน ClawHub

    **Plugin ภายในคลังเก็บ:** วางไว้ใต้แผนผังเวิร์กสเปซของ Plugin ที่บันเดิลมา — ระบบจะค้นพบโดยอัตโนมัติ

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## ความสามารถของ Plugin

Plugin ตัวเดียวสามารถลงทะเบียนความสามารถได้กี่อย่างก็ได้ผ่านอ็อบเจ็กต์ `api`:

| ความสามารถ             | วิธีลงทะเบียน                              | คู่มือโดยละเอียด                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| การอนุมานข้อความ (LLM)   | `api.registerProvider(...)`                      | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins)                               |
| แบ็กเอนด์การอนุมาน CLI  | `api.registerCliBackend(...)`                    | [แบ็กเอนด์ CLI](/th/gateway/cli-backends)                                           |
| ช่องทาง / การรับส่งข้อความ    | `api.registerChannel(...)`                       | [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)                                 |
| เสียงพูด (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| เสียงแบบเรียลไทม์         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การทำความเข้าใจสื่อ    | `api.registerMediaUnderstandingProvider(...)`    | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างภาพ       | `api.registerImageGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างเพลง       | `api.registerMusicGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`       | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การดึงข้อมูลเว็บ              | `api.registerWebFetchProvider(...)`              | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| การค้นหาเว็บ             | `api.registerWebSearchProvider(...)`             | [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| มิดเดิลแวร์ผลลัพธ์เครื่องมือ | `api.registerAgentToolResultMiddleware(...)`     | [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)                          |
| เครื่องมือของเอเจนต์            | `api.registerTool(...)`                          | ด้านล่าง                                                                           |
| คำสั่งกำหนดเอง        | `api.registerCommand(...)`                       | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |
| ฮุกของ Plugin           | `api.on(...)`                                    | [ฮุกของ Plugin](/th/plugins/hooks)                                                  |
| ฮุกเหตุการณ์ภายใน   | `api.registerHook(...)`                          | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |
| เส้นทาง HTTP            | `api.registerHttpRoute(...)`                     | [ส่วนภายใน](/th/plugins/architecture-internals#gateway-http-routes)                |
| คำสั่งย่อย CLI        | `api.registerCli(...)`                           | [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints)                                        |

สำหรับ API การลงทะเบียนฉบับเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#registration-api)

Plugin ที่บันเดิลมาสามารถใช้ `api.registerAgentToolResultMiddleware(...)` เมื่อจำเป็นต้อง
เขียนผลลัพธ์เครื่องมือใหม่แบบอะซิงโครนัสก่อนที่โมเดลจะเห็นเอาต์พุต ประกาศ
รันไทม์เป้าหมายใน `contracts.agentToolResultMiddleware` เช่น
`["pi", "codex"]` นี่เป็นจุดเชื่อมต่อที่เชื่อถือได้สำหรับ Plugin ที่บันเดิลมา; Plugin ภายนอก
ควรใช้ฮุกของ Plugin OpenClaw ตามปกติ เว้นแต่ OpenClaw จะเพิ่ม
นโยบายความเชื่อถือที่ชัดเจนสำหรับความสามารถนี้

หาก Plugin ของคุณลงทะเบียนเมธอด RPC ของ Gateway แบบกำหนดเอง ให้ใช้
คำนำหน้าเฉพาะ Plugin สำหรับเมธอดเหล่านั้น เนมสเปซผู้ดูแลของแกนหลัก (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะผูกกับ
`operator.admin` เสมอ แม้ว่า Plugin จะขอขอบเขตที่แคบกว่า

ความหมายของเงื่อนไขป้องกันของฮุกที่ควรจำไว้:

- `before_tool_call`: `{ block: true }` เป็นผลสิ้นสุดและหยุดตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `before_tool_call`: `{ requireApproval: true }` หยุดการทำงานของเอเจนต์ชั่วคราวและแจ้งให้ผู้ใช้อนุมัติผ่านโอเวอร์เลย์การอนุมัติการดำเนินการ, ปุ่ม Telegram, การโต้ตอบ Discord หรือคำสั่ง `/approve` บนช่องทางใดก็ได้
- `before_install`: `{ block: true }` เป็นผลสิ้นสุดและหยุดตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` ถือว่าไม่มีการตัดสินใจ
- `message_sending`: `{ cancel: true }` เป็นผลสิ้นสุดและหยุดตัวจัดการที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` ถือว่าไม่มีการตัดสินใจ
- `message_received`: ให้ใช้ฟิลด์ `threadId` ที่มีชนิดกำกับเมื่อต้องการการกำหนดเส้นทางเธรด/หัวข้อขาเข้า เก็บ `metadata` ไว้สำหรับข้อมูลเพิ่มเติมเฉพาะช่องทาง
- `message_sending`: ให้ใช้ฟิลด์กำหนดเส้นทาง `replyToId` / `threadId` ที่มีชนิดกำกับแทนคีย์ข้อมูลเมตาเฉพาะช่องทาง

คำสั่ง `/approve` จัดการทั้งการอนุมัติการดำเนินการและการอนุมัติของ Plugin ด้วยกลไกสำรองที่มีขอบเขต: เมื่อไม่พบรหัสการอนุมัติการดำเนินการ OpenClaw จะลองใช้รหัสเดียวกันผ่านการอนุมัติของ Plugin การส่งต่อการอนุมัติของ Plugin สามารถกำหนดค่าแยกต่างหากได้ผ่าน `approvals.plugin` ในการกำหนดค่า

หากระบบเชื่อมต่อการอนุมัติแบบกำหนดเองต้องตรวจจับกรณีกลไกสำรองที่มีขอบเขตเดียวกันนั้น
ให้เลือกใช้ `isApprovalNotFoundError` จาก `openclaw/plugin-sdk/error-runtime`
แทนการจับคู่สตริงการหมดอายุของการอนุมัติด้วยตนเอง

ดู [ฮุกของ Plugin](/th/plugins/hooks) สำหรับตัวอย่างและเอกสารอ้างอิงของฮุก

## การลงทะเบียนเครื่องมือของเอเจนต์

เครื่องมือคือฟังก์ชันที่มีชนิดกำกับซึ่ง LLM สามารถเรียกใช้ได้ เครื่องมืออาจเป็นแบบบังคับ (พร้อมใช้งานเสมอ)
หรือแบบไม่บังคับ (ผู้ใช้เลือกเปิดใช้):

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

เครื่องมือทุกตัวที่ลงทะเบียนด้วย `api.registerTool(...)` ต้องประกาศไว้ใน
แมนิเฟสต์ของ Plugin ด้วย:

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
ดังนั้น Plugin จึงไม่ทำซ้ำข้อมูล `description` หรือ schema ใน manifest สัญญาของ
manifest ประกาศเฉพาะความเป็นเจ้าของและการค้นพบเท่านั้น ส่วนการดำเนินการยังคงเรียก
implementation ของเครื่องมือที่ลงทะเบียนจริงอยู่
ตั้งค่า `toolMetadata.<tool>.optional: true` สำหรับเครื่องมือที่ลงทะเบียนด้วย
`api.registerTool(..., { optional: true })` เพื่อให้ OpenClaw สามารถหลีกเลี่ยงการโหลด
runtime ของ Plugin นั้นจนกว่าเครื่องมือจะถูกเพิ่มใน allowlist อย่างชัดเจน

ผู้ใช้เปิดใช้เครื่องมือแบบ optional ใน config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ชื่อเครื่องมือต้องไม่ชนกับเครื่องมือหลัก (conflicts จะถูกข้าม)
- เครื่องมือที่มีออบเจ็กต์การลงทะเบียนผิดรูปแบบ รวมถึงไม่มี `parameters` จะถูกข้ามและรายงานใน diagnostics ของ Plugin แทนที่จะทำให้การรัน agent ล้มเหลว
- ใช้ `optional: true` สำหรับเครื่องมือที่มีผลข้างเคียงหรือต้องการ binary เพิ่มเติม
- ผู้ใช้สามารถเปิดใช้เครื่องมือทั้งหมดจาก Plugin ได้โดยเพิ่ม plugin id ลงใน `tools.allow`

## การลงทะเบียนคำสั่ง CLI

Plugin สามารถเพิ่มกลุ่มคำสั่งราก `openclaw` ด้วย `api.registerCli` ได้ ระบุ
`descriptors` สำหรับรากคำสั่งระดับบนสุดทุกคำสั่ง เพื่อให้ OpenClaw สามารถแสดงและจัดเส้นทาง
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

หลังติดตั้ง ให้ตรวจสอบการลงทะเบียน runtime และดำเนินการคำสั่ง:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## แนวทางการ import

import จากพาธ `openclaw/plugin-sdk/<subpath>` ที่เจาะจงเสมอ:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

สำหรับอ้างอิง subpath ทั้งหมด โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview)

ภายใน Plugin ของคุณ ให้ใช้ไฟล์ barrel ภายในเครื่อง (`api.ts`, `runtime-api.ts`) สำหรับ
การ import ภายใน ห้าม import Plugin ของคุณเองผ่านพาธ SDK

สำหรับ provider plugins ให้เก็บ helper เฉพาะ provider ไว้ใน barrel ที่รากของ package
เหล่านั้น เว้นแต่ seam นั้นจะเป็นแบบทั่วไปจริง ๆ ตัวอย่างที่ bundled อยู่ในปัจจุบัน:

- Anthropic: wrapper ของสตรีม Claude และ helper สำหรับ `service_tier` / beta
- OpenAI: provider builders, default-model helpers, realtime providers
- OpenRouter: provider builder พร้อม helper สำหรับ onboarding/config

หาก helper มีประโยชน์เฉพาะภายใน package ของ provider ที่ bundled ไว้เพียงตัวเดียว ให้เก็บไว้ที่
seam รากของ package นั้นแทนการโปรโมตเข้าไปใน `openclaw/plugin-sdk/*`

seam helper `openclaw/plugin-sdk/<bundled-id>` บางรายการที่สร้างขึ้นยังคงมีอยู่สำหรับ
การบำรุงรักษา bundled-plugin เมื่อมีการติดตามการใช้งานของ owner ให้ถือว่าสิ่งเหล่านี้เป็น
พื้นผิวที่สงวนไว้ ไม่ใช่รูปแบบเริ่มต้นสำหรับ Plugin ของบุคคลที่สามตัวใหม่

## รายการตรวจสอบก่อนส่ง

<Check>**package.json** มี metadata `openclaw` ที่ถูกต้อง</Check>
<Check>มี manifest **openclaw.plugin.json** และถูกต้อง</Check>
<Check>entry point ใช้ `defineChannelPluginEntry` หรือ `definePluginEntry`</Check>
<Check>การ import ทั้งหมดใช้พาธ `plugin-sdk/<subpath>` ที่เจาะจง</Check>
<Check>การ import ภายในใช้โมดูลในเครื่อง ไม่ใช่ SDK self-imports</Check>
<Check>การทดสอบผ่าน (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` ผ่าน (Plugin ใน repo)</Check>

## การทดสอบรุ่น beta

1. ติดตาม release tags ของ GitHub บน [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) และ subscribe ผ่าน `Watch` > `Releases` tag ของ beta จะมีรูปแบบเช่น `v2026.3.N-beta.1` คุณยังสามารถเปิด notifications สำหรับบัญชี X อย่างเป็นทางการของ OpenClaw [@openclaw](https://x.com/openclaw) เพื่อรับประกาศ release ได้ด้วย
2. ทดสอบ Plugin ของคุณกับ beta tag ทันทีที่ปรากฏ โดยปกติช่วงเวลาก่อน stable จะมีเพียงไม่กี่ชั่วโมง
3. โพสต์ใน thread ของ Plugin คุณในช่อง Discord `plugin-forum` หลังทดสอบ โดยระบุ `all good` หรือสิ่งที่เสีย หากคุณยังไม่มี thread ให้สร้างขึ้นมา
4. หากมีสิ่งใดเสีย ให้เปิดหรืออัปเดต issue ชื่อ `Beta blocker: <plugin-name> - <summary>` และใส่ label `beta-blocker` วางลิงก์ issue ไว้ใน thread ของคุณ
5. เปิด PR ไปยัง `main` ชื่อ `fix(<plugin-id>): beta blocker - <summary>` และลิงก์ issue ทั้งใน PR และ thread Discord ของคุณ contributors ไม่สามารถติด label ให้ PR ได้ ดังนั้น title จึงเป็นสัญญาณฝั่ง PR สำหรับ maintainers และระบบอัตโนมัติ blocker ที่มี PR จะถูก merge ส่วน blocker ที่ไม่มี PR อาจถูกปล่อยออกไปอยู่ดี maintainers จะเฝ้าดู thread เหล่านี้ระหว่างการทดสอบ beta
6. ความเงียบหมายถึงผ่าน หากคุณพลาดช่วงเวลาดังกล่าว fix ของคุณน่าจะไปลงในรอบถัดไป

## ขั้นตอนถัดไป

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/th/plugins/sdk-channel-plugins">
    สร้าง Plugin ช่องทางส่งข้อความ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/th/plugins/sdk-provider-plugins">
    สร้าง Plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book-open" href="/th/plugins/sdk-overview">
    ข้อมูลอ้างอิง import map และ registration API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, search, subagent ผ่าน api.runtime
  </Card>
  <Card title="การทดสอบ" icon="test-tubes" href="/th/plugins/sdk-testing">
    ยูทิลิตีและรูปแบบการทดสอบ
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/th/plugins/manifest">
    ข้อมูลอ้างอิง schema ของ manifest ฉบับเต็ม
  </Card>
</CardGroup>

## ที่เกี่ยวข้อง

- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — เจาะลึกสถาปัตยกรรมภายใน
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง Plugin SDK
- [Manifest](/th/plugins/manifest) — รูปแบบ manifest ของ Plugin
- [Channel Plugins](/th/plugins/sdk-channel-plugins) — การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) — การสร้าง provider plugins
