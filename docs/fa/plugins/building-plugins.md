---
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw ایجاد کنید
    - به یک راهنمای شروع سریع برای توسعه Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin خود برای OpenClaw را در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-06T09:32:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر،
تولید ویدئو، دریافت وب، جستجوی وب، ابزارهای عامل، یا هر
ترکیبی از آن‌ها.

نیازی نیست Plugin خود را به مخزن OpenClaw اضافه کنید. در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install clawhub:<package-name>` نصب می‌کنند. مشخصات بستهٔ خام همچنان
در دورهٔ گذار راه‌اندازی از npm نصب می‌شوند.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن clone شده باشد و `pnpm install` انجام شده باشد. توسعهٔ Plugin
  از checkout منبع فقط با pnpm انجام می‌شود، چون OpenClaw Pluginهای باندل‌شده را
  از بسته‌های فضای کاری `extensions/*` بارگذاری می‌کند.

## چه نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک پلتفرم پیام‌رسانی (Discord، IRC، و غیره) متصل کنید
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهندهٔ مدل اضافه کنید (LLM، پراکسی، یا endpoint سفارشی)
  </Card>
  <Card title="Plugin ابزار / هوک" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای عامل، هوک‌های رویداد، یا سرویس‌ها را ثبت کنید - در ادامه دنبال کنید
  </Card>
</CardGroup>

برای Plugin کانالی که تضمین نمی‌شود هنگام اجرای ورود اولیه/راه‌اندازی
نصب شده باشد، از `createOptionalChannelSetupSurface(...)` از
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این یک جفت adapter راه‌اندازی + wizard
تولید می‌کند که نیازمندی نصب را اعلام می‌کند و تا زمانی که Plugin نصب نشده باشد،
در نوشتن پیکربندی واقعی به‌صورت بسته شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار عامل را ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که در بالا پیوند شده‌اند.

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

    هر Plugin به یک manifest نیاز دارد، حتی بدون پیکربندی. ابزارهایی که در زمان اجرا
    ثبت می‌شوند باید در `contracts.tools` فهرست شوند تا OpenClaw بتواند Plugin مالک را
    بدون بارگذاری runtime هر Plugin کشف کند. Pluginها همچنین باید
    `activation.onStartup` را آگاهانه اعلام کنند. این نمونه آن را روی `true` تنظیم می‌کند. برای
    schema کامل، [Manifest](/fa/plugins/manifest) را ببینید. snippetهای canonical انتشار ClawHub
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

    مشخصات بستهٔ خام مانند `@myorg/openclaw-my-plugin` در دورهٔ گذار راه‌اندازی از npm نصب می‌شوند.
    وقتی resolution از ClawHub می‌خواهید، از `clawhub:` استفاده کنید.

    **Pluginهای داخل مخزن:** زیر درخت فضای کاری Plugin باندل‌شده قرار دهید - به‌صورت خودکار کشف می‌شود.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قابلیت‌های Plugin

یک Plugin واحد می‌تواند هر تعداد قابلیت را از طریق شیء `api` ثبت کند:

| قابلیت | روش ثبت | راهنمای تفصیلی |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استنتاج متن (LLM) | `api.registerProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) |
| backend استنتاج CLI | `api.registerCliBackend(...)` | [backendهای CLI](/fa/gateway/cli-backends) |
| کانال / پیام‌رسانی | `api.registerChannel(...)` | [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) |
| گفتار (TTS/STT) | `api.registerSpeechProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| رونویسی بلادرنگ | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صدای بلادرنگ | `api.registerRealtimeVoiceProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| درک رسانه | `api.registerMediaUnderstandingProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید تصویر | `api.registerImageGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید موسیقی | `api.registerMusicGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| تولید ویدئو | `api.registerVideoGenerationProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| دریافت وب | `api.registerWebFetchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جستجوی وب | `api.registerWebSearchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجهٔ ابزار | `api.registerAgentToolResultMiddleware(...)` | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) |
| ابزارهای عامل | `api.registerTool(...)` | در ادامه |
| فرمان‌های سفارشی | `api.registerCommand(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |
| هوک‌های Plugin | `api.on(...)` | [هوک‌های Plugin](/fa/plugins/hooks) |
| هوک‌های رویداد داخلی | `api.registerHook(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |
| routeهای HTTP | `api.registerHttpRoute(...)` | [جزئیات داخلی](/fa/plugins/architecture-internals#gateway-http-routes) |
| زیر‌فرمان‌های CLI | `api.registerCli(...)` | [نقاط ورود](/fa/plugins/sdk-entrypoints) |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای باندل‌شده می‌توانند وقتی به بازنویسی async نتیجهٔ ابزار پیش از دیده‌شدن خروجی
توسط مدل نیاز دارند، از `api.registerAgentToolResultMiddleware(...)` استفاده کنند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Plugin باندل‌شده است؛ Pluginهای خارجی
باید هوک‌های معمول OpenClaw Plugin را ترجیح دهند، مگر اینکه OpenClaw برای این قابلیت
یک سیاست اعتماد صریح اضافه کند.

اگر Plugin شما متدهای RPC سفارشی Gateway را ثبت می‌کند، آن‌ها را روی یک پیشوند
مختص Plugin نگه دارید. namespaceهای مدیریتی core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری درخواست کند.

معنای guardهای هوک که باید در نظر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای عامل را مکث می‌کند و از کاربر از طریق overlay تأیید exec، دکمه‌های Telegram، تعاملات Discord، یا فرمان `/approve` روی هر کانال تأیید می‌خواهد.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_received`: وقتی به routing thread/topic ورودی نیاز دارید، فیلد typed `threadId` را ترجیح دهید. `metadata` را برای موارد اضافی مختص کانال نگه دارید.
- `message_sending`: فیلدهای routing typed `replyToId` / `threadId` را به کلیدهای metadata مختص کانال ترجیح دهید.

فرمان `/approve` هم تأییدهای exec و هم تأییدهای Plugin را با fallback محدود مدیریت می‌کند: وقتی id تأیید exec پیدا نشود، OpenClaw همان id را از طریق تأییدهای Plugin دوباره امتحان می‌کند. forwarding تأیید Plugin می‌تواند به‌طور مستقل از طریق `approvals.plugin` در config پیکربندی شود.

اگر لوله‌کشی تأیید سفارشی باید همان حالت fallback محدود را تشخیص دهد،
به‌جای تطبیق دستی رشته‌های انقضای تأیید، `isApprovalNotFoundError` از `openclaw/plugin-sdk/error-runtime`
را ترجیح دهید.

برای نمونه‌ها و مرجع هوک، [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای عامل

ابزارها تابع‌های typed هستند که LLM می‌تواند آن‌ها را فراخوانی کند. آن‌ها می‌توانند الزامی (همیشه
در دسترس) یا اختیاری (با انتخاب کاربر) باشند:

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

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود باید در manifest
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

OpenClaw توصیف‌گر اعتبارسنجی‌شده را از ابزار ثبت‌شده ضبط و کش می‌کند،
بنابراین plugins داده‌های `description` یا schema را در manifest تکرار نمی‌کنند. قرارداد
manifest فقط مالکیت و کشف را اعلام می‌کند؛ اجرا همچنان پیاده‌سازی زنده ابزار
ثبت‌شده را فراخوانی می‌کند.
برای ابزارهایی که با
`api.registerTool(..., { optional: true })` ثبت شده‌اند، مقدار `toolMetadata.<tool>.optional: true` را تنظیم کنید تا OpenClaw بتواند تا زمانی که ابزار به‌صراحت در فهرست مجاز قرار نگرفته، از بارگذاری
runtime آن Plugin خودداری کند.

کاربران ابزارهای اختیاری را در پیکربندی فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای هسته تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی با اشیای ثبت‌نام نادرست، از جمله مواردی که `parameters` ندارند، به‌جای خراب‌کردن اجرای agentها نادیده گرفته می‌شوند و در diagnostics مربوط به Plugin گزارش می‌شوند
- برای ابزارهایی با اثرات جانبی یا نیازمندی‌های دودویی اضافی از `optional: true` استفاده کنید
- کاربران می‌توانند با افزودن شناسه Plugin به `tools.allow` همه ابزارهای یک Plugin را فعال کنند

## ثبت فرمان‌های CLI

Plugins می‌توانند با `api.registerCli` گروه‌های فرمان ریشه `openclaw` اضافه کنند. برای هر ریشه فرمان سطح‌بالا
`descriptors` ارائه دهید تا OpenClaw بتواند بدون بارگذاری مشتاقانه runtime همه Pluginها، فرمان را نمایش داده و مسیریابی کند.

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

پس از نصب، ثبت runtime را بررسی کنید و فرمان را اجرا کنید:

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

درون Plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید - هرگز Plugin خودتان را از طریق مسیر SDK آن import نکنید.

برای Pluginهای provider، helperهای ویژه provider را در همان barrelهای ریشه package نگه دارید مگر اینکه آن مرز واقعاً عمومی باشد. نمونه‌های bundled فعلی:

- Anthropic: wrapperهای جریان Claude و helperهای `service_tier` / beta
- OpenAI: سازنده‌های provider، helperهای مدل پیش‌فرض، providerهای realtime
- OpenRouter: سازنده provider به‌همراه helperهای onboarding/پیکربندی

اگر یک helper فقط درون یک package مربوط به provider bundled مفید است، آن را به‌جای ارتقا دادن به `openclaw/plugin-sdk/*` روی همان مرز ریشه package نگه دارید.

برخی مرزهای helper تولیدشده `openclaw/plugin-sdk/<bundled-id>` هنوز برای نگهداری bundled-plugin زمانی وجود دارند که استفاده مالک ثبت‌شده داشته باشند. با آن‌ها به‌عنوان سطح‌های رزروشده برخورد کنید، نه الگوی پیش‌فرض برای Pluginهای شخص ثالث جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** metadata درست `openclaw` را دارد</Check>
<Check>manifest **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از ماژول‌های محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها عبور می‌کنند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` عبور می‌کند (برای Pluginهای درون repo)</Check>

## تست انتشار beta

1. برچسب‌های انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` مشترک شوید. برچسب‌های beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید اعلان‌های حساب رسمی OpenClaw در X، [@openclaw](https://x.com/openclaw)، را برای اطلاعیه‌های انتشار فعال کنید.
2. به‌محض ظاهرشدن برچسب beta، Plugin خود را در برابر آن تست کنید. بازه پیش از stable معمولاً فقط چند ساعت است.
3. پس از تست، در thread مربوط به Plugin خود در کانال Discord `plugin-forum` با `all good` یا آنچه خراب شده است پیام بگذارید. اگر هنوز thread ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. لینک issue را در thread خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود لینک کنید. مشارکت‌کنندگان نمی‌توانند روی PRها label بگذارند، بنابراین عنوان سیگنال سمت PR برای نگهدارندگان و automation است. مسدودکننده‌هایی که PR دارند merge می‌شوند؛ مسدودکننده‌های بدون PR ممکن است با وجود آن shipped شوند. نگهدارندگان در طول تست beta این threadها را زیر نظر دارند.
6. سکوت یعنی سبز. اگر این بازه را از دست بدهید، اصلاح شما احتمالاً در چرخه بعدی وارد می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Pluginهای provider" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin provider مدل بسازید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت
  </Card>
  <Card title="Helperهای runtime" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو، subagent از طریق api.runtime
  </Card>
  <Card title="تست" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای تست
  </Card>
  <Card title="Manifest مربوط به Plugin" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema مربوط به manifest
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) - بررسی عمیق معماری داخلی
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع SDK مربوط به Plugin
- [Manifest](/fa/plugins/manifest) - قالب manifest مربوط به Plugin
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای کانال
- [Pluginهای provider](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای provider
