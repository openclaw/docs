---
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعهٔ Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin OpenClaw خود را در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-02T20:47:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins قابلیت‌های تازه‌ای به OpenClaw اضافه می‌کنند: کانال‌ها، ارائه‌دهندگان مدل،
گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ، درک رسانه، تولید تصویر، تولید
ویدئو، واکشی وب، جستجوی وب، ابزارهای عامل، یا هر ترکیبی از آن‌ها.

لازم نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install clawhub:<package-name>` نصب می‌کنند. مشخصات بستهٔ بدون پیشوند همچنان
در دورهٔ گذار راه‌اندازی از npm نصب می‌شوند.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن کلون شده و `pnpm install` انجام شده باشد. توسعهٔ Plugin از checkout منبع فقط با pnpm انجام می‌شود، چون OpenClaw، Pluginهای همراه را از بسته‌های workspace در `extensions/*` بارگذاری می‌کند.

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی وصل کنید (Discord، IRC، و غیره)
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهندهٔ مدل اضافه کنید (LLM، پراکسی، یا endpoint سفارشی)
  </Card>
  <Card title="Plugin ابزار / hook" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، hookهای رویداد، یا سرویس‌ها را ثبت کنید — ادامه در پایین
  </Card>
</CardGroup>

برای Plugin کانالی که تضمین نشده هنگام اجرای onboarding/setup نصب باشد،
از `createOptionalChannelSetupSurface(...)` در
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این یک جفت آداپتر راه‌اندازی + جادوگر تولید می‌کند
که نیاز نصب را اعلام می‌کند و تا زمانی که Plugin نصب نشده باشد، نوشتن واقعی پیکربندی را به‌صورت بسته شکست می‌دهد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار عامل ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که در بالا پیوند شده‌اند.

<Steps>
  <Step title="بسته و manifest را بسازید">
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

    هر Plugin به یک manifest نیاز دارد، حتی بدون پیکربندی. ابزارهایی که در runtime ثبت می‌شوند
    باید در `contracts.tools` فهرست شوند تا OpenClaw بتواند Plugin مالک را
    بدون بارگذاری runtime همهٔ Pluginها کشف کند. Pluginها همچنین باید
    `activation.onStartup` را آگاهانه اعلام کنند. این مثال آن را روی `true` تنظیم می‌کند. برای schema کامل، [Manifest](/fa/plugins/manifest) را ببینید. قطعه‌کدهای رسمی انتشار ClawHub
    در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="entry point را بنویسید">

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

    `definePluginEntry` برای Pluginهای غیرکانالی است. برای کانال‌ها، از
    `defineChannelPluginEntry` استفاده کنید — [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
    برای گزینه‌های کامل entry point، [Entry Points](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="آزمایش و انتشار">

    **Pluginهای خارجی:** با ClawHub اعتبارسنجی و منتشر کنید، سپس نصب کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    مشخصات بستهٔ بدون پیشوند مانند `@myorg/openclaw-my-plugin` در دورهٔ گذار راه‌اندازی
    از npm نصب می‌شوند. وقتی تفکیک ClawHub می‌خواهید، از `clawhub:` استفاده کنید.

    **Pluginهای داخل مخزن:** زیر درخت workspace Plugin همراه قرار دهید — به‌صورت خودکار کشف می‌شود.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin واحد می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت                 | روش ثبت                                           | راهنمای تفصیلی                                                                    |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| استنتاج متن (LLM)      | `api.registerProvider(...)`                      | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)                            |
| backend استنتاج CLI    | `api.registerCliBackend(...)`                    | [Backendهای CLI](/fa/gateway/cli-backends)                                           |
| کانال / پیام‌رسانی     | `api.registerChannel(...)`                       | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)                                   |
| گفتار (TTS/STT)        | `api.registerSpeechProvider(...)`                | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بی‌درنگ        | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بی‌درنگ           | `api.registerRealtimeVoiceProvider(...)`         | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه              | `api.registerMediaUnderstandingProvider(...)`    | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر            | `api.registerImageGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی           | `api.registerMusicGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو            | `api.registerVideoGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| واکشی وب               | `api.registerWebFetchProvider(...)`              | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جستجوی وب              | `api.registerWebSearchProvider(...)`             | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجهٔ ابزار | `api.registerAgentToolResultMiddleware(...)`     | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api)                            |
| ابزارهای عامل          | `api.registerTool(...)`                          | پایین                                                                             |
| فرمان‌های سفارشی       | `api.registerCommand(...)`                       | [Entry Points](/fa/plugins/sdk-entrypoints)                                          |
| hookهای Plugin         | `api.on(...)`                                    | [hookهای Plugin](/fa/plugins/hooks)                                                  |
| hookهای رویداد داخلی   | `api.registerHook(...)`                          | [Entry Points](/fa/plugins/sdk-entrypoints)                                          |
| مسیرهای HTTP           | `api.registerHttpRoute(...)`                     | [جزئیات داخلی](/fa/plugins/architecture-internals#gateway-http-routes)              |
| زیر‌فرمان‌های CLI      | `api.registerCli(...)`                           | [Entry Points](/fa/plugins/sdk-entrypoints)                                          |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای همراه می‌توانند زمانی از `api.registerAgentToolResultMiddleware(...)` استفاده کنند که
به بازنویسی async نتیجهٔ ابزار پیش از دیده‌شدن خروجی توسط مدل نیاز دارند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک مرز مورد اعتماد برای Pluginهای همراه است؛ Pluginهای خارجی
باید hookهای عادی Plugin در OpenClaw را ترجیح دهند، مگر اینکه OpenClaw برای این قابلیت
یک سیاست اعتماد صریح اضافه کند.

اگر Plugin شما متدهای RPC سفارشی Gateway ثبت می‌کند، آن‌ها را روی یک پیشوند
خاص Plugin نگه دارید. namespaceهای مدیریتی core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری بخواهد.

معناشناسی guard برای hookها که باید به خاطر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را متوقف می‌کند و از کاربر از طریق overlay تأیید exec، دکمه‌های Telegram، تعاملات Discord، یا فرمان `/approve` روی هر کانالی درخواست تأیید می‌کند.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، فیلد typed `threadId` را ترجیح دهید. `metadata` را برای موارد اضافی خاص کانال نگه دارید.
- `message_sending`: فیلدهای typed مسیریابی `replyToId` / `threadId` را بر کلیدهای metadata خاص کانال ترجیح دهید.

فرمان `/approve` هم تأییدهای exec و هم تأییدهای Plugin را با fallback محدود مدیریت می‌کند: وقتی شناسهٔ تأیید exec پیدا نشود، OpenClaw همان شناسه را از مسیر تأییدهای Plugin دوباره امتحان می‌کند. forwarding تأیید Plugin را می‌توان مستقل از طریق `approvals.plugin` در پیکربندی تنظیم کرد.

اگر لوله‌کشی تأیید سفارشی نیاز دارد همان حالت fallback محدود را تشخیص دهد،
به‌جای تطبیق دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` را از `openclaw/plugin-sdk/error-runtime`
ترجیح دهید.

برای نمونه‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها تابع‌های typed هستند که LLM می‌تواند فراخوانی کند. آن‌ها می‌توانند اجباری (همیشه
در دسترس) یا اختیاری (با انتخاب کاربر) باشند:

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

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود باید در manifest
Plugin نیز اعلام شود:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw descriptor اعتبارسنجی‌شده را از ابزار ثبت‌شده دریافت و cache می‌کند،
بنابراین Pluginها `description` یا داده‌های schema را در manifest تکرار نمی‌کنند. قرارداد
manifest فقط مالکیت و کشف را اعلام می‌کند؛ اجرا همچنان پیاده‌سازی ابزار ثبت‌شدهٔ زنده را
فراخوانی می‌کند.

کاربران ابزارهای اختیاری را در پیکربندی فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای هسته تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی که اشیای ثبت نامعتبر دارند، از جمله نبود `parameters`، نادیده گرفته می‌شوند و به‌جای خراب‌کردن اجرای agent، در عیب‌یابی Plugin گزارش می‌شوند
- برای ابزارهایی که اثر جانبی یا نیازمندی‌های باینری اضافه دارند از `optional: true` استفاده کنید
- کاربران می‌توانند با افزودن شناسه Plugin به `tools.allow` همه ابزارهای یک Plugin را فعال کنند

## ثبت دستورهای CLI

Pluginها می‌توانند با `api.registerCli` گروه‌های دستور ریشه `openclaw` اضافه کنند. برای هر ریشه دستور سطح بالا
`descriptors` ارائه کنید تا OpenClaw بتواند دستور را بدون بارگذاری زودهنگام runtime هر Plugin نمایش دهد و مسیریابی کند.

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

پس از نصب، ثبت runtime را بررسی کنید و دستور را اجرا کنید:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## قراردادهای import

همیشه از مسیرهای متمرکز `openclaw/plugin-sdk/<subpath>` import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

برای مرجع کامل زیرمسیرها، [نمای کلی SDK](/fa/plugins/sdk-overview) را ببینید.

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید — هرگز Plugin خودتان را از طریق مسیر SDK آن import نکنید.

برای Pluginهای ارائه‌دهنده، کمک‌کننده‌های مختص ارائه‌دهنده را در همان barrelهای ریشه بسته نگه دارید، مگر اینکه seam واقعا عمومی باشد. نمونه‌های بسته‌بندی‌شده فعلی:

- Anthropic: wrapperهای stream کلود و کمک‌کننده‌های `service_tier` / beta
- OpenAI: سازنده‌های ارائه‌دهنده، کمک‌کننده‌های مدل پیش‌فرض، ارائه‌دهنده‌های realtime
- OpenRouter: سازنده ارائه‌دهنده به‌همراه کمک‌کننده‌های onboarding/config

اگر یک کمک‌کننده فقط داخل یک بسته ارائه‌دهنده بسته‌بندی‌شده کاربرد دارد، آن را به‌جای ارتقا دادن به `openclaw/plugin-sdk/*` روی seam ریشه همان بسته نگه دارید.

برخی seamهای کمک‌کننده تولیدشده `openclaw/plugin-sdk/<bundled-id>` هنوز برای نگه‌داری Pluginهای بسته‌بندی‌شده، وقتی استفاده مالک ردیابی‌شده دارند، وجود دارند. با آن‌ها به‌عنوان سطح‌های رزروشده رفتار کنید، نه الگوی پیش‌فرض برای Pluginهای شخص ثالث جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** فراداده درست `openclaw` را دارد</Check>
<Check>مانیفست **openclaw.plugin.json** حاضر و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها موفق می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` موفق می‌شود (Pluginهای داخل repo)</Check>

## تست نسخه beta

1. تگ‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) زیر نظر بگیرید و از مسیر `Watch` > `Releases` مشترک شوید. تگ‌های beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X، یعنی [@openclaw](https://x.com/openclaw)، را برای اعلامیه‌های انتشار فعال کنید.
2. به‌محض ظاهرشدن تگ beta، Plugin خود را در برابر آن تست کنید. بازه زمانی پیش از stable معمولا فقط چند ساعت است.
3. پس از تست، در thread مربوط به Plugin خود در کانال Discord با نام `plugin-forum`، یا `all good` را بنویسید یا توضیح دهید چه چیزی خراب شده است. اگر هنوز thread ندارید، یکی بسازید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و برچسب `beta-blocker` را اعمال کنید. لینک issue را در thread خود بگذارید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند به PRها برچسب بزنند، پس عنوان PR سیگنال سمت PR برای نگه‌دارندگان و اتوماسیون است. مسدودکننده‌هایی که PR دارند merge می‌شوند؛ مسدودکننده‌های بدون PR ممکن است بااین‌حال منتشر شوند. نگه‌دارندگان در طول تست beta این threadها را زیر نظر دارند.
6. سکوت یعنی سبز. اگر این بازه را از دست بدهید، احتمالا اصلاح شما در چرخه بعدی وارد می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهنده مدل بسازید
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع نقشه import و API ثبت
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای تست
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema مانیفست
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — بررسی عمیق معماری داخلی
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع SDK مربوط به Plugin
- [مانیفست](/fa/plugins/manifest) — قالب مانیفست Plugin
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — ساخت Pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) — ساخت Pluginهای ارائه‌دهنده
