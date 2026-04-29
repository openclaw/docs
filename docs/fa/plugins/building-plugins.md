---
read_when:
    - می‌خواهید یک Plugin جدید برای OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعهٔ Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار، یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin خود برای OpenClaw را در چند دقیقه ایجاد کنید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-04-29T23:13:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو، دریافت وب، جست‌وجوی وب، ابزارهای عامل، یا هر ترکیبی از آن‌ها.

نیازی نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install <package-name>` نصب می‌کنند. OpenClaw ابتدا ClawHub را امتحان می‌کند و برای بسته‌هایی که هنوز از توزیع npm استفاده می‌کنند، به‌طور خودکار به npm برمی‌گردد.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن clone شده و `pnpm install` انجام شده باشد

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی وصل کنید (Discord، IRC، و غیره)
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل اضافه کنید (LLM، پراکسی، یا endpoint سفارشی)
  </Card>
  <Card title="Plugin ابزار / hook" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، hookهای رویداد، یا سرویس‌ها را ثبت کنید — ادامه را در پایین ببینید
  </Card>
</CardGroup>

برای Plugin کانالی که تضمین نمی‌شود هنگام اجرای onboarding/setup نصب شده باشد، از
`createOptionalChannelSetupSurface(...)` از
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این یک جفت آداپتر setup + wizard تولید می‌کند
که نیاز نصب را اعلام می‌کند و تا وقتی Plugin نصب نشده باشد، در نوشتن پیکربندی واقعی به‌صورت بسته شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار عامل ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که در بالا لینک شده‌اند.

<Steps>
  <Step title="بسته و manifest را ایجاد کنید">
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
    `activation.onStartup` را آگاهانه اعلام کند. ابزارهایی که در زمان اجرا ثبت می‌شوند به
    import در startup نیاز دارند، بنابراین این مثال آن را روی `true` تنظیم می‌کند. برای schema کامل، [Manifest](/fa/plugins/manifest) را ببینید. snippetهای استاندارد انتشار ClawHub
    در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="نقطه ورود را بنویسید">

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
    برای همه گزینه‌های نقطه ورود، [نقاط ورود](/fa/plugins/sdk-entrypoints) را ببینید.

  </Step>

  <Step title="آزمایش و انتشار">

    **Pluginهای خارجی:** با ClawHub اعتبارسنجی و منتشر کنید، سپس نصب کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw همچنین برای مشخصات بسته خام مثل
    `@myorg/openclaw-my-plugin` قبل از npm، ClawHub را بررسی می‌کند؛ npm همچنان برای بسته‌هایی که
    هنوز به ClawHub مهاجرت نکرده‌اند fallback باقی می‌ماند.

    **Pluginهای داخل مخزن:** آن‌ها را زیر درخت workspace مربوط به Pluginهای همراه قرار دهید — به‌طور خودکار کشف می‌شوند.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت | روش ثبت | راهنمای تفصیلی |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استنتاج متن (LLM) | `api.registerProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) |
| backend استنتاج CLI | `api.registerCliBackend(...)` | [Backendهای CLI](/fa/gateway/cli-backends) |
| کانال / پیام‌رسانی | `api.registerChannel(...)` | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) |
| گفتار (TTS/STT) | `api.registerSpeechProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بلادرنگ | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بلادرنگ | `api.registerRealtimeVoiceProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه | `api.registerMediaUnderstandingProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر | `api.registerImageGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی | `api.registerMusicGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو | `api.registerVideoGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| دریافت وب | `api.registerWebFetchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جست‌وجوی وب | `api.registerWebSearchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجه ابزار | `api.registerAgentToolResultMiddleware(...)` | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) |
| ابزارهای عامل | `api.registerTool(...)` | پایین |
| فرمان‌های سفارشی | `api.registerCommand(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |
| hookهای Plugin | `api.on(...)` | [hookهای Plugin](/fa/plugins/hooks) |
| hookهای رویداد داخلی | `api.registerHook(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |
| routeهای HTTP | `api.registerHttpRoute(...)` | [جزئیات داخلی](/fa/plugins/architecture-internals#gateway-http-routes) |
| زیر‌فرمان‌های CLI | `api.registerCli(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای همراه وقتی به بازنویسی ناهمگام نتیجه ابزار پیش از دیده‌شدن خروجی توسط مدل نیاز دارند، می‌توانند از `api.registerAgentToolResultMiddleware(...)` استفاده کنند. runtimeهای هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Pluginهای همراه است؛ Pluginهای خارجی
باید hookهای عادی Plugin در OpenClaw را ترجیح دهند، مگر اینکه OpenClaw برای این قابلیت
یک سیاست اعتماد صریح اضافه کند.

اگر Plugin شما متدهای RPC سفارشی Gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند
ویژه Plugin نگه دارید. namespaceهای مدیریتی core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری درخواست کند.

معناشناسی guard hook که باید در نظر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را متوقف می‌کند و از طریق overlay تأیید exec، دکمه‌های Telegram، تعاملات Discord، یا فرمان `/approve` در هر کانال، از کاربر درخواست تأیید می‌کند.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_received`: وقتی به routing thread/topic ورودی نیاز دارید، فیلد typed `threadId` را ترجیح دهید. `metadata` را برای موارد اضافه ویژه کانال نگه دارید.
- `message_sending`: فیلدهای typed مسیریابی `replyToId` / `threadId` را به کلیدهای metadata ویژه کانال ترجیح دهید.

فرمان `/approve` هم تأییدهای exec و هم تأییدهای Plugin را با fallback محدود مدیریت می‌کند: وقتی شناسه تأیید exec پیدا نشود، OpenClaw همان شناسه را از مسیر تأییدهای Plugin دوباره امتحان می‌کند. forwarding تأیید Plugin می‌تواند مستقل از طریق `approvals.plugin` در پیکربندی تنظیم شود.

اگر plumbing سفارشی تأیید نیاز دارد همان مورد fallback محدود را تشخیص دهد،
به‌جای match کردن دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` را از `openclaw/plugin-sdk/error-runtime`
ترجیح دهید.

برای مثال‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها توابع typed هستند که LLM می‌تواند آن‌ها را فراخوانی کند. آن‌ها می‌توانند required (همیشه
در دسترس) یا optional (با opt-in کاربر) باشند:

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

- نام ابزارها نباید با ابزارهای core تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی با شیء ثبت malformed، از جمله نبود `parameters`، به‌جای خراب‌کردن اجرای عامل، نادیده گرفته می‌شوند و در diagnostics Plugin گزارش می‌شوند
- برای ابزارهایی با اثرات جانبی یا نیازمندی‌های binary اضافه، از `optional: true` استفاده کنید
- کاربران می‌توانند با افزودن شناسه Plugin به `tools.allow` همه ابزارهای یک Plugin را فعال کنند

## قراردادهای import

همیشه از مسیرهای متمرکز `openclaw/plugin-sdk/<subpath>` import کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

برای مرجع کامل زیرمسیرها، [نمای کلی SDK](/fa/plugins/sdk-overview) را ببینید.

در Plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید — هرگز Plugin خودتان را از مسیر SDK آن import نکنید.

برای Pluginهای ارائه‌دهنده، کمک‌کننده‌های مخصوص ارائه‌دهنده را در همان barrelهای ریشهٔ بسته نگه دارید، مگر اینکه مرز واقعاً عمومی باشد. نمونه‌های بسته‌بندی‌شدهٔ فعلی:

- Anthropic: پوشش‌دهنده‌های جریان Claude و کمک‌کننده‌های `service_tier` / بتا
- OpenAI: سازنده‌های ارائه‌دهنده، کمک‌کننده‌های مدل پیش‌فرض، ارائه‌دهنده‌های بی‌درنگ
- OpenRouter: سازندهٔ ارائه‌دهنده به‌همراه کمک‌کننده‌های راه‌اندازی/پیکربندی

اگر یک کمک‌کننده فقط داخل یک بستهٔ ارائه‌دهندهٔ بسته‌بندی‌شده کاربرد دارد، آن را به‌جای ارتقا به `openclaw/plugin-sdk/*` روی همان مرز ریشهٔ بسته نگه دارید.

برخی مرزهای کمک‌کنندهٔ تولیدشدهٔ `openclaw/plugin-sdk/<bundled-id>` هنوز برای نگه‌داری Pluginهای بسته‌بندی‌شده، وقتی استفادهٔ مالک ردیابی‌شده دارند، وجود دارند. با آن‌ها به‌عنوان سطح‌های رزروشده برخورد کنید، نه الگوی پیش‌فرض برای Pluginهای شخص ثالث جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** فرادادهٔ درست `openclaw` را دارد</Check>
<Check>مانیفست **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطهٔ ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همهٔ importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها پاس می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` پاس می‌شود (Pluginهای داخل مخزن)</Check>

## تست انتشار بتا

1. تگ‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از طریق `Watch` > `Releases` مشترک شوید. تگ‌های بتا شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) را برای اعلامیه‌های انتشار فعال کنید.
2. به‌محض ظاهر شدن تگ بتا، Plugin خود را در برابر آن تست کنید. بازهٔ زمانی پیش از نسخهٔ پایدار معمولاً فقط چند ساعت است.
3. پس از تست، در رشتهٔ Plugin خود در کانال Discord با نام `plugin-forum` با یکی از دو حالت `all good` یا توضیح اینکه چه چیزی خراب شده است، پست بگذارید. اگر هنوز رشته‌ای ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و برچسب `beta-blocker` را اعمال کنید. پیوند issue را در رشتهٔ خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در رشتهٔ Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند به PRها برچسب بزنند، بنابراین عنوان، سیگنال سمت PR برای نگه‌دارندگان و خودکارسازی است. مسدودکننده‌هایی که PR دارند merge می‌شوند؛ مسدودکننده‌های بدون PR ممکن است با این حال منتشر شوند. نگه‌دارندگان در طول تست بتا این رشته‌ها را دنبال می‌کنند.
6. سکوت یعنی وضعیت سبز است. اگر این بازه را از دست بدهید، اصلاح شما احتمالاً در چرخهٔ بعدی وارد می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    ساخت یک Plugin کانال پیام‌رسانی
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    ساخت یک Plugin ارائه‌دهندهٔ مدل
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای تست
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل اسکیمای مانیفست
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — بررسی عمیق معماری داخلی
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع SDK مربوط به Plugin
- [مانیفست](/fa/plugins/manifest) — قالب مانیفست Plugin
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — ساخت Pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) — ساخت Pluginهای ارائه‌دهنده
