---
read_when:
    - می‌خواهید یک Plugin جدید برای OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعهٔ Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin خود را در OpenClaw در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-02T11:53:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ، درک رسانه، تولید تصویر،
تولید ویدئو، واکشی وب، جست‌وجوی وب، ابزارهای عامل، یا هر
ترکیبی از آن‌ها.

لازم نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install <package-name>` نصب می‌کنند. OpenClaw ابتدا ClawHub را امتحان می‌کند و
برای بسته‌هایی که هنوز از توزیع npm استفاده می‌کنند، به‌طور خودکار به npm بازمی‌گردد.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای درون مخزن: مخزن کلون شده و `pnpm install` انجام شده باشد. توسعه Plugin با
  checkout منبع فقط با pnpm انجام می‌شود، چون OpenClaw Pluginهای بسته‌بندی‌شده را
  از بسته‌های workspace در `extensions/*` بارگذاری می‌کند.

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی (Discord، IRC و غیره) متصل کنید
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل اضافه کنید (LLM، پراکسی، یا endpoint سفارشی)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، hookهای رویداد، یا سرویس‌ها را ثبت کنید — در ادامه دنبال کنید
  </Card>
</CardGroup>

برای Plugin کانالی که تضمینی نیست هنگام اجرای onboarding/setup نصب شده باشد،
از `createOptionalChannelSetupSurface(...)` از
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این یک جفت adapter راه‌اندازی + wizard
می‌سازد که الزام نصب را اعلام می‌کند و تا زمان نصب Plugin، روی نوشتن‌های واقعی config
به‌شکل بسته شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin کمینه می‌سازد که یک ابزار عامل ثبت می‌کند. Pluginهای کانال
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

    هر Plugin به یک manifest نیاز دارد، حتی بدون config. ابزارهایی که در زمان اجرا ثبت می‌شوند
    باید در `contracts.tools` فهرست شوند تا OpenClaw بتواند Plugin مالک را
    بدون بارگذاری runtime همه Pluginها کشف کند. Pluginها همچنین باید
    `activation.onStartup` را آگاهانه اعلام کنند. این مثال آن را روی `true` می‌گذارد. برای
    schema کامل، [Manifest](/fa/plugins/manifest) را ببینید. snippetهای canonical انتشار ClawHub
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
    برای گزینه‌های کامل entry point، [Entry Points](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="Test and publish">

    **Pluginهای خارجی:** با ClawHub اعتبارسنجی و منتشر کنید، سپس نصب کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw برای specهای بسته ساده مانند
    `@myorg/openclaw-my-plugin` نیز پیش از npm، ClawHub را بررسی می‌کند؛ npm برای بسته‌هایی که
    هنوز به ClawHub مهاجرت نکرده‌اند، همچنان fallback باقی می‌ماند.

    **Pluginهای درون مخزن:** زیر درخت workspace Pluginهای بسته‌بندی‌شده قرار دهید — به‌طور خودکار کشف می‌شود.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin واحد می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت                 | روش ثبت                                          | راهنمای تفصیلی                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استنتاج متن (LLM)      | `api.registerProvider(...)`                      | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)                          |
| backend استنتاج CLI    | `api.registerCliBackend(...)`                    | [Backendهای CLI](/fa/gateway/cli-backends)                                         |
| کانال / پیام‌رسانی     | `api.registerChannel(...)`                       | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)                                 |
| گفتار (TTS/STT)        | `api.registerSpeechProvider(...)`                | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بی‌درنگ        | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بی‌درنگ           | `api.registerRealtimeVoiceProvider(...)`         | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه              | `api.registerMediaUnderstandingProvider(...)`    | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر            | `api.registerImageGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی           | `api.registerMusicGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو            | `api.registerVideoGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| واکشی وب               | `api.registerWebFetchProvider(...)`              | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جست‌وجوی وب            | `api.registerWebSearchProvider(...)`             | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجه ابزار | `api.registerAgentToolResultMiddleware(...)`     | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api)                          |
| ابزارهای عامل          | `api.registerTool(...)`                          | در ادامه                                                                        |
| دستورهای سفارشی        | `api.registerCommand(...)`                       | [Entry Points](/fa/plugins/sdk-entrypoints)                                        |
| hookهای Plugin         | `api.on(...)`                                    | [hookهای Plugin](/fa/plugins/hooks)                                                |
| hookهای رویداد داخلی   | `api.registerHook(...)`                          | [Entry Points](/fa/plugins/sdk-entrypoints)                                        |
| مسیرهای HTTP           | `api.registerHttpRoute(...)`                     | [داخلی‌ها](/fa/plugins/architecture-internals#gateway-http-routes)                 |
| زیرفرمان‌های CLI       | `api.registerCli(...)`                           | [Entry Points](/fa/plugins/sdk-entrypoints)                                        |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای بسته‌بندی‌شده می‌توانند از `api.registerAgentToolResultMiddleware(...)` استفاده کنند وقتی
به بازنویسی async نتیجه ابزار پیش از دیدن خروجی توسط مدل نیاز دارند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Plugin بسته‌بندی‌شده است؛ Pluginهای خارجی
باید hookهای عادی Plugin در OpenClaw را ترجیح دهند، مگر اینکه OpenClaw یک
سیاست اعتماد صریح برای این قابلیت اضافه کند.

اگر Plugin شما methodهای سفارشی gateway RPC ثبت می‌کند، آن‌ها را روی یک
پیشوند مختص Plugin نگه دارید. namespaceهای core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محفوظ می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری بخواهد.

معناشناسی guard hookها که باید در نظر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را مکث می‌کند و از کاربر از طریق overlay تأیید exec، دکمه‌های Telegram، تعامل‌های Discord، یا دستور `/approve` روی هر کانال، تأیید می‌خواهد.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، فیلد typed `threadId` را ترجیح دهید. `metadata` را برای جزئیات اضافه مختص کانال نگه دارید.
- `message_sending`: فیلدهای مسیریابی typed `replyToId` / `threadId` را به کلیدهای metadata مختص کانال ترجیح دهید.

دستور `/approve` هم تأییدهای exec و هم Plugin را با fallback محدود مدیریت می‌کند: وقتی شناسه تأیید exec پیدا نشود، OpenClaw همان شناسه را از طریق تأییدهای Plugin دوباره امتحان می‌کند. forwarding تأیید Plugin را می‌توان مستقل از طریق `approvals.plugin` در config پیکربندی کرد.

اگر plumbing سفارشی تأیید لازم دارد همان حالت fallback محدود را تشخیص دهد،
به‌جای match کردن دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` را از `openclaw/plugin-sdk/error-runtime`
ترجیح دهید.

برای مثال‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها توابع typed هستند که LLM می‌تواند فراخوانی کند. آن‌ها می‌توانند الزامی (همیشه
در دسترس) یا اختیاری (با opt-in کاربر) باشند:

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

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود، باید در manifest
Plugin نیز اعلام شود:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

کاربران ابزارهای اختیاری را در config فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای هسته تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی با شیءهای ثبت نامعتبر، از جمله نبود `parameters`، نادیده گرفته می‌شوند و به‌جای خراب کردن اجرای عامل، در تشخیص‌های Plugin گزارش می‌شوند
- برای ابزارهایی با عوارض جانبی یا نیازمندی‌های باینری اضافی از `optional: true` استفاده کنید
- کاربران می‌توانند همه‌ی ابزارهای یک Plugin را با افزودن شناسه‌ی Plugin به `tools.allow` فعال کنند

## ثبت فرمان‌های CLI

Pluginها می‌توانند با `api.registerCli` گروه‌های فرمان ریشه‌ی `openclaw` اضافه کنند. برای هر ریشه‌ی فرمان سطح‌بالا `descriptors` ارائه دهید تا OpenClaw بتواند فرمان را بدون بارگذاری مشتاقانه‌ی همه‌ی runtimeهای Plugin نمایش دهد و مسیریابی کند.

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

پس از نصب، ثبت runtime را تأیید کنید و فرمان را اجرا کنید:

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

برای مرجع کامل subpathها، [مرور کلی SDK](/fa/plugins/sdk-overview) را ببینید.

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید — هرگز Plugin خودتان را از مسیر SDK آن import نکنید.

برای Pluginهای provider، helperهای ویژه‌ی provider را در همان barrelهای ریشه‌ی package نگه دارید، مگر اینکه مرز واقعاً عمومی باشد. نمونه‌های bundled فعلی:

- Anthropic: پوشاننده‌های stream کلود و helperهای `service_tier` / beta
- OpenAI: سازنده‌های provider، helperهای مدل پیش‌فرض، providerهای realtime
- OpenRouter: سازنده‌ی provider به‌همراه helperهای onboarding/config

اگر یک helper فقط درون یک package provider bundled مفید است، آن را به‌جای ارتقا دادن به `openclaw/plugin-sdk/*` روی همان مرز ریشه‌ی package نگه دارید.

برخی مرزهای helper تولیدشده‌ی `openclaw/plugin-sdk/<bundled-id>` هنوز برای نگهداشت Pluginهای bundled وجود دارند، وقتی که استفاده‌ی مالک را ردیابی کرده‌اند. با این‌ها به‌عنوان سطوح رزرو‌شده برخورد کنید، نه الگوی پیش‌فرض برای Pluginهای شخص ثالث جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** فراداده‌ی درست `openclaw` را دارد</Check>
<Check>مانیفست **openclaw.plugin.json** حاضر و معتبر است</Check>
<Check>نقطه‌ی ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه‌ی importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها پاس می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` پاس می‌شود (برای Pluginهای درون repo)</Check>

## آزمایش انتشار Beta

1. tagهای انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` مشترک شوید. tagهای Beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) را برای اعلام انتشارها فعال کنید.
2. به‌محض اینکه tag Beta ظاهر شد، Plugin خود را در برابر آن آزمایش کنید. بازه‌ی زمانی پیش از stable معمولاً فقط چند ساعت است.
3. پس از آزمایش، در thread مربوط به Plugin خود در کانال Discord با نام `plugin-forum` یکی از دو مورد `all good` یا مورد خراب‌شده را پست کنید. اگر هنوز thread ندارید، یکی بسازید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. لینک issue را در thread خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند به PRها label بزنند، بنابراین عنوان، سیگنال سمت PR برای نگه‌دارندگان و خودکارسازی است. blockerهایی که PR دارند merge می‌شوند؛ blockerهای بدون PR ممکن است با وجود آن منتشر شوند. نگه‌دارندگان این threadها را در طول آزمایش Beta دنبال می‌کنند.
6. سکوت یعنی سبز است. اگر این بازه را از دست بدهید، fix شما احتمالاً در چرخه‌ی بعدی قرار می‌گیرد.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Pluginهای Provider" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin provider مدل بسازید
  </Card>
  <Card title="مرور کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت
  </Card>
  <Card title="Helperهای Runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="آزمایش" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای تست
  </Card>
  <Card title="مانیفست Plugin" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema مانیفست
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — بررسی عمیق معماری داخلی
- [مرور کلی SDK](/fa/plugins/sdk-overview) — مرجع SDK Plugin
- [مانیفست](/fa/plugins/manifest) — قالب مانیفست Plugin
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — ساخت Pluginهای کانال
- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) — ساخت Pluginهای provider
