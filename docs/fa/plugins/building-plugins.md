---
doc-schema-version: 1
read_when:
    - می‌خواهید یک Plugin جدید برای OpenClaw ایجاد کنید
    - برای توسعهٔ Plugin به یک راهنمای شروع سریع نیاز دارید
    - در حال انتخاب میان مستندات کانال، ارائه‌دهنده، بک‌اند CLI، ابزار یا هوک هستید
sidebarTitle: Getting Started
summary: نخستین Plugin خود را برای OpenClaw در چند دقیقه بسازید
title: ساخت Pluginها
x-i18n:
    generated_at: "2026-07-16T17:13:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها بدون تغییر هسته، OpenClaw را گسترش می‌دهند. یک Plugin می‌تواند یک کانال
پیام‌رسانی، ارائه‌دهنده مدل، بک‌اند محلی CLI، ابزار عامل، هوک، ارائه‌دهنده رسانه
یا قابلیت دیگری متعلق به Plugin اضافه کند.

نیازی نیست یک Plugin خارجی را به مخزن OpenClaw اضافه کنید. بسته را در
[ClawHub](/clawhub) منتشر کنید تا کاربران آن را با دستور زیر نصب کنند:

```bash
openclaw plugins install clawhub:<package-name>
```

در دوره گذار راه‌اندازی، مشخصات بسته بدون پیشوند همچنان از npm نصب می‌شوند. زمانی که
تفکیک‌پذیری از طریق ClawHub را می‌خواهید، از پیشوند
`clawhub:` استفاده کنید.

## الزامات

- Node 22.22.3+، Node 24.15+ یا Node 25.9+ و `npm` یا `pnpm`.
- ماژول‌های TypeScript ESM.
- برای کار روی Pluginهای یکپارچه‌شده درون مخزن، مخزن را کلون و `pnpm install` را اجرا کنید.
  توسعه Plugin در نسخه منبع فقط با pnpm انجام می‌شود، زیرا OpenClaw
  Pluginهای یکپارچه‌شده را از بسته‌های فضای کاری `extensions/*` کشف می‌کند.

## انتخاب ساختار Plugin

<CardGroup cols={2}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید.
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل، رسانه، جست‌وجو، واکشی، گفتار یا بلادرنگ اضافه کنید.
  </Card>
  <Card title="Plugin بک‌اند CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک CLI محلی هوش مصنوعی را از طریق سازوکار جایگزین مدل OpenClaw اجرا کنید.
  </Card>
  <Card title="Plugin ابزار" icon="wrench" href="/fa/plugins/tool-plugins">
    ابزارهای عامل را ثبت کنید.
  </Card>
</CardGroup>

## شروع سریع

با ثبت یک ابزار عامل الزامی، یک Plugin ابزار حداقلی بسازید. این
کوتاه‌ترین ساختار مفید Plugin است و بسته، مانیفست، نقطه ورود و
اثبات محلی را پوشش می‌دهد.

<Steps>
  <Step title="ایجاد فراداده بسته">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    نقاط ورود زمان اجرای Pluginهای خارجی منتشرشده باید به فایل‌های JavaScript
    ساخته‌شده اشاره کنند. برای قرارداد کامل نقطه ورود، به
    [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) مراجعه کنید.

    هر Plugin حتی بدون پیکربندی نیز به مانیفست نیاز دارد. ابزارهای زمان اجرا باید
    در `contracts.tools` ظاهر شوند تا OpenClaw بتواند مالکیت را بدون
    بارگذاری پیش‌دستانه زمان اجرای همه Pluginها کشف کند. مقدار `activation.onStartup`
    را آگاهانه تنظیم کنید؛ این نمونه هنگام راه‌اندازی Gateway بارگذاری می‌شود.

    سطوح Plugin مورد اعتماد میزبان نیز با مانیفست محدود می‌شوند و برای
    Pluginهای نصب‌شده به اعلان صریح نیاز دارند: `api.registerAgentToolResultMiddleware(...)`
    به فهرست‌شدن هر زمان اجرای هدف در `contracts.agentToolResultMiddleware` نیاز دارد،
    و `api.registerTrustedToolPolicy(...)` به هر شناسه خط‌مشی در
    `contracts.trustedToolPolicies` نیاز دارد. این اعلان‌ها بازرسی زمان نصب
    و ثبت زمان اجرا را هم‌راستا نگه می‌دارند.

    برای همه فیلدهای مانیفست، به [مانیفست Plugin](/fa/plugins/manifest) مراجعه کنید.

  </Step>

  <Step title="ثبت ابزار">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    برای Pluginهای غیرکانالی از `definePluginEntry` استفاده کنید. Pluginهای کانال
    در عوض از `defineChannelPluginEntry` در `openclaw/plugin-sdk/core` استفاده می‌کنند.

  </Step>

  <Step title="آزمایش زمان اجرا">
    برای یک Plugin نصب‌شده یا خارجی، زمان اجرای بارگذاری‌شده را بررسی کنید:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    اگر Plugin یک فرمان CLI ثبت می‌کند، آن فرمان را نیز اجرا و
    خروجی را تأیید کنید؛ برای مثال `openclaw demo-plugin ping`.

    برای یک Plugin یکپارچه‌شده در این مخزن، OpenClaw بسته‌های Plugin نسخه منبع را
    از فضای کاری `extensions/*` کشف می‌کند. نزدیک‌ترین آزمون هدفمند
    را اجرا کنید:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="آزمایش نصب بسته">
    پیش از انتشار یک Plugin آماده بسته‌بندی، همان ساختار نصبی را آزمایش کنید که
    کاربران دریافت خواهند کرد. ابتدا یک مرحله ساخت اضافه کنید، نقاط ورود زمان اجرا مانند
    `openclaw.extensions` را به JavaScript ساخته‌شده‌ای مانند `./dist/index.js` هدایت کنید و
    مطمئن شوید `npm pack` آن خروجی `dist/` را شامل می‌شود. نقاط ورود منبع TypeScript
    فقط برای نسخه‌های منبع و مسیرهای توسعه محلی هستند.

    سپس Plugin را بسته‌بندی کنید و فایل tar را با `npm-pack:` نصب کنید:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` از پروژه npm مدیریت‌شده اختصاصی هر Plugin در OpenClaw استفاده می‌کند، بنابراین
    اشتباهات وابستگی زمان اجرا را که آزمایش نسخه منبع ممکن است پنهان کند، شناسایی می‌کند. این کار
    ساختار بسته و وابستگی را اثبات می‌کند، نه اعتماد رسمی متصل به کاتالوگ را.
    واردسازی‌های زمان اجرا باید در `dependencies` یا `optionalDependencies` باشند؛
    وابستگی‌هایی که فقط در `devDependencies` باقی بمانند، برای
    پروژه زمان اجرای مدیریت‌شده نصب نخواهند شد.

    از نصب مستقیم بایگانی/مسیر به‌عنوان اثبات نهایی رفتار رسمی یا
    دارای دسترسی ویژه Plugin استفاده نکنید. منابع مستقیم برای اشکال‌زدایی محلی مفیدند، اما
    همان مسیر وابستگی نصب‌های npm یا ClawHub را اثبات نمی‌کنند. اگر
    Plugin شما به وضعیت مورد اعتماد Plugin رسمی متکی است، اثبات دومی را
    از طریق نصب رسمی مبتنی بر کاتالوگ یا مسیر بسته منتشرشده‌ای اضافه کنید که
    اعتماد رسمی را ثبت می‌کند. برای جزئیات ریشه نصب و مالکیت وابستگی،
    به [تفکیک وابستگی Plugin](/fa/plugins/dependency-resolution)
    مراجعه کنید.

  </Step>

  <Step title="انتشار">
    بسته را پیش از انتشار اعتبارسنجی کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    قطعه‌کدهای معیار بسته ClawHub در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="نصب">
    بسته منتشرشده را از طریق ClawHub نصب کنید:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ثبت ابزارها

ابزارها می‌توانند الزامی یا اختیاری باشند. ابزارهای الزامی هرگاه
Plugin فعال باشد، همیشه در دسترس‌اند. ابزارهای اختیاری پیش از آنکه OpenClaw
زمان اجرای Plugin مالک را بارگذاری کند، به پذیرش صریح کاربر نیاز دارند.

کارخانه‌های ابزار، زمینه زمان اجرای مورد اعتماد را دریافت می‌کنند که شامل `deliveryContext`،
`nativeChannelId` برای گفت‌وگوی فعال پلتفرم در صورت دسترس‌بودن و
`requesterSenderId` است.

```typescript
register(api) {
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

هر ابزار ثبت‌شده با `api.registerTool(...)` باید در
مانیفست Plugin نیز اعلان شود:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

کاربران با `tools.allow` آن را فعال می‌کنند:

```json5
{
  tools: { allow: ["workflow_tool"] }, // یا ["my-plugin"] برای همه ابزارهای یک Plugin
}
```

ابزارهای اختیاری تعیین می‌کنند که آیا ابزار در معرض مدل قرار می‌گیرد یا خیر. زمانی که یک ابزار
یا هوک باید پس از انتخاب‌شدن توسط مدل و پیش از اجرای
عمل درخواست تأیید کند، از [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests) استفاده کنید.

برای عوارض جانبی، فایل‌های اجرایی غیرمعمول یا قابلیت‌هایی که
نباید به‌طور پیش‌فرض در معرض قرار گیرند، از ابزارهای اختیاری استفاده کنید. نام ابزارها نباید با نام
ابزارهای هسته تداخل داشته باشد؛ موارد متداخل نادیده گرفته می‌شوند و در عیب‌یابی Plugin گزارش می‌شوند. ثبت‌های
نادرست نیز به همین روش نادیده گرفته و گزارش می‌شوند: `name` غیرتهیِ ازدست‌رفته،
`execute` که تابع نیست یا توصیفگر ابزاری بدون شیء `parameters`.

کارخانه‌های ابزار یک شیء زمینه تأمین‌شده توسط زمان اجرا دریافت می‌کنند. هنگامی که یک ابزار
برای ثبت گزارش، نمایش یا سازگارشدن با مدل فعال نوبت جاری نیاز دارد، از `ctx.activeModel`
استفاده کنید؛ این شیء می‌تواند شامل `provider`، `modelId` و `modelRef` باشد. با آن
به‌عنوان فراداده اطلاعاتی زمان اجرا رفتار کنید، نه یک مرز امنیتی در برابر
اپراتور محلی، کد Plugin نصب‌شده یا زمان اجرای تغییریافته OpenClaw. ابزارهای
محلی حساس همچنان باید به پذیرش صریح Plugin یا اپراتور نیاز داشته باشند و
اگر فراداده مدل فعال موجود یا مناسب نیست، به‌صورت بسته شکست بخورند.

مانیفست مالکیت و کشف را اعلان می‌کند؛ اجرا همچنان پیاده‌سازی زنده
ابزار ثبت‌شده را فراخوانی می‌کند. `toolMetadata.<tool>.optional: true`
را با `api.registerTool(..., { optional: true })` هم‌راستا نگه دارید تا OpenClaw بتواند
از بارگذاری زمان اجرای آن Plugin تا زمانی که ابزار صریحاً در فهرست مجاز قرار گیرد، خودداری کند.

## قراردادهای واردسازی

از زیرمسیرهای متمرکز SDK وارد کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

از barrel ریشه منسوخ‌شده وارد نکنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

در بسته Plugin خود، برای واردسازی‌های داخلی از فایل‌های barrel محلی مانند `api.ts` و
`runtime-api.ts` استفاده کنید. Plugin خود را از طریق یک مسیر
SDK وارد نکنید. کمک‌کننده‌های مختص ارائه‌دهنده باید در بسته ارائه‌دهنده باقی بمانند، مگر اینکه
مرز واقعاً عمومی باشد.

متدهای سفارشی RPC در Gateway یک نقطه ورود پیشرفته هستند. آن‌ها را روی یک
پیشوند مختص Plugin نگه دارید؛ فضاهای نام مدیریتی هسته مانند `config.*`،
`exec.approvals.*`، `operator.admin.*`، `wizard.*` و `update.*` رزروشده باقی می‌مانند
و به `operator.admin` تفکیک می‌شوند. پل
`openclaw/plugin-sdk/gateway-method-runtime` برای مسیرهای HTTP در Plugin که
`contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلان می‌کنند، رزرو شده است.

برای نقشه کامل واردسازی، به [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview) مراجعه کنید.

## چک‌لیست پیش از ارسال

<Check>**package.json** دارای فراداده صحیح `openclaw` است</Check>
<Check>مانیفست **openclaw.plugin.json** موجود و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه واردسازی‌ها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>واردسازی‌های داخلی از ماژول‌های محلی استفاده می‌کنند، نه خودواردسازی‌های SDK</Check>
<Check>آزمون‌ها موفق‌اند (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` موفق است (Pluginهای درون مخزن)</Check>

## آزمایش در برابر نسخه‌های بتا

1. انتشارهای [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) را دنبال کنید (`Watch` > `Releases`). برچسب‌های بتا به‌شکل `v2026.3.N-beta.1` هستند. همچنین می‌توانید برای اطلاعیه‌های انتشار، [@openclaw](https://x.com/openclaw) را در X دنبال کنید.
2. به‌محض ظاهرشدن برچسب بتا، Plugin خود را با آن آزمایش کنید. بازه زمانی پیش از انتشار پایدار معمولاً فقط چند ساعت است.
3. پس از آزمایش، در رشتهٔ Plugin خود در کانال Discord با نام `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd))، یکی از این دو مورد را ارسال کنید: `all good` یا شرح آنچه از کار افتاده است. اگر هنوز رشته‌ای ندارید، یکی ایجاد کنید.
4. اگر چیزی از کار افتاد، یک مسئله با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و برچسب `beta-blocker` را به آن اعمال کنید. پیوند مسئله را در رشتهٔ خود قرار دهید.
5. یک PR با عنوان `fix(<plugin-id>): beta blocker - <summary>` برای `main` باز کنید و در هر دو محل، یعنی PR و رشتهٔ Discord خود، به مسئله پیوند دهید. مشارکت‌کنندگان نمی‌توانند به PRها برچسب بزنند؛ بنابراین عنوان، نشانهٔ سمت PR برای نگه‌دارندگان و خودکارسازی است. موارد مسدودکننده‌ای که PR دارند ادغام می‌شوند؛ موارد بدون PR ممکن است بااین‌حال منتشر شوند.
6. سکوت به‌معنای سبزبودن وضعیت است. ازدست‌دادن این بازه معمولاً به این معناست که اصلاح شما در چرخهٔ بعدی اعمال می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهندهٔ مدل بسازید
  </Card>
  <Card title="Pluginهای بک‌اند CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک بک‌اند محلی CLI هوش مصنوعی ثبت کنید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع نگاشت واردکردن و API ثبت
  </Card>
  <Card title="ابزارهای کمکی زمان اجرا" icon="settings" href="/fa/plugins/sdk-runtime">
    TTS، جست‌وجو و زیرعامل از طریق api.runtime
  </Card>
  <Card title="آزمایش" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای آزمایش
  </Card>
  <Card title="مانیفست Plugin" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل طرح‌وارهٔ مانیفست
  </Card>
</CardGroup>

## مرتبط

- [قلاب‌های Plugin](/fa/plugins/hooks)
- [معماری Plugin](/fa/plugins/architecture)
