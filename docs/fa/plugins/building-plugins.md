---
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعه Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار، یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: نخستین Plugin خود برای OpenClaw را در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-07T13:26:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو، دریافت وب، جستجوی وب، ابزارهای عامل، یا هر ترکیبی از آن‌ها.

لازم نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install clawhub:<package-name>` نصب می‌کنند. مشخصات بستهٔ ساده همچنان
در دورهٔ گذار راه‌اندازی از npm نصب می‌شوند.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن کلون شده و `pnpm install` انجام شده باشد. توسعهٔ Plugin با
  checkout منبع فقط با pnpm است، چون OpenClaw، Pluginهای همراه را از بسته‌های workspace
  در `extensions/*` بارگذاری می‌کند.

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی وصل کنید (Discord، IRC و غیره)
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهندهٔ مدل اضافه کنید (LLM، پراکسی، یا endpoint سفارشی)
  </Card>
  <Card title="Plugin بک‌اند CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک CLI هوش مصنوعی محلی را به اجراکنندهٔ fallback متنی OpenClaw نگاشت کنید
  </Card>
  <Card title="Plugin ابزار / hook" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، hookهای رویداد، یا سرویس‌ها را ثبت کنید - در ادامه بخوانید
  </Card>
</CardGroup>

برای Plugin کانالی که تضمین نشده هنگام اجرای onboarding/setup نصب شده باشد، از
`createOptionalChannelSetupSurface(...)` در
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این تابع یک جفت آداپتور راه‌اندازی + wizard
می‌سازد که نیازمندی نصب را اعلام می‌کند و تا وقتی Plugin نصب نشده باشد، روی نوشتن پیکربندی واقعی
بسته و ایمن شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار عامل را ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که در بالا پیوند داده شده‌اند.

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

    هر Plugin به یک manifest نیاز دارد، حتی بدون پیکربندی. ابزارهایی که در زمان اجرا ثبت می‌شوند
    باید در `contracts.tools` فهرست شوند تا OpenClaw بتواند Plugin مالک را بدون بارگذاری runtime
    همهٔ Pluginها کشف کند. Pluginها همچنین باید `activation.onStartup` را آگاهانه اعلام کنند. این مثال آن را روی `true` می‌گذارد. برای schema کامل، [Manifest](/fa/plugins/manifest) را ببینید. قطعه‌کدهای رسمی انتشار ClawHub
    در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="نقطهٔ ورود را بنویسید">

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
    `defineChannelPluginEntry` استفاده کنید - [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
    برای گزینه‌های کامل نقطهٔ ورود، [نقاط ورود](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="آزمایش و انتشار">

    **Pluginهای خارجی:** با ClawHub اعتبارسنجی و منتشر کنید، سپس نصب کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    مشخصات بستهٔ ساده مثل `@myorg/openclaw-my-plugin` در دورهٔ گذار راه‌اندازی از npm نصب می‌شوند.
    وقتی resolution با ClawHub را می‌خواهید، از `clawhub:` استفاده کنید.

    **Pluginهای داخل مخزن:** زیر درخت workspace مربوط به Pluginهای همراه قرار دهید - به‌طور خودکار کشف می‌شود.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin واحد می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت                 | روش ثبت                                          | راهنمای تفصیلی                                                                    |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| استنتاج متن (LLM)      | `api.registerProvider(...)`                      | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)                            |
| بک‌اند استنتاج CLI     | `api.registerCliBackend(...)`                    | [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins)                              |
| کانال / پیام‌رسانی     | `api.registerChannel(...)`                       | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)                                   |
| گفتار (TTS/STT)        | `api.registerSpeechProvider(...)`                | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بلادرنگ        | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بلادرنگ           | `api.registerRealtimeVoiceProvider(...)`         | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه              | `api.registerMediaUnderstandingProvider(...)`    | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر            | `api.registerImageGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی           | `api.registerMusicGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو            | `api.registerVideoGenerationProvider(...)`       | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| دریافت وب              | `api.registerWebFetchProvider(...)`              | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جستجوی وب              | `api.registerWebSearchProvider(...)`             | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجهٔ ابزار | `api.registerAgentToolResultMiddleware(...)`     | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api)                            |
| ابزارهای عامل          | `api.registerTool(...)`                          | در ادامه                                                                          |
| فرمان‌های سفارشی       | `api.registerCommand(...)`                       | [نقاط ورود](/fa/plugins/sdk-entrypoints)                                             |
| hookهای Plugin         | `api.on(...)`                                    | [hookهای Plugin](/fa/plugins/hooks)                                                  |
| hookهای رویداد داخلی   | `api.registerHook(...)`                          | [نقاط ورود](/fa/plugins/sdk-entrypoints)                                             |
| مسیرهای HTTP           | `api.registerHttpRoute(...)`                     | [داخلی‌ها](/fa/plugins/architecture-internals#gateway-http-routes)                  |
| زیرفرمان‌های CLI       | `api.registerCli(...)`                           | [نقاط ورود](/fa/plugins/sdk-entrypoints)                                             |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای همراه می‌توانند از `api.registerAgentToolResultMiddleware(...)` استفاده کنند وقتی
به بازنویسی ناهمگام نتیجهٔ ابزار، پیش از آنکه مدل خروجی را ببیند، نیاز دارند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Plugin همراه است؛ Pluginهای خارجی
باید hookهای معمول OpenClaw Plugin را ترجیح دهند، مگر اینکه OpenClaw یک سیاست اعتماد
صریح برای این قابلیت اضافه کند.

اگر Plugin شما روش‌های RPC سفارشی Gateway ثبت می‌کند، آن‌ها را زیر یک پیشوند
مختص Plugin نگه دارید. namespaceهای مدیریتی هسته (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری بخواهد.

معناشناسی guard در hook که باید در نظر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را مکث می‌کند و از کاربر از طریق overlay تأیید exec، دکمه‌های Telegram، تعاملات Discord، یا فرمان `/approve` روی هر کانال، درخواست تأیید می‌کند.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم تلقی می‌شود.
- `message_received`: وقتی به مسیریابی thread/topic ورودی نیاز دارید، فیلد typed `threadId` را ترجیح دهید. `metadata` را برای موارد اضافهٔ مختص کانال نگه دارید.
- `message_sending`: فیلدهای مسیریابی typed `replyToId` / `threadId` را به کلیدهای metadata مختص کانال ترجیح دهید.

فرمان `/approve` هم تأییدهای exec و هم تأییدهای Plugin را با fallback محدود مدیریت می‌کند: وقتی شناسهٔ تأیید exec پیدا نشود، OpenClaw همان شناسه را در تأییدهای Plugin دوباره امتحان می‌کند. forward کردن تأیید Plugin می‌تواند به‌طور مستقل از طریق `approvals.plugin` در پیکربندی تنظیم شود.

اگر لوله‌کشی تأیید سفارشی نیاز دارد همان حالت fallback محدود را تشخیص دهد،
به‌جای تطبیق دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` را از
`openclaw/plugin-sdk/error-runtime` ترجیح دهید.

برای نمونه‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها توابع typed هستند که LLM می‌تواند فراخوانی کند. آن‌ها می‌توانند اجباری (همیشه
در دسترس) یا اختیاری (با opt-in کاربر) باشند:

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

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود باید در manifest مربوط به
Plugin نیز اعلام شود:

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

OpenClaw توصیفگر اعتبارسنجی‌شده را از ابزار ثبت‌شده ضبط و کش می‌کند،
بنابراین Pluginها داده‌های `description` یا schema را در manifest تکرار نمی‌کنند. قرارداد
manifest فقط مالکیت و کشف را اعلام می‌کند؛ اجرا همچنان پیاده‌سازی زنده ابزار ثبت‌شده را
فراخوانی می‌کند.
برای ابزارهایی که با
`api.registerTool(..., { optional: true })` ثبت شده‌اند، مقدار `toolMetadata.<tool>.optional: true` را تنظیم کنید تا OpenClaw بتواند از بارگذاری
runtime آن Plugin تا زمانی که ابزار صراحتاً در فهرست مجاز قرار نگرفته است، خودداری کند.

کاربران ابزارهای اختیاری را در config فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای core تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی با شیءهای ثبت‌نام بدشکل، از جمله مواردی که `parameters` ندارند، به‌جای خراب کردن اجرای agent، نادیده گرفته می‌شوند و در diagnostics مربوط به Plugin گزارش می‌شوند
- برای ابزارهایی با اثرات جانبی یا نیازمندی‌های binary اضافی، از `optional: true` استفاده کنید
- کاربران می‌توانند با افزودن id مربوط به Plugin به `tools.allow` همه ابزارهای یک Plugin را فعال کنند

## ثبت فرمان‌های CLI

Pluginها می‌توانند با `api.registerCli` گروه‌های فرمان ریشه `openclaw` اضافه کنند. برای
هر ریشه فرمان سطح بالا `descriptors` ارائه کنید تا OpenClaw بتواند فرمان را بدون بارگذاری
مشتاقانه runtime هر Plugin نمایش دهد و مسیریابی کند.

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

پس از نصب، ثبت runtime را بررسی و فرمان را اجرا کنید:

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

برای مرجع کامل subpath، [نمای کلی SDK](/fa/plugins/sdk-overview) را ببینید.

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید - هرگز Plugin خودتان را از طریق مسیر SDK آن import نکنید.

برای Provider Pluginها، helperهای ویژه provider را در همان barrelهای ریشه package نگه دارید، مگر اینکه seam واقعاً generic باشد. نمونه‌های bundled فعلی:

- Anthropic: wrapperهای stream مربوط به Claude و helperهای `service_tier` / beta
- OpenAI: سازنده‌های provider، helperهای مدل پیش‌فرض، providerهای realtime
- OpenRouter: سازنده provider به‌همراه helperهای onboarding/config

اگر یک helper فقط داخل یک package مربوط به bundled provider مفید است، به‌جای ارتقای آن به `openclaw/plugin-sdk/*`، آن را روی seam ریشه package نگه دارید.

برخی seamهای helper تولیدشده `openclaw/plugin-sdk/<bundled-id>` همچنان برای نگهداری bundled-plugin وجود دارند، وقتی که usage مالک ردیابی‌شده دارند. با آن‌ها به‌عنوان سطح‌های رزرو‌شده برخورد کنید، نه الگوی پیش‌فرض برای Pluginهای third-party جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** دارای metadata صحیح `openclaw` است</Check>
<Check>manifest **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>entry point از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه SDK self-import</Check>
<Check>تست‌ها پاس می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` پاس می‌شود (Pluginهای درون repo)</Check>

## تست انتشار beta

1. برچسب‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` مشترک شوید. برچسب‌های beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌ها را برای حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) برای اعلامیه‌های انتشار فعال کنید.
2. به‌محض ظاهر شدن برچسب beta، Plugin خود را در برابر آن تست کنید. بازه قبل از stable معمولاً فقط چند ساعت است.
3. پس از تست، در thread مربوط به Plugin خود در کانال Discord با نام `plugin-forum` با `all good` یا شرح مورد خراب‌شده پست بگذارید. اگر هنوز thread ندارید، یکی بسازید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. لینک issue را در thread خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند PRها را label کنند، بنابراین عنوان، سیگنال سمت PR برای maintainerها و automation است. Blockerهایی که PR دارند merge می‌شوند؛ blockerهای بدون PR ممکن است با این حال ship شوند. Maintainerها این threadها را در طول تست beta دنبال می‌کنند.
6. سکوت یعنی سبز بودن وضعیت. اگر این بازه را از دست بدهید، fix شما احتمالاً در چرخه بعدی land می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک messaging channel Plugin بسازید
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک model provider Plugin بسازید
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک backend محلی CLI برای AI ثبت کنید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت‌نام
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="تست" icon="test-tubes" href="/fa/plugins/sdk-testing">
    utilityها و الگوهای تست
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema مربوط به manifest
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) - بررسی عمیق معماری داخلی
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع SDK مربوط به Plugin
- [Manifest](/fa/plugins/manifest) - قالب manifest مربوط به Plugin
- [Channel Plugins](/fa/plugins/sdk-channel-plugins) - ساخت channel Pluginها
- [Provider Plugins](/fa/plugins/sdk-provider-plugins) - ساخت provider Pluginها
