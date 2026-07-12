---
doc-schema-version: 1
read_when:
    - می‌خواهید یک Plugin جدید برای OpenClaw ایجاد کنید
    - برای توسعهٔ Plugin به یک راهنمای شروع سریع نیاز دارید
    - شما در حال انتخاب میان مستندات کانال، ارائه‌دهنده، بک‌اند CLI، ابزار یا هوک هستید
sidebarTitle: Getting Started
summary: نخستین Plugin خود برای OpenClaw را در چند دقیقه ایجاد کنید
title: ساخت Plugin‌ها
x-i18n:
    generated_at: "2026-07-12T10:23:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginها OpenClaw را بدون تغییر هسته گسترش می‌دهند. یک Plugin می‌تواند یک کانال
پیام‌رسانی، ارائه‌دهنده مدل، پشتیبان محلی CLI، ابزار عامل، هوک، ارائه‌دهنده رسانه
یا قابلیت دیگری تحت مالکیت Plugin اضافه کند.

لازم نیست یک Plugin خارجی را به مخزن OpenClaw اضافه کنید. بسته را در
[ClawHub](/clawhub) منتشر کنید تا کاربران آن را با دستور زیر نصب کنند:

```bash
openclaw plugins install clawhub:<package-name>
```

در دوره گذار راه‌اندازی، مشخصات بسته بدون پیشوند همچنان از npm نصب می‌شوند. وقتی
می‌خواهید تفکیک نام از طریق ClawHub انجام شود، از پیشوند `clawhub:` استفاده کنید.

## الزامات

- Node 22.19+، Node 23.11+ یا Node 24+، و `npm` یا `pnpm`.
- ماژول‌های ESM در TypeScript.
- برای کار روی Plugin همراه‌شده درون مخزن، مخزن را کلون و `pnpm install` را اجرا کنید.
  توسعه Plugin در نسخه منبع فقط با pnpm انجام می‌شود، زیرا OpenClaw،
  Pluginهای همراه‌شده را از بسته‌های فضای کاری `extensions/*` شناسایی می‌کند.

## ساختار Plugin را انتخاب کنید

<CardGroup cols={2}>
  <Card title="Plugin کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    OpenClaw را به یک پلتفرم پیام‌رسانی متصل کنید.
  </Card>
  <Card title="Plugin ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک ارائه‌دهنده مدل، رسانه، جست‌وجو، واکشی، گفتار یا بلادرنگ اضافه کنید.
  </Card>
  <Card title="Plugin پشتیبان CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک CLI محلی هوش مصنوعی را از طریق سازوکار جایگزینی مدل OpenClaw اجرا کنید.
  </Card>
  <Card title="Plugin ابزار" icon="wrench" href="/fa/plugins/tool-plugins">
    ابزارهای عامل را ثبت کنید.
  </Card>
</CardGroup>

## شروع سریع

با ثبت یک ابزار عامل الزامی، یک Plugin ابزار حداقلی بسازید. این کوتاه‌ترین
ساختار مفید Plugin است و بسته، مانیفست، نقطه ورود و اثبات محلی را پوشش می‌دهد.

<Steps>
  <Step title="فراداده بسته را ایجاد کنید">
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

    Pluginهای خارجی منتشرشده باید ورودی‌های زمان اجرا را به فایل‌های JavaScript
    ساخته‌شده ارجاع دهند. برای قرارداد کامل نقطه ورود، به
    [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) مراجعه کنید.

    هر Plugin، حتی بدون پیکربندی، به مانیفست نیاز دارد. ابزارهای زمان اجرا باید
    در `contracts.tools` درج شوند تا OpenClaw بتواند مالکیت را بدون بارگذاری
    پیش‌دستانه زمان اجرای همه Pluginها شناسایی کند. مقدار `activation.onStartup`
    را آگاهانه تنظیم کنید؛ این نمونه هنگام راه‌اندازی Gateway بارگذاری می‌شود.

    سطوح Plugin مورداعتماد میزبان نیز با مانیفست کنترل می‌شوند و برای Pluginهای
    نصب‌شده به اعلان صریح نیاز دارند: برای
    `api.registerAgentToolResultMiddleware(...)` باید هر زمان اجرای هدف در
    `contracts.agentToolResultMiddleware` فهرست شود و برای
    `api.registerTrustedToolPolicy(...)` باید شناسه هر سیاست در
    `contracts.trustedToolPolicies` درج شود. این اعلان‌ها بازرسی هنگام نصب و
    ثبت زمان اجرا را هم‌راستا نگه می‌دارند.

    برای همه فیلدهای مانیفست، به [مانیفست Plugin](/fa/plugins/manifest) مراجعه کنید.

  </Step>

  <Step title="ابزار را ثبت کنید">
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

    برای Pluginهای غیرکانالی از `definePluginEntry` استفاده کنید. در عوض،
    Pluginهای کانال از `defineChannelPluginEntry` در
    `openclaw/plugin-sdk/core` استفاده می‌کنند.

  </Step>

  <Step title="زمان اجرا را آزمایش کنید">
    برای یک Plugin نصب‌شده یا خارجی، زمان اجرای بارگذاری‌شده را بررسی کنید:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    اگر Plugin یک فرمان CLI ثبت می‌کند، آن فرمان را نیز اجرا و خروجی را تأیید
    کنید؛ برای نمونه `openclaw demo-plugin ping`.

    برای یک Plugin همراه‌شده در این مخزن، OpenClaw بسته‌های Plugin نسخه منبع را
    از فضای کاری `extensions/*` شناسایی می‌کند. نزدیک‌ترین آزمون هدفمند را اجرا
    کنید:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="نصب بسته را آزمایش کنید">
    پیش از انتشار یک Plugin آماده بسته‌بندی، همان ساختار نصبی را آزمایش کنید که
    کاربران دریافت خواهند کرد. ابتدا یک مرحله ساخت اضافه کنید، ورودی‌های زمان
    اجرا مانند `openclaw.extensions` را به JavaScript ساخته‌شده‌ای مانند
    `./dist/index.js` ارجاع دهید و مطمئن شوید `npm pack` خروجی `dist/` را شامل
    می‌شود. ورودی‌های منبع TypeScript فقط برای نسخه‌های منبع و مسیرهای توسعه
    محلی هستند.

    سپس Plugin را بسته‌بندی کنید و فایل tar را با `npm-pack:` نصب کنید:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` از پروژه npm مدیریت‌شده OpenClaw برای هر Plugin استفاده می‌کند،
    بنابراین اشتباهات وابستگی زمان اجرا را که آزمایش نسخه منبع ممکن است پنهان
    کند، آشکار می‌سازد. این روش ساختار بسته و وابستگی را اثبات می‌کند، نه اعتماد
    رسمی متصل به کاتالوگ را. واردسازی‌های زمان اجرا باید در `dependencies` یا
    `optionalDependencies` باشند؛ وابستگی‌هایی که فقط در `devDependencies`
    باقی بمانند، برای پروژه زمان اجرای مدیریت‌شده نصب نخواهند شد.

    از نصب مستقیم بایگانی یا مسیر به‌عنوان اثبات نهایی رفتار رسمی یا دارای
    امتیاز ویژه Plugin استفاده نکنید. منابع خام برای اشکال‌زدایی محلی مفیدند،
    اما همان مسیر وابستگی نصب‌های npm یا ClawHub را اثبات نمی‌کنند. اگر Plugin
    شما به وضعیت مورداعتماد Plugin رسمی وابسته است، یک اثبات دوم از طریق نصب
    رسمی مبتنی بر کاتالوگ یا مسیر بسته منتشرشده‌ای اضافه کنید که اعتماد رسمی
    را ثبت می‌کند. برای جزئیات ریشه نصب و مالکیت وابستگی، به
    [تفکیک وابستگی Plugin](/fa/plugins/dependency-resolution) مراجعه کنید.

  </Step>

  <Step title="منتشر کنید">
    بسته را پیش از انتشار اعتبارسنجی کنید:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    قطعه‌کدهای مرجع بسته ClawHub در `docs/snippets/plugin-publish/` قرار دارند.

  </Step>

  <Step title="نصب کنید">
    بسته منتشرشده را از طریق ClawHub نصب کنید:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ثبت ابزارها

ابزارها می‌توانند الزامی یا اختیاری باشند. وقتی Plugin فعال است، ابزارهای
الزامی همیشه در دسترس‌اند. پیش از آنکه OpenClaw زمان اجرای Plugin مالک را
بارگذاری کند، ابزارهای اختیاری به پذیرش صریح کاربر نیاز دارند.

کارخانه‌های ابزار، زمینه مورداعتماد زمان اجرا را دریافت می‌کنند؛ از جمله
`deliveryContext`، مقدار `nativeChannelId` برای گفت‌وگوی پلتفرم فعال در صورت
وجود، و `requesterSenderId`.

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

هر ابزاری که با `api.registerTool(...)` ثبت می‌شود، باید در مانیفست Plugin نیز
اعلان شود:

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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

ابزارهای اختیاری تعیین می‌کنند که آیا یک ابزار در معرض مدل قرار می‌گیرد یا نه.
وقتی یک ابزار یا هوک باید پس از انتخاب‌شدن توسط مدل و پیش از اجرای عمل، درخواست
تأیید کند، از [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests)
استفاده کنید.

از ابزارهای اختیاری برای اثرات جانبی، فایل‌های اجرایی غیرمعمول یا قابلیت‌هایی
استفاده کنید که نباید به‌طور پیش‌فرض در معرض مدل قرار گیرند. نام ابزارها نباید
با نام ابزارهای هسته تداخل داشته باشد؛ موارد متداخل نادیده گرفته می‌شوند و در
تشخیص‌های Plugin گزارش می‌شوند. ثبت‌های بدساخت نیز به همین روش نادیده گرفته و
گزارش می‌شوند: نبود یک `name` غیرخالی، تابع نبودن `execute`، یا توصیف‌گر ابزاری
که شیء `parameters` ندارد.

کارخانه‌های ابزار یک شیء زمینه تأمین‌شده توسط زمان اجرا دریافت می‌کنند. وقتی
ابزاری برای ثبت گزارش، نمایش یا سازگاری با مدل فعال در نوبت جاری به آن نیاز
دارد، از `ctx.activeModel` استفاده کنید؛ این مقدار می‌تواند شامل `provider`،
`modelId` و `modelRef` باشد. با آن به‌عنوان فراداده اطلاعاتی زمان اجرا رفتار
کنید، نه یک مرز امنیتی در برابر اپراتور محلی، کد Plugin نصب‌شده یا زمان اجرای
تغییریافته OpenClaw. ابزارهای محلی حساس همچنان باید به پذیرش صریح Plugin یا
اپراتور نیاز داشته باشند و وقتی فراداده مدل فعال وجود ندارد یا مناسب نیست،
به‌صورت بسته و امن شکست بخورند.

مانیفست، مالکیت و شناسایی را اعلان می‌کند؛ اجرا همچنان پیاده‌سازی زنده ابزار
ثبت‌شده را فراخوانی می‌کند. `toolMetadata.<tool>.optional: true` را با
`api.registerTool(..., { optional: true })` هم‌راستا نگه دارید تا OpenClaw
بتواند تا زمانی که ابزار صریحاً در فهرست مجاز قرار نگرفته است، از بارگذاری زمان
اجرای آن Plugin خودداری کند.

## قراردادهای واردسازی

از زیرمسیرهای متمرکز SDK وارد کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

از ورودی تجمیعی ریشه منسوخ‌شده وارد نکنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

درون بسته Plugin خود، برای واردسازی‌های داخلی از فایل‌های تجمیعی محلی مانند
`api.ts` و `runtime-api.ts` استفاده کنید. Plugin خود را از طریق یک مسیر SDK
وارد نکنید. یاریگرهای مختص ارائه‌دهنده باید در بسته ارائه‌دهنده باقی بمانند،
مگر اینکه این مرز واقعاً عمومی باشد.

متدهای سفارشی RPC در Gateway یک نقطه ورود پیشرفته‌اند. آن‌ها را در یک پیشوند
مختص Plugin نگه دارید؛ فضاهای نام مدیریتی هسته مانند `config.*`،
`exec.approvals.*`، `operator.admin.*`، `wizard.*` و `update.*` رزروشده باقی
می‌مانند و به `operator.admin` تفکیک می‌شوند. پل
`openclaw/plugin-sdk/gateway-method-runtime` برای مسیرهای HTTP مربوط به Plugin
رزرو شده است که
`contracts.gatewayMethodDispatch: ["authenticated-request"]` را اعلان می‌کنند.

برای نقشه کامل واردسازی، به [مرور کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview)
مراجعه کنید.

## فهرست بررسی پیش از ارسال

<Check>**package.json** دارای فراداده صحیح `openclaw` است</Check>
<Check>مانیفست **openclaw.plugin.json** وجود دارد و معتبر است</Check>
<Check>نقطه ورود از `defineChannelPluginEntry` یا `definePluginEntry` استفاده می‌کند</Check>
<Check>همه واردسازی‌ها از مسیرهای متمرکز `plugin-sdk/<subpath>` استفاده می‌کنند</Check>
<Check>واردسازی‌های داخلی از ماژول‌های محلی استفاده می‌کنند، نه واردسازی خودارجاعی SDK</Check>
<Check>آزمون‌ها موفق‌اند (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` موفق است (برای Pluginهای درون مخزن)</Check>

## آزمایش در برابر نسخه‌های بتا

1. انتشارهای [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) را دنبال کنید (`Watch` > `Releases`). برچسب‌های بتا به‌شکل `v2026.3.N-beta.1` هستند. همچنین می‌توانید برای اطلاعیه‌های انتشار، [@openclaw](https://x.com/openclaw) را در X دنبال کنید.
2. به‌محض ظاهرشدن برچسب بتا، Plugin خود را با آن آزمایش کنید. بازه زمانی پیش از انتشار پایدار معمولاً فقط چند ساعت است.
3. پس از آزمایش، در رشته مربوط به Plugin خود در کانال Discord با نام `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd))، عبارت `all good` یا شرح موردی را که خراب شده است ارسال کنید. اگر هنوز رشته‌ای ندارید، یکی ایجاد کنید.
4. اگر چیزی خراب شد، یک مشکل با عنوان `Beta blocker: <plugin-name> - <summary>` باز یا به‌روزرسانی کنید و برچسب `beta-blocker` را اعمال کنید. پیوند مشکل را در رشته خود قرار دهید.
5. یک PR برای `main` با عنوان `fix(<plugin-id>): beta blocker - <summary>` باز کنید و پیوند مشکل را هم در PR و هم در رشته Discord خود قرار دهید. مشارکت‌کنندگان نمی‌توانند به PRها برچسب بزنند، بنابراین عنوان، نشانه سمت PR برای نگه‌دارندگان و خودکارسازی است. مسدودکننده‌هایی که PR دارند ادغام می‌شوند؛ موارد بدون PR ممکن است بااین‌حال منتشر شوند.
6. سکوت به‌معنای سبزبودن وضعیت است. ازدست‌دادن این بازه معمولاً به این معناست که اصلاح شما در چرخه بعدی وارد می‌شود.

## گام‌های بعدی

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" icon="messages-square" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" icon="cpu" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهنده مدل بسازید
  </Card>
  <Card title="Pluginهای بک‌اند CLI" icon="terminal" href="/fa/plugins/cli-backend-plugins">
    یک بک‌اند محلی CLI هوش مصنوعی ثبت کنید
  </Card>
  <Card title="نمای کلی SDK" icon="book-open" href="/fa/plugins/sdk-overview">
    مرجع نگاشت واردسازی و API ثبت
  </Card>
  <Card title="ابزارهای کمکی زمان اجرا" icon="settings" href="/fa/plugins/sdk-runtime">
    تبدیل متن به گفتار، جست‌وجو و عامل فرعی از طریق api.runtime
  </Card>
  <Card title="آزمایش" icon="test-tubes" href="/fa/plugins/sdk-testing">
    ابزارها و الگوهای آزمایش
  </Card>
  <Card title="مانیفست Plugin" icon="file-json" href="/fa/plugins/manifest">
    مرجع کامل طرح‌واره مانیفست
  </Card>
</CardGroup>

## مرتبط

- [هوک‌های Plugin](/fa/plugins/hooks)
- [معماری Plugin](/fa/plugins/architecture)
