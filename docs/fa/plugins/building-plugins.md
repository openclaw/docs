---
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعه Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin OpenClaw خود را در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-01T11:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c80b831161c93b0a7f65baf1ccea705ccc27b8226180c0fd0ef15fbbefa3d83
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر،
تولید ویدئو، دریافت وب، جست‌وجوی وب، ابزارهای عامل، یا هر
ترکیبی از این‌ها.

لازم نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install <package-name>` نصب می‌کنند. OpenClaw ابتدا ClawHub را امتحان می‌کند و
برای بسته‌هایی که هنوز از توزیع npm استفاده می‌کنند، خودکار به npm برمی‌گردد.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن clone شده و `pnpm install` انجام شده باشد

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی (Discord، IRC، و غیره) وصل کنید
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل اضافه کنید (LLM، پراکسی، یا نقطه پایانی سفارشی)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، hookهای رویداد، یا سرویس‌ها را ثبت کنید — ادامه را در پایین ببینید
  </Card>
</CardGroup>

برای Plugin کانالی که تضمین نیست هنگام اجرای onboarding/setup نصب شده باشد،
از `createOptionalChannelSetupSurface(...)` از
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این یک جفت آداپتر راه‌اندازی + wizard تولید می‌کند
که نیاز نصب را اعلام می‌کند و تا زمانی که Plugin نصب نشده باشد، در نوشتن پیکربندی واقعی
به‌صورت بسته شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار عامل را ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که در بالا لینک شده‌اند.

<Steps>
  <Step title="Create the package and manifest">
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

    هر Plugin به یک manifest نیاز دارد، حتی بدون پیکربندی، و هر Plugin باید
    `activation.onStartup` را آگاهانه اعلام کند. ابزارهای ثبت‌شده در زمان اجرا به
    import هنگام راه‌اندازی نیاز دارند، پس این مثال آن را روی `true` می‌گذارد. برای طرح‌واره کامل
    [Manifest](/fa/plugins/manifest) را ببینید. قطعه‌های رسمی انتشار ClawHub
    در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="Write the entry point">

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
    برای گزینه‌های کامل نقطه ورود، [نقطه‌های ورود](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="Test and publish">

    **Pluginهای خارجی:** با ClawHub اعتبارسنجی و منتشر کنید، سپس نصب کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw همچنین برای مشخصه‌های بسته بدون پیشوند، مثل
    `@myorg/openclaw-my-plugin`، قبل از npm سراغ ClawHub می‌رود؛ npm برای بسته‌هایی که
    هنوز به ClawHub مهاجرت نکرده‌اند، همچنان fallback است.

    **Pluginهای داخل مخزن:** آن را زیر درخت workspace مربوط به Pluginهای همراه قرار دهید — خودکار کشف می‌شود.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin واحد می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت                | روش ثبت                                          | راهنمای تفصیلی                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استنتاج متن (LLM)      | `api.registerProvider(...)`                      | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)                         |
| backend استنتاج CLI    | `api.registerCliBackend(...)`                    | [backendهای CLI](/fa/gateway/cli-backends)                                         |
| کانال / پیام‌رسانی     | `api.registerChannel(...)`                       | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)                                 |
| گفتار (TTS/STT)        | `api.registerSpeechProvider(...)`                | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بلادرنگ        | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بلادرنگ           | `api.registerRealtimeVoiceProvider(...)`         | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه              | `api.registerMediaUnderstandingProvider(...)`    | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر            | `api.registerImageGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی           | `api.registerMusicGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو            | `api.registerVideoGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| دریافت وب              | `api.registerWebFetchProvider(...)`              | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جست‌وجوی وب            | `api.registerWebSearchProvider(...)`             | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجه ابزار | `api.registerAgentToolResultMiddleware(...)`     | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api)                          |
| ابزارهای عامل          | `api.registerTool(...)`                          | پایین                                                                           |
| دستورهای سفارشی        | `api.registerCommand(...)`                       | [نقطه‌های ورود](/fa/plugins/sdk-entrypoints)                                       |
| hookهای Plugin         | `api.on(...)`                                    | [hookهای Plugin](/fa/plugins/hooks)                                                |
| hookهای رویداد داخلی   | `api.registerHook(...)`                          | [نقطه‌های ورود](/fa/plugins/sdk-entrypoints)                                       |
| مسیرهای HTTP           | `api.registerHttpRoute(...)`                     | [جزئیات داخلی](/fa/plugins/architecture-internals#gateway-http-routes)             |
| زیردستورهای CLI        | `api.registerCli(...)`                           | [نقطه‌های ورود](/fa/plugins/sdk-entrypoints)                                       |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای همراه می‌توانند زمانی از `api.registerAgentToolResultMiddleware(...)` استفاده کنند که
به بازنویسی async نتیجه ابزار پیش از دیدن خروجی توسط مدل نیاز دارند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Plugin همراه است؛ Pluginهای خارجی
باید hookهای معمول OpenClaw Plugin را ترجیح دهند، مگر اینکه OpenClaw
برای این قابلیت یک سیاست اعتماد صریح اضافه کند.

اگر Plugin شما روش‌های RPC سفارشی Gateway را ثبت می‌کند، آن‌ها را روی یک
پیشوند ویژه Plugin نگه دارید. namespaceهای مدیریتی هسته (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin محدوده باریک‌تری بخواهد.

معناشناسی guard hook که باید در نظر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را مکث می‌کند و از کاربر از طریق overlay تأیید exec، دکمه‌های Telegram، تعامل‌های Discord، یا دستور `/approve` روی هر کانال تأیید می‌خواهد.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، فیلد تایپ‌شده `threadId` را ترجیح دهید. `metadata` را برای موارد اضافی ویژه کانال نگه دارید.
- `message_sending`: فیلدهای مسیریابی تایپ‌شده `replyToId` / `threadId` را بر کلیدهای metadata ویژه کانال ترجیح دهید.

دستور `/approve` هم تأییدهای exec و هم تأییدهای Plugin را با fallback محدود مدیریت می‌کند: وقتی شناسه تأیید exec پیدا نشود، OpenClaw همان شناسه را از مسیر تأییدهای Plugin دوباره امتحان می‌کند. forwarding تأیید Plugin را می‌توان مستقل از طریق `approvals.plugin` در پیکربندی تنظیم کرد.

اگر لوله‌کشی تأیید سفارشی باید همان حالت fallback محدود را تشخیص دهد،
به‌جای match کردن دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` را از `openclaw/plugin-sdk/error-runtime`
ترجیح دهید.

برای مثال‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها توابع تایپ‌شده‌ای هستند که LLM می‌تواند فراخوانی کند. آن‌ها می‌توانند required باشند (همیشه
در دسترس) یا optional (با opt-in کاربر):

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

کاربران ابزارهای optional را در پیکربندی فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای هسته تداخل داشته باشد (تداخل‌ها رد می‌شوند)
- ابزارهایی با شیء ثبت نادرست، از جمله نبود `parameters`، به‌جای شکستن اجرای عامل، رد می‌شوند و در diagnostics Plugin گزارش می‌شوند
- برای ابزارهایی با اثر جانبی یا نیازمندی‌های binary اضافی از `optional: true` استفاده کنید
- کاربران می‌توانند همه ابزارهای یک Plugin را با افزودن شناسه Plugin به `tools.allow` فعال کنند

## ثبت دستورهای CLI

Pluginها می‌توانند با `api.registerCli` گروه‌های دستور ریشه `openclaw` اضافه کنند. برای
هر ریشه دستور سطح بالا `descriptors` ارائه کنید تا OpenClaw بتواند دستور را بدون بارگذاری مشتاقانه
runtime هر Plugin نمایش دهد و مسیریابی کند.

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

پس از نصب، ثبت زمان اجرا را تأیید کنید و فرمان را اجرا کنید:

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

برای Pluginهای ارائه‌دهنده، helperهای اختصاصی ارائه‌دهنده را در همان barrelهای ریشه بسته نگه دارید، مگر اینکه seam واقعاً عمومی باشد. نمونه‌های bundled فعلی:

- Anthropic: wrapperهای جریان Claude و helperهای `service_tier` / beta
- OpenAI: سازنده‌های ارائه‌دهنده، helperهای مدل پیش‌فرض، ارائه‌دهنده‌های realtime
- OpenRouter: سازنده ارائه‌دهنده به‌همراه helperهای onboarding/config

اگر یک helper فقط داخل یک بسته ارائه‌دهنده bundled مفید است، آن را به‌جای ارتقا دادن به `openclaw/plugin-sdk/*` روی همان seam ریشه بسته نگه دارید.

برخی seamهای helper تولیدشده `openclaw/plugin-sdk/<bundled-id>` هنوز برای نگهداشت Pluginهای bundled وجود دارند، وقتی usage مالک ردیابی‌شده دارند. با آن‌ها به‌عنوان سطح‌های رزروشده برخورد کنید، نه الگوی پیش‌فرض برای Pluginهای شخص ثالث جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** metadata درست `openclaw` را دارد</Check>
<Check>manifest **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها پاس می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` پاس می‌شود (Pluginهای داخل repo)</Check>

## تست انتشار beta

1. تگ‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` مشترک شوید. تگ‌های beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) را برای اعلام انتشارها روشن کنید.
2. به‌محض ظاهر شدن تگ beta، Plugin خود را با آن تست کنید. بازه قبل از stable معمولاً فقط چند ساعت است.
3. پس از تست، در thread مربوط به Plugin خود در کانال Discord به نام `plugin-forum` با `all good` یا توضیح آنچه خراب شده پست بگذارید. اگر هنوز thread ندارید، یکی بسازید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. لینک issue را در thread خود بگذارید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند PRها را label بزنند، بنابراین عنوان سیگنال سمت PR برای نگه‌دارندگان و automation است. blockerهایی که PR دارند merge می‌شوند؛ blockerهای بدون PR ممکن است با این حال ship شوند. نگه‌دارندگان در طول تست beta این threadها را زیر نظر دارند.
6. سکوت یعنی سبز. اگر این بازه را از دست بدهید، fix شما احتمالاً در چرخه بعدی land می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهنده مدل بسازید
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع API ثبت و نقشه import
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fa/plugins/sdk-testing">
    utilityها و الگوهای تست
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
