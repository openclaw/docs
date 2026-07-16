---
read_when:
    - می‌خواهید یک Plugin ساده برای OpenClaw بسازید که فقط ابزارهایی را به عامل اضافه کند
    - می‌خواهید به‌جای نوشتن دستی فرادادهٔ مانیفست Plugin، از defineToolPlugin استفاده کنید
    - باید یک Plugin صرفاً ابزاری را چارچوب‌بندی، تولید، اعتبارسنجی، آزمایش یا منتشر کنید
sidebarTitle: Tool Plugins
summary: ابزارهای ساده و نوع‌دار عامل را با `defineToolPlugin` و `openclaw plugins init/build/validate` بسازید
title: Pluginهای ابزار
x-i18n:
    generated_at: "2026-07-16T17:34:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` افزونه‌ای می‌سازد که فقط ابزارهای قابل‌فراخوانی توسط عامل را اضافه می‌کند: بدون
کانال، ارائه‌دهنده مدل، هوک، سرویس یا بک‌اند راه‌اندازی. این دستور فراداده مانیفستی را
تولید می‌کند که OpenClaw برای کشف ابزارها بدون بارگذاری کد زمان اجرای افزونه به آن
نیاز دارد.

برای افزونه‌های ارائه‌دهنده، کانال، هوک، سرویس یا افزونه‌های دارای قابلیت‌های ترکیبی، به‌جای آن با
[ساخت افزونه‌ها](/fa/plugins/building-plugins)، [افزونه‌های کانال](/fa/plugins/sdk-channel-plugins)،
یا [افزونه‌های ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) شروع کنید.

## الزامات

- Node 22.22.3+، Node 24.15+ یا Node 25.9+.
- خروجی بسته TypeScript ESM.
- `typebox` در `dependencies` (نه فقط `devDependencies`؛ افزونه تولیدشده
  آن را در زمان اجرا وارد می‌کند).
- `openclaw >=2026.5.17`، نخستین نسخه‌ای که
  `openclaw/plugin-sdk/tool-plugin` را صادر می‌کند.
- ریشه بسته‌ای که `dist/`، `openclaw.plugin.json` و
  `package.json` را ارائه می‌کند.

## شروع سریع

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` موارد زیر را داربست‌بندی می‌کند:

| فایل                   | هدف                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | ورودی `defineToolPlugin` با یک ابزار `echo`                     |
| `src/index.test.ts`    | آزمون فراداده برای بررسی فهرست ابزارها                             |
| `tsconfig.json`        | خروجی TypeScript با NodeNext در `dist/`                             |
| `vitest.config.ts`     | پیکربندی Vitest برای `src/**/*.test.ts`                              |
| `package.json`         | اسکریپت‌ها، وابستگی‌های زمان اجرا، `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | فراداده مانیفست تولیدشده برای ابزار اولیه                  |

`npm run plugin:build` ابتدا `npm run build` (tsc) و سپس
`openclaw plugins build --entry ./dist/index.js` را اجرا می‌کند. `npm run plugin:validate`
دوباره می‌سازد و `openclaw plugins validate --entry ./dist/index.js` را اجرا می‌کند.
اعتبارسنجی موفق این پیام را چاپ می‌کند:

```text
افزونه stock-quotes معتبر است.
```

گزینه‌های `openclaw plugins init <id>`:

| پرچم                 | پیش‌فرض            | اثر                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | پوشه خروجی                       |
| `--name <name>`      | `<id>` با حروف عنوانی | نام نمایشی                           |
| `--type <type>`      | `tool`             | نوع داربست: `tool` یا `provider`    |
| `--force`            | غیرفعال                | بازنویسی پوشه خروجی موجود |

## نوشتن ابزار

`defineToolPlugin` هویت افزونه، یک طرح‌واره پیکربندی اختیاری و یک
فهرست ایستای ابزارها را می‌گیرد. نوع پارامترها و پیکربندی از
طرح‌واره‌های TypeBox استنتاج می‌شود.

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
به‌اندازه کافی مشخص باشند تا با ابزارهای هسته یا افزونه‌های دیگر تداخل نکنند.

## ابزارهای اختیاری و کارخانه‌ای

زمانی `optional: true` را تنظیم کنید که کاربران باید پیش از ارسال ابزار به مدل، آن را
صراحتاً در فهرست مجاز قرار دهند. `openclaw plugins build` ورودی مانیفست متناظر
`toolMetadata.<tool>.optional` را می‌نویسد تا OpenClaw بتواند بدون بارگذاری کد زمان اجرای افزونه
اختیاری بودن ابزار را تشخیص دهد.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

زمانی از `factory` استفاده کنید که ابزار پیش از ساخته‌شدن به زمینه ابزار زمان اجرا نیاز دارد؛
برای انصراف در یک اجرای خاص، بررسی وضعیت سندباکس یا اتصال
کمک‌کننده‌های زمان اجرا. با اینکه ابزار واقعی در زمان اجرا ساخته می‌شود،
فراداده ایستا باقی می‌ماند.

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

کارخانه‌ها همچنان نام ثابتی را از پیش برای ابزار اعلام می‌کنند. زمانی مستقیماً از `definePluginEntry`
استفاده کنید که افزونه نام ابزارها را به‌صورت پویا محاسبه می‌کند یا ابزارها را
با هوک‌ها، سرویس‌ها، ارائه‌دهندگان یا فرمان‌ها ترکیب می‌کند.

## مقادیر بازگشتی

`defineToolPlugin` مقادیر بازگشتی ساده را در قالب نتیجه ابزار OpenClaw
بسته‌بندی می‌کند:

- زمانی رشته برگردانید که مدل باید دقیقاً همان متن را ببیند.
- زمانی مقداری سازگار با JSON برگردانید که می‌خواهید مدل JSON قالب‌بندی‌شده را ببیند
  و OpenClaw مقدار اصلی را در `details` نگه دارد.

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

زمانی از ابزار کارخانه‌ای استفاده کنید که به یک `AgentToolResult` سفارشی نیاز دارید یا می‌خواهید از
پیاده‌سازی موجود `api.registerTool` دوباره استفاده کنید.

## پیکربندی

`configSchema` اختیاری است. آن را حذف کنید تا OpenClaw یک طرح‌واره سخت‌گیرانه شیء خالی
اعمال کند؛ مانیفست تولیدشده همچنان شامل `configSchema` خواهد بود.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

با یک `configSchema`، نوع آرگومان دوم `execute` از آن استنتاج می‌شود:

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

OpenClaw پیکربندی افزونه را از ورودی آن افزونه در پیکربندی Gateway می‌خواند.
اطلاعات محرمانه را در کد منبع یا نمونه‌های مستندات به‌صورت ثابت ننویسید؛ مطابق مدل امنیتی افزونه
از پیکربندی، متغیرهای محیطی یا SecretRefها استفاده کنید.

## فراداده تولیدشده

OpenClaw باید پیش از واردکردن کد زمان اجرای افزونه، مانیفست افزونه را بخواند.
`defineToolPlugin` فراداده ایستا را برای این کار ارائه می‌کند و
`openclaw plugins build` آن را در بسته می‌نویسد. پس از تغییر شناسه، نام، توضیحات، طرح‌واره پیکربندی، فعال‌سازی یا نام ابزارهای
افزونه، مولد را دوباره اجرا کنید:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

مانیفست تولیدشده برای افزونه‌ای با یک ابزار:

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

`contracts.tools` قرارداد مهم کشف است: به OpenClaw می‌گوید کدام
افزونه مالک هر ابزار است، بدون اینکه زمان اجرای همه افزونه‌های نصب‌شده بارگذاری شود. مانیفست
قدیمی باعث می‌شود ابزاری در کشف ظاهر نشود یا خطای ثبت به‌اشتباه به افزونه دیگری
نسبت داده شود.

## فراداده بسته

`openclaw plugins build` همچنین `package.json` را با ورودی زمان اجرای انتخاب‌شده
هم‌راستا می‌کند:

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

JavaScript ساخته‌شده (`./dist/index.js`) را ارائه کنید، نه ورودی کد منبع TypeScript.
ورودی‌های کد منبع فقط برای توسعه محلی در فضای کاری عمل می‌کنند.

## اعتبارسنجی در CI

اگر فراداده تولیدشده قدیمی باشد، `plugins build --check` بدون بازنویسی فایل‌ها
با شکست مواجه می‌شود:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` بررسی می‌کند که:

- `openclaw.plugin.json` وجود داشته باشد و از بارگذار عادی مانیفست عبور کند.
- ورودی فعلی فراداده `defineToolPlugin` را صادر کند.
- فیلدهای مانیفست تولیدشده با فراداده ورودی مطابقت داشته باشند.
- `contracts.tools` با نام ابزارهای اعلام‌شده مطابقت داشته باشد.
- `package.json`، `openclaw.extensions` را به ورودی زمان اجرای انتخاب‌شده اشاره دهد.

## نصب و بررسی محلی

از یک نسخه جداگانه OpenClaw یا CLI نصب‌شده، مسیر بسته را نصب کنید:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

برای آزمون دود بسته‌بندی‌شده، ابتدا بسته را بسازید و tarball را نصب کنید:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

پس از نصب، Gateway را راه‌اندازی مجدد یا بازبارگذاری کنید و از عامل بخواهید از
ابزار استفاده کند. اگر ابزار قابل‌مشاهده نیست، پیش از تغییر کد، زمان اجرای افزونه و کاتالوگ مؤثر
ابزار را بررسی کنید (به [عیب‌یابی](#troubleshooting) مراجعه کنید).

## انتشار

پس از آماده‌شدن بسته، آن را از طریق ClawHub منتشر کنید. `clawhub package publish`
یک منبع می‌گیرد: پوشه محلی، مخزن GitHub (`owner/repo[@ref]`) یا
نشانی URL یک tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

با یک مکان‌یاب صریح ClawHub نصب کنید:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

در دوره گذار عرضه، مشخصات ساده بسته npm همچنان از npm نصب می‌شوند، اما
ClawHub سطح ترجیحی کشف و توزیع برای افزونه‌های OpenClaw است.
برای دامنه مالک و بازبینی انتشار، به [انتشار در ClawHub](/fa/clawhub/publishing) مراجعه کنید.

## عیب‌یابی

### `plugin entry not found: ./dist/index.js`

فایل ورودی انتخاب‌شده وجود ندارد. `npm run build` را اجرا کنید، سپس
`openclaw plugins build --entry ./dist/index.js` یا
`openclaw plugins validate --entry ./dist/index.js` را دوباره اجرا کنید.

### `plugin entry does not expose defineToolPlugin metadata`

ورودی، مقداری ساخته‌شده توسط `defineToolPlugin` را صادر نکرد. تأیید کنید که
صادرات پیش‌فرض ماژول، نتیجه `defineToolPlugin(...)` است یا ورودی
صحیح را با `--entry` ارسال کنید.

### `openclaw.plugin.json generated metadata is stale`

مانیفست دیگر با فراداده ورودی مطابقت ندارد. اجرا کنید:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

تغییرات هر دو `openclaw.plugin.json` و `package.json` را ثبت کنید.

### `package.json openclaw.extensions must include ./dist/index.js`

فراداده بسته به ورودی زمان اجرای دیگری اشاره می‌کند.
`openclaw plugins build --entry ./dist/index.js` را اجرا کنید تا مولد،
فراداده بسته را با ورودی‌ای که قصد ارائه آن را دارید هم‌راستا کند.

### `Cannot find package 'typebox'`

افزونه ساخته‌شده در زمان اجرا `typebox` را وارد می‌کند. آن را در `dependencies`
نگه دارید، دوباره نصب و ساخته و اعتبارسنجی را مجدداً اجرا کنید.

### ابزار پس از نصب ظاهر نمی‌شود

این موارد را به‌ترتیب بررسی کنید:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` دارای `contracts.tools` با نام‌های مورد انتظار ابزارها است.
4. `package.json` دارای `openclaw.extensions: ["./dist/index.js"]` است.
5. Gateway پس از نصب Plugin بازراه‌اندازی یا بازخوانی شده است.

## همچنین ببینید

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [زیرمسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths)
- [مانیفست Plugin](/fa/plugins/manifest)
- [CLI مربوط به Pluginها](/fa/cli/plugins)
- [انتشار در ClawHub](/fa/clawhub/publishing)
