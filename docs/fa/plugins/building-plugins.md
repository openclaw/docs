---
read_when:
    - می‌خواهید یک Plugin جدید OpenClaw ایجاد کنید
    - به یک شروع سریع برای توسعه Plugin نیاز دارید
    - شما در حال افزودن یک کانال، ارائه‌دهنده، ابزار یا قابلیت دیگری به OpenClaw هستید
sidebarTitle: Getting Started
summary: اولین Plugin خود برای OpenClaw را در چند دقیقه بسازید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-05-04T02:26:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های تازه گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر،
تولید ویدئو، واکشی وب، جست‌وجوی وب، ابزارهای agent، یا هر
ترکیبی از آن‌ها.

لازم نیست Plugin خود را به مخزن OpenClaw اضافه کنید. آن را در
[ClawHub](/fa/tools/clawhub) منتشر کنید و کاربران با
`openclaw plugins install clawhub:<package-name>` نصب می‌کنند. مشخصات ساده‌ی بسته همچنان
در زمان گذار راه‌اندازی از npm نصب می‌شوند.

## پیش‌نیازها

- Node >= 22 و یک مدیر بسته (npm یا pnpm)
- آشنایی با TypeScript (ESM)
- برای Pluginهای داخل مخزن: مخزن clone شده و `pnpm install` انجام شده باشد. توسعه‌ی Plugin با
  checkout سورس فقط با pnpm انجام می‌شود، چون OpenClaw Pluginهای bundled را از بسته‌های workspace
  در `extensions/*` بارگذاری می‌کند.

## چه نوع Pluginی؟

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک سکوی پیام‌رسانی وصل کنید (Discord، IRC، و غیره)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده‌ی مدل اضافه کنید (LLM، proxy، یا endpoint سفارشی)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/fa/plugins/hooks">
    ابزارهای agent، event hookها، یا سرویس‌ها را ثبت کنید — در ادامه دنبال کنید
  </Card>
</CardGroup>

برای یک Plugin کانال که نصب بودن آن هنگام اجرای onboarding/setup تضمین نشده است،
از `createOptionalChannelSetupSurface(...)` از
`openclaw/plugin-sdk/channel-setup` استفاده کنید. این کار یک جفت setup adapter + wizard
می‌سازد که نیاز نصب را اعلام می‌کند و تا زمانی که Plugin نصب نشده باشد، در نوشتن config واقعی
به‌صورت بسته شکست می‌خورد.

## شروع سریع: Plugin ابزار

این راهنما یک Plugin حداقلی می‌سازد که یک ابزار agent را ثبت می‌کند. Pluginهای کانال
و ارائه‌دهنده راهنماهای اختصاصی دارند که بالاتر لینک شده‌اند.

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

    هر Plugin به یک manifest نیاز دارد، حتی اگر config نداشته باشد. ابزارهایی که در زمان اجرا ثبت می‌شوند
    باید در `contracts.tools` فهرست شوند تا OpenClaw بتواند Plugin مالک را بدون بارگذاری
    runtime همه‌ی Pluginها کشف کند. Pluginها باید `activation.onStartup` را نیز آگاهانه اعلام کنند.
    این مثال آن را روی `true` تنظیم می‌کند. برای schema کامل، [Manifest](/fa/plugins/manifest) را ببینید.
    قطعه‌کدهای canonical انتشار ClawHub در `docs/snippets/plugin-publish/` قرار دارند.

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

    مشخصات ساده‌ی بسته مانند `@myorg/openclaw-my-plugin` در زمان گذار راه‌اندازی از npm نصب می‌شوند.
    وقتی resolution از ClawHub می‌خواهید، از `clawhub:` استفاده کنید.

    **Pluginهای داخل مخزن:** زیر درخت workspace مربوط به Pluginهای bundled قرار دهید — به‌صورت خودکار کشف می‌شود.

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
| واکشی وب | `api.registerWebFetchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جست‌وجوی وب | `api.registerWebSearchProvider(...)` | [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| middleware نتیجه‌ی ابزار | `api.registerAgentToolResultMiddleware(...)` | [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) |
| ابزارهای agent | `api.registerTool(...)` | پایین |
| فرمان‌های سفارشی | `api.registerCommand(...)` | [Entry Points](/fa/plugins/sdk-entrypoints) |
| hookهای Plugin | `api.on(...)` | [hookهای Plugin](/fa/plugins/hooks) |
| hookهای رویداد داخلی | `api.registerHook(...)` | [Entry Points](/fa/plugins/sdk-entrypoints) |
| مسیرهای HTTP | `api.registerHttpRoute(...)` | [داخلی‌ها](/fa/plugins/architecture-internals#gateway-http-routes) |
| زیر‌فرمان‌های CLI | `api.registerCli(...)` | [Entry Points](/fa/plugins/sdk-entrypoints) |

برای API کامل ثبت، [نمای کلی SDK](/fa/plugins/sdk-overview#registration-api) را ببینید.

Pluginهای bundled می‌توانند زمانی از `api.registerAgentToolResultMiddleware(...)` استفاده کنند که
به بازنویسی async نتیجه‌ی ابزار پیش از دیده شدن خروجی توسط مدل نیاز دارند. runtimeهای
هدف را در `contracts.agentToolResultMiddleware` اعلام کنید، برای مثال
`["pi", "codex"]`. این یک seam مورد اعتماد برای Plugin bundled است؛ Pluginهای خارجی
باید hookهای معمول OpenClaw Plugin را ترجیح دهند، مگر اینکه OpenClaw برای این قابلیت یک
سیاست اعتماد صریح اضافه کند.

اگر Plugin شما متدهای RPC سفارشی Gateway ثبت می‌کند، آن‌ها را روی یک پیشوند
ویژه‌ی Plugin نگه دارید. namespaceهای مدیریتی core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری درخواست کند.

معناشناسی guard مربوط به hook که باید به خاطر داشته باشید:

- `before_tool_call`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `before_tool_call`: `{ requireApproval: true }` اجرای agent را متوقف می‌کند و از کاربر از طریق exec approval overlay، دکمه‌های Telegram، تعاملات Discord، یا فرمان `/approve` روی هر کانال تأیید می‌خواهد.
- `before_install`: `{ block: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_sending`: `{ cancel: true }` نهایی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `message_received`: وقتی به routing ورودی thread/topic نیاز دارید، فیلد تایپ‌شده‌ی `threadId` را ترجیح دهید. `metadata` را برای موارد اضافه‌ی ویژه‌ی کانال نگه دارید.
- `message_sending`: فیلدهای routing تایپ‌شده‌ی `replyToId` / `threadId` را به کلیدهای metadata ویژه‌ی کانال ترجیح دهید.

فرمان `/approve` هم exec approvalها و هم Plugin approvalها را با fallback محدود مدیریت می‌کند: وقتی شناسه‌ی exec approval پیدا نشود، OpenClaw همان شناسه را از طریق Plugin approvalها دوباره امتحان می‌کند. forwarding مربوط به Plugin approval را می‌توان به‌طور مستقل از طریق `approvals.plugin` در config پیکربندی کرد.

اگر plumbing سفارشی approval نیاز دارد همان مورد fallback محدود را تشخیص دهد،
به‌جای تطبیق دستی رشته‌های انقضای approval، `isApprovalNotFoundError` را از `openclaw/plugin-sdk/error-runtime`
ترجیح دهید.

برای مثال‌ها و مرجع hook، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

## ثبت ابزارهای agent

ابزارها توابع تایپ‌شده‌ای هستند که LLM می‌تواند فراخوانی کند. آن‌ها می‌توانند required باشند (همیشه
در دسترس) یا optional باشند (opt-in کاربر):

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
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw توصیفگر اعتبارسنجی‌شده را از ابزار ثبت‌شده ضبط و cache می‌کند،
بنابراین plugins داده‌های `description` یا schema را در manifest تکرار نمی‌کنند. قرارداد
manifest فقط مالکیت و discovery را اعلام می‌کند؛ اجرا همچنان پیاده‌سازی زنده ابزار ثبت‌شده را
فراخوانی می‌کند.
برای ابزارهایی که با
`api.registerTool(..., { optional: true })` ثبت شده‌اند، مقدار `toolMetadata.<tool>.optional: true` را تنظیم کنید تا OpenClaw بتواند از بارگذاری runtime آن
plugin جلوگیری کند تا زمانی که ابزار صراحتاً allowlist شود.

کاربران ابزارهای اختیاری را در config فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- نام ابزارها نباید با ابزارهای core تداخل داشته باشد (تداخل‌ها نادیده گرفته می‌شوند)
- ابزارهایی با objectهای ثبت‌نام بدشکل، از جمله نبود `parameters`، به‌جای شکستن اجرای agent، نادیده گرفته شده و در diagnostics مربوط به plugin گزارش می‌شوند
- برای ابزارهایی با side effect یا نیازمندی‌های binary اضافی از `optional: true` استفاده کنید
- کاربران می‌توانند با افزودن id مربوط به plugin به `tools.allow` همه ابزارهای یک plugin را فعال کنند

## ثبت دستورهای CLI

Plugins می‌توانند با `api.registerCli` گروه‌های دستور ریشه `openclaw` اضافه کنند. برای هر ریشه دستور سطح بالا
`descriptors` ارائه دهید تا OpenClaw بتواند دستور را بدون بارگذاری مشتاقانه runtime همه plugins نمایش دهد و route کند.

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

برای مرجع کامل subpath، [نمای کلی SDK](/fa/plugins/sdk-overview) را ببینید.

درون plugin خود، برای importهای داخلی از فایل‌های barrel محلی (`api.ts`، `runtime-api.ts`) استفاده کنید — هرگز plugin خود را از مسیر SDK آن import نکنید.

برای provider plugins، helperهای ویژه provider را در همان barrelهای package-root نگه دارید مگر اینکه seam واقعاً generic باشد. نمونه‌های bundleشده فعلی:

- Anthropic: wrapperهای stream مربوط به Claude و helperهای `service_tier` / beta
- OpenAI: builderهای provider، helperهای default-model، providerهای realtime
- OpenRouter: builder مربوط به provider به‌همراه helperهای onboarding/config

اگر یک helper فقط درون یک بسته provider bundleشده مفید است، به‌جای ارتقای آن به `openclaw/plugin-sdk/*`، آن را روی همان seam مربوط به package-root نگه دارید.

برخی seamهای helper تولیدشده `openclaw/plugin-sdk/<bundled-id>` همچنان برای نگهداشت bundled-plugin وجود دارند، وقتی usage مالک ردیابی‌شده داشته باشند. این‌ها را به‌عنوان سطح‌های رزروشده در نظر بگیرید، نه الگوی پیش‌فرض برای third-party plugins جدید.

## چک‌لیست پیش از ارسال

<Check>**package.json** metadata درست `openclaw` را دارد</Check>
<Check>manifest مربوط به **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه importها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>importهای داخلی از moduleهای محلی استفاده می‌کنند، نه self-importهای SDK</Check>
<Check>تست‌ها pass می‌شوند (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass می‌شود (plugins درون repo)</Check>

## تست انتشار Beta

1. tagهای انتشار GitHub را در [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) دنبال کنید و از مسیر `Watch` > `Releases` subscribe کنید. tagهای Beta شبیه `v2026.3.N-beta.1` هستند. همچنین می‌توانید notificationهای حساب رسمی OpenClaw در X یعنی [@openclaw](https://x.com/openclaw) را برای اعلامیه‌های انتشار روشن کنید.
2. به‌محض ظاهر شدن tag بتا، plugin خود را در برابر آن تست کنید. بازه زمانی پیش از stable معمولاً فقط چند ساعت است.
3. پس از تست، در thread مربوط به plugin خود در کانال Discord با نام `plugin-forum` با `all good` یا آنچه خراب شده پست کنید. اگر هنوز thread ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، issueای با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و label `beta-blocker` را اعمال کنید. لینک issue را در thread خود قرار دهید.
5. یک PR به `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و issue را هم در PR و هم در thread Discord خود link کنید. contributors نمی‌توانند PRها را label کنند، بنابراین title سیگنال سمت PR برای maintainers و automation است. blockerهایی که PR دارند merge می‌شوند؛ blockerهای بدون PR ممکن است به‌هرحال ship شوند. maintainers در طول تست beta این threadها را زیر نظر دارند.
6. سکوت یعنی وضعیت سبز است. اگر این بازه را از دست بدهید، fix شما احتمالاً در cycle بعدی land می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک messaging channel plugin بسازید
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک model provider plugin بسازید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع import map و registration API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، search، subagent از طریق api.runtime
  </Card>
  <Card title="تست" icon="test-tubes" href="/fa/plugins/sdk-testing">
    utilityها و الگوهای تست
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل schema مربوط به manifest
  </Card>
</CardGroup>

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — بررسی عمیق معماری داخلی
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع Plugin SDK
- [Manifest](/fa/plugins/manifest) — قالب manifest مربوط به plugin
- [Channel Plugins](/fa/plugins/sdk-channel-plugins) — ساخت channel plugins
- [Provider Plugins](/fa/plugins/sdk-provider-plugins) — ساخت provider plugins
