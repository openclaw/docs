---
read_when:
    - می‌خواهید یک Plugin ساده برای OpenClaw بسازید که فقط ابزارهایی به عامل اضافه کند
    - می‌خواهید به‌جای نوشتن دستی فرادادهٔ مانیفست Plugin، از defineToolPlugin استفاده کنید
    - باید یک Plugin صرفاً ابزاری را چارچوب‌بندی، تولید، اعتبارسنجی، آزمایش یا منتشر کنید
sidebarTitle: Tool Plugins
summary: ابزارهای ساده و نوع‌دار عامل را با defineToolPlugin و openclaw plugins init/build/validate بسازید
title: Pluginهای ابزار
x-i18n:
    generated_at: "2026-07-12T10:41:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` یک Plugin می‌سازد که فقط ابزارهای قابل فراخوانی توسط عامل را اضافه می‌کند: بدون
کانال، ارائه‌دهنده مدل، هوک، سرویس یا بک‌اند راه‌اندازی. این تابع فراداده مانیفستی را
تولید می‌کند که OpenClaw برای کشف ابزارها بدون بارگذاری کد زمان اجرای Plugin
به آن نیاز دارد.

برای Pluginهای ارائه‌دهنده، کانال، هوک، سرویس یا دارای قابلیت‌های ترکیبی، به‌جای آن با
[ساخت Pluginها](/fa/plugins/building-plugins)، [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)،
یا [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) شروع کنید.

## الزامات

- Node 22.19+، Node 23.11+ یا Node 24+.
- خروجی بسته TypeScript ESM.
- `typebox` در `dependencies` (نه فقط در `devDependencies`، زیرا Plugin تولیدشده
  آن را در زمان اجرا وارد می‌کند).
- `openclaw >=2026.5.17`، نخستین نسخه‌ای که
  `openclaw/plugin-sdk/tool-plugin` را صادر می‌کند.
- ریشه بسته‌ای که `dist/`، `openclaw.plugin.json` و
  `package.json` را منتشر می‌کند.

## شروع سریع

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` این ساختار اولیه را ایجاد می‌کند:

| فایل                   | هدف                                                               |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | ورودی `defineToolPlugin` با یک ابزار `echo`                       |
| `src/index.test.ts`    | آزمون فراداده برای بررسی فهرست ابزارها                            |
| `tsconfig.json`        | خروجی TypeScript از نوع NodeNext در `dist/`                       |
| `vitest.config.ts`     | پیکربندی Vitest برای `src/**/*.test.ts`                           |
| `package.json`         | اسکریپت‌ها، وابستگی‌های زمان اجرا، `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | فراداده مانیفست تولیدشده برای ابزار اولیه                         |

`npm run plugin:build` ابتدا `npm run build` (tsc) و سپس
`openclaw plugins build --entry ./dist/index.js` را اجرا می‌کند. `npm run plugin:validate`
دوباره می‌سازد و `openclaw plugins validate --entry ./dist/index.js` را اجرا می‌کند.
اعتبارسنجی موفق این پیام را چاپ می‌کند:

```text
Plugin stock-quotes is valid.
```

گزینه‌های `openclaw plugins init <id>`:

| پرچم                 | پیش‌فرض             | اثر                                    |
| -------------------- | ------------------- | -------------------------------------- |
| `--directory <path>` | `<id>`              | پوشه خروجی                             |
| `--name <name>`      | `<id>` با حروف عنوانی | نام نمایشی                           |
| `--type <type>`      | `tool`              | نوع ساختار اولیه: `tool` یا `provider` |
| `--force`            | خاموش               | بازنویسی پوشه خروجی موجود              |

## نوشتن یک ابزار

`defineToolPlugin` هویت Plugin، یک طرح‌واره پیکربندی اختیاری و یک
فهرست ایستا از ابزارها را می‌گیرد. نوع پارامترها و پیکربندی از
طرح‌واره‌های TypeBox استنتاج می‌شوند.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

نام ابزارها API پایدار هستند. نام‌هایی را انتخاب کنید که یکتا، با حروف کوچک و
به‌اندازه کافی مشخص باشند تا با ابزارهای هسته یا Pluginهای دیگر تداخل نکنند.

## ابزارهای اختیاری و کارخانه‌ای

وقتی کاربران باید ابزار را پیش از ارسال به مدل، صریحاً در فهرست مجاز قرار دهند،
`optional: true` را تنظیم کنید. `openclaw plugins build` ورودی مانیفست متناظر
`toolMetadata.<tool>.optional` را می‌نویسد تا OpenClaw بدون بارگذاری کد زمان اجرای
Plugin تشخیص دهد که ابزار اختیاری است.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

وقتی ابزار پیش از ساخته‌شدن به زمینه ابزار زمان اجرا نیاز دارد، از `factory` استفاده کنید؛
برای انصراف در یک اجرای مشخص، بررسی وضعیت سندباکس یا اتصال کمک‌تابع‌های
زمان اجرا. با وجود ساخته‌شدن ابزار واقعی در زمان اجرا، فراداده ایستا باقی می‌ماند.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

کارخانه‌ها همچنان نام ثابت ابزار را از ابتدا اعلام می‌کنند. وقتی Plugin نام ابزارها را
به‌صورت پویا محاسبه می‌کند یا ابزارها را با هوک‌ها، سرویس‌ها، ارائه‌دهندگان یا فرمان‌ها
ترکیب می‌کند، مستقیماً از `definePluginEntry` استفاده کنید.

## مقادیر بازگشتی

`defineToolPlugin` مقادیر بازگشتی ساده را در قالب نتیجه ابزار OpenClaw
می‌پیچد:

- وقتی مدل باید دقیقاً همان متن را ببیند، یک رشته بازگردانید.
- وقتی می‌خواهید مدل JSON قالب‌بندی‌شده را ببیند و OpenClaw مقدار اصلی را در
  `details` نگه دارد، یک مقدار سازگار با JSON بازگردانید.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

وقتی به یک `AgentToolResult` سفارشی نیاز دارید یا می‌خواهید از پیاده‌سازی موجود
`api.registerTool` دوباره استفاده کنید، از ابزار کارخانه‌ای استفاده کنید.

## پیکربندی

`configSchema` اختیاری است. اگر آن را حذف کنید، OpenClaw یک طرح‌واره سخت‌گیرانه
شیء خالی اعمال می‌کند؛ مانیفست تولیدشده همچنان شامل `configSchema` خواهد بود.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

با وجود `configSchema`، نوع آرگومان دوم `execute` از آن استنتاج می‌شود:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw پیکربندی Plugin را از ورودی آن Plugin در پیکربندی Gateway می‌خواند.
اطلاعات محرمانه را در کد منبع یا نمونه‌های مستندات به‌صورت ثابت ننویسید؛ مطابق مدل
امنیتی Plugin از پیکربندی، متغیرهای محیطی یا SecretRefها استفاده کنید.

## فراداده تولیدشده

OpenClaw باید پیش از واردکردن کد زمان اجرای Plugin، مانیفست آن را بخواند.
`defineToolPlugin` برای این منظور فراداده ایستا ارائه می‌کند و
`openclaw plugins build` آن را در بسته می‌نویسد. پس از تغییر شناسه، نام، توضیحات،
طرح‌واره پیکربندی، فعال‌سازی یا نام ابزارهای Plugin، مولد را دوباره اجرا کنید:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

مانیفست تولیدشده برای یک Plugin تک‌ابزاری:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` قرارداد مهم کشف است: به OpenClaw می‌گوید هر ابزار متعلق به کدام
Plugin است، بدون اینکه زمان اجرای همه Pluginهای نصب‌شده بارگذاری شود. مانیفست
قدیمی ممکن است باعث شود ابزاری در کشف نمایش داده نشود یا خطای ثبت به‌اشتباه به
Plugin دیگری نسبت داده شود.

## فراداده بسته

`openclaw plugins build` همچنین `package.json` را با ورودی زمان اجرای انتخاب‌شده
هماهنگ می‌کند:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

JavaScript ساخته‌شده (`./dist/index.js`) را منتشر کنید، نه ورودی کد منبع TypeScript.
ورودی‌های منبع فقط برای توسعه محلی در فضای کاری کار می‌کنند.

## اعتبارسنجی در CI

اگر فراداده تولیدشده قدیمی باشد، `plugins build --check` بدون بازنویسی فایل‌ها
ناموفق می‌شود:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` بررسی می‌کند که:

- `openclaw.plugin.json` وجود دارد و از بارگذار عادی مانیفست عبور می‌کند.
- ورودی فعلی فراداده `defineToolPlugin` را صادر می‌کند.
- فیلدهای مانیفست تولیدشده با فراداده ورودی مطابقت دارند.
- `contracts.tools` با نام ابزارهای اعلام‌شده مطابقت دارد.
- `package.json`، مقدار `openclaw.extensions` را به ورودی زمان اجرای انتخاب‌شده
  اشاره می‌دهد.

## نصب و بررسی محلی

از یک نسخه کاری جداگانه OpenClaw یا CLI نصب‌شده، مسیر بسته را نصب کنید:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

برای آزمون دود بسته‌بندی‌شده، ابتدا بسته را ایجاد و سپس فایل tarball را نصب کنید:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

پس از نصب، Gateway را راه‌اندازی مجدد یا بازبارگذاری کنید و از عامل بخواهید از
ابزار استفاده کند. اگر ابزار قابل مشاهده نیست، پیش از تغییر کد، زمان اجرای Plugin و
کاتالوگ مؤثر ابزار را بررسی کنید (به [عیب‌یابی](#troubleshooting) مراجعه کنید).

## انتشار

پس از آماده‌شدن بسته، آن را از طریق ClawHub منتشر کنید. `clawhub package publish`
یک منبع می‌گیرد: پوشه محلی، مخزن GitHub (`owner/repo[@ref]`) یا نشانی اینترنتی
فایل tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

با یک مکان‌یاب صریح ClawHub نصب کنید:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

مشخصات ساده بسته npm در دوره گذار راه‌اندازی همچنان از npm نصب می‌شوند، اما
ClawHub سطح ترجیحی کشف و توزیع Pluginهای OpenClaw است. برای محدوده مالک و
بازبینی انتشار، به [انتشار در ClawHub](/fa/clawhub/publishing) مراجعه کنید.

## عیب‌یابی

### `plugin entry not found: ./dist/index.js`

فایل ورودی انتخاب‌شده وجود ندارد. `npm run build` را اجرا کنید، سپس
`openclaw plugins build --entry ./dist/index.js` یا
`openclaw plugins validate --entry ./dist/index.js` را دوباره اجرا کنید.

### `plugin entry does not expose defineToolPlugin metadata`

ورودی مقداری را که با `defineToolPlugin` ساخته شده باشد صادر نکرده است. تأیید کنید
که خروجی پیش‌فرض ماژول نتیجه `defineToolPlugin(...)` است، یا ورودی درست را با
`--entry` ارسال کنید.

### `openclaw.plugin.json generated metadata is stale`

مانیفست دیگر با فراداده ورودی مطابقت ندارد. اجرا کنید:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

تغییرات هر دو فایل `openclaw.plugin.json` و `package.json` را ثبت کنید.

### `package.json openclaw.extensions must include ./dist/index.js`

فراداده بسته به ورودی زمان اجرای دیگری اشاره دارد.
`openclaw plugins build --entry ./dist/index.js` را اجرا کنید تا مولد، فراداده بسته را
با ورودی‌ای که قصد انتشارش را دارید هماهنگ کند.

### `Cannot find package 'typebox'`

Plugin ساخته‌شده در زمان اجرا `typebox` را وارد می‌کند. آن را در `dependencies`
نگه دارید، دوباره نصب و ساخته و اعتبارسنجی را مجدداً اجرا کنید.

### ابزار پس از نصب نمایش داده نمی‌شود

این موارد را به‌ترتیب بررسی کنید:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. فایل `openclaw.plugin.json` شامل `contracts.tools` با نام‌های ابزار مورد انتظار است.
4. فایل `package.json` شامل `openclaw.extensions: ["./dist/index.js"]` است.
5. پس از نصب Plugin، Gateway راه‌اندازی مجدد یا بارگذاری مجدد شده است.

## همچنین ببینید

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [زیرمسیرهای SDKِ Plugin](/fa/plugins/sdk-subpaths)
- [مانیفست Plugin](/fa/plugins/manifest)
- [CLIِ Pluginها](/fa/cli/plugins)
- [انتشار در ClawHub](/fa/clawhub/publishing)
