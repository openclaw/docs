---
read_when:
    - به امضای نوع دقیق `defineToolPlugin`، `definePluginEntry` یا `defineChannelPluginEntry` نیاز دارید
    - می‌خواهید حالت ثبت را درک کنید (کامل در برابر راه‌اندازی در برابر فرادادهٔ CLI)
    - در حال بررسی گزینه‌های نقطه ورود هستید
sidebarTitle: Entry Points
summary: مرجع defineToolPlugin، definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورود Plugin
x-i18n:
    generated_at: "2026-07-16T17:31:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK برای
هر شکل ورودی یک تابع کمکی فراهم می‌کند: `defineToolPlugin`، `definePluginEntry`،
`defineChannelPluginEntry`، `defineSetupPluginEntry`.

<Tip>
  **دنبال یک راهنمای گام‌به‌گام هستید؟** برای راهنماهای مرحله‌به‌مرحله به [Pluginهای ابزار](/fa/plugins/tool-plugins)،
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) یا
  [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) مراجعه کنید.
</Tip>

## ورودی‌های بسته

Pluginهای نصب‌شده، فیلدهای `package.json` `openclaw` را هم به ورودی‌های منبع و
هم به ورودی‌های ساخته‌شده ارجاع می‌دهند:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` و `setupEntry` ورودی‌های منبع هستند و برای توسعه در workspace و
  checkout گیت استفاده می‌شوند.
- `runtimeExtensions` و `runtimeSetupEntry` برای بسته‌های
  نصب‌شده ترجیح داده می‌شوند: آن‌ها به بسته‌های npm امکان می‌دهند از کامپایل TypeScript در زمان اجرا صرف‌نظر کنند.
- `runtimeExtensions` در صورت وجود، باید از نظر طول آرایه با `extensions` مطابقت داشته باشد
  (ورودی‌ها براساس موقعیت جفت می‌شوند). `runtimeSetupEntry` به `setupEntry` نیاز دارد.
- اگر یک مصنوع `runtimeExtensions`/`runtimeSetupEntry` اعلام شده اما
  موجود نباشد، نصب/کشف با خطای بسته‌بندی شکست می‌خورد؛ OpenClaw
  بی‌سروصدا به منبع بازنمی‌گردد. بازگشت به منبع (در ادامه) فقط زمانی اعمال می‌شود که
  هیچ ورودی زمان اجرایی اعلام نشده باشد.
- اگر یک بسته نصب‌شده فقط یک ورودی منبع TypeScript اعلام کند، OpenClaw
  به‌دنبال همتای ساخته‌شده متناظر `dist/*.js` (یا `.mjs`/`.cjs`) می‌گردد و از آن استفاده می‌کند؛
  در غیر این صورت به منبع TypeScript بازمی‌گردد.
- همه مسیرهای ورودی باید درون دایرکتوری بسته plugin باقی بمانند. ورودی‌های زمان اجرا
  و همتاهای استنباط‌شده JS ساخته‌شده، مسیر منبع `extensions` یا
  `setupEntry` را که از دایرکتوری خارج می‌شود معتبر نمی‌کنند.

## `defineToolPlugin`

**واردسازی:** `openclaw/plugin-sdk/tool-plugin`

برای pluginهایی که فقط ابزارهای عامل را اضافه می‌کنند. منبع را کوچک نگه می‌دارد، نوع‌های پیکربندی
و پارامتر ابزار را از طرح‌واره‌های TypeBox استنباط می‌کند، مقادیر بازگشتی ساده را در
قالب نتیجه ابزار OpenClaw می‌پیچد و فراداده ایستایی را ارائه می‌دهد که
`openclaw plugins build` در مانیفست plugin می‌نویسد (`contracts.tools`،
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` اختیاری است؛ حذف آن از یک طرح‌واره سخت‌گیرانه شیء خالی استفاده می‌کند
  (مانیفست تولیدشده همچنان شامل `configSchema` است).
- `execute` یک رشته ساده یا مقدار قابل سریال‌سازی به JSON برمی‌گرداند؛ تابع کمکی
  آن را به‌صورت یک نتیجه ابزار متنی می‌پیچد و `details` را روی مقدار بازگشتی اصلی
  (تبدیل‌نشده به رشته) تنظیم می‌کند.
- برای نتایج ابزار سفارشی، `openclaw/plugin-sdk/tool-results`
  `textResult` و `jsonResult` را صادر می‌کند.
- نام ابزارها ایستا است، بنابراین `openclaw plugins build`
  `contracts.tools` را بدون تکرار دستی نام‌ها از ابزارهای اعلام‌شده استخراج می‌کند.
- بارگذاری زمان اجرا سخت‌گیرانه باقی می‌ماند: pluginهای نصب‌شده همچنان به
  `openclaw.plugin.json` و `package.json` `openclaw.extensions` نیاز دارند. OpenClaw
  هرگز برای استنباط داده‌های مفقود مانیفست، کد plugin را اجرا نمی‌کند.

## `definePluginEntry`

**واردسازی:** `openclaw/plugin-sdk/plugin-entry`

برای pluginهای ارائه‌دهنده، pluginهای ابزار پیشرفته، pluginهای hook و هر چیزی که
یک کانال پیام‌رسانی **نیست**.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| فیلد                     | نوع                                                             | الزامی | پیش‌فرض             |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | بله      | -                   |
| `name`                    | `string`                                                         | بله      | -                   |
| `description`             | `string`                                                         | بله      | -                   |
| `kind`                    | `string` (منسوخ، ادامه را ببینید)                                 | خیر       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | طرح‌واره شیء خالی |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | خیر       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | خیر       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | خیر       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | بله      | -                   |

- `id` باید با مانیفست `openclaw.plugin.json` شما مطابقت داشته باشد.
- کاتالوگ‌های نشست خارجی از
  `openclaw/plugin-sdk/session-catalog` و
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })` استفاده می‌کنند.
  هسته مالک متدهای Gateway در `sessions.catalog.*` است؛ ارائه‌دهندگان بدون ثبت RPCها،
  نگاشت‌های میزبان، نشست و رونوشت نرمال‌شده را برمی‌گردانند.
- `kind` منسوخ شده است: به‌جای آن یک جایگاه انحصاری (`"memory"` یا
  `"context-engine"`) را در فیلد `kind` مانیفست `openclaw.plugin.json`
  اعلام کنید. `kind` در ورودی زمان اجرا فقط به‌عنوان راهکار بازگشتی سازگاری برای
  pluginهای قدیمی‌تر باقی می‌ماند.
- `configSchema` می‌تواند برای ارزیابی تنبل یک تابع باشد. OpenClaw طرح‌واره را
  در نخستین دسترسی حل و ذخیره می‌کند، بنابراین سازنده‌های پرهزینه طرح‌واره فقط
  یک‌بار اجرا می‌شوند.
- یک توصیف‌گر `nodeHostCommands` می‌تواند `isAvailable({ config, env })` را تعریف کند.
  بازگرداندن `false` آن فرمان و قابلیت آن را از اعلامیه Gateway مربوط به Node
  بدون رابط حذف می‌کند. OpenClaw آن را براساس پیکربندی راه‌اندازی محلی Node
  ارزیابی می‌کند؛ کنترل‌گرهای فرمان همچنان باید هنگام فراخوانی، دردسترس‌بودن را
  اعتبارسنجی کنند.

## `defineChannelPluginEntry`

**واردسازی:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با سیم‌کشی مختص کانال می‌پیچد: به‌طور خودکار
`api.registerChannel({ plugin })` را فراخوانی می‌کند، یک درگاه فراداده اختیاری CLI برای راهنمای ریشه
ارائه می‌دهد و `registerFull` را براساس حالت ثبت محدود می‌کند.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| فیلد                 | نوع                                                             | الزامی | پیش‌فرض             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | بله      | -                   |
| `name`                | `string`                                                         | بله      | -                   |
| `description`         | `string`                                                         | بله      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | بله      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | طرح‌واره شیء خالی |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | خیر       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | خیر       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | خیر       | -                   |

فراخوان‌های برگشتی در هر حالت ثبت اجرا می‌شوند (جدول کامل در
[حالت ثبت](#registration-mode)):

- `setRuntime` در همه حالت‌ها به‌جز `"cli-metadata"` و
  `"tool-discovery"` اجرا می‌شود. ارجاع زمان اجرا را در اینجا ذخیره کنید؛ معمولاً از طریق
  `createPluginRuntimeStore`.
- `registerCliMetadata` برای `"cli-metadata"`، `"discovery"` و
  `"full"` اجرا می‌شود. از آن به‌عنوان مکان مرجع برای توصیف‌گرهای CLI متعلق به کانال
  استفاده کنید تا راهنمای ریشه فعال‌سازی انجام ندهد، snapshotهای کشف شامل
  فراداده ایستای فرمان باشند و ثبت عادی CLI با بارگذاری کامل
  plugin سازگار بماند.
- `registerFull` فقط برای `"full"` و `"tool-discovery"` اجرا می‌شود. برای
  `"tool-discovery"`، این تابع _به‌جای_ ثبت کانال اجرا می‌شود: OpenClaw
  `registerChannel`/`setRuntime` را کاملاً نادیده می‌گیرد و فقط
  `registerFull` را فراخوانی می‌کند؛ بنابراین هر ثبت ارائه‌دهنده/ابزاری که کانال شما برای
  کشف یا اجرای مستقل ابزار نیاز دارد باید در همان‌جا قرار گیرد، نه پشت
  راه‌اندازی عادی کانال.
- ثبت کشف فعال‌کننده نیست، اما بدون واردسازی هم نیست: OpenClaw ممکن است
  ورودی plugin مورد اعتماد و ماژول plugin کانال را برای ساخت
  snapshot ارزیابی کند. واردسازی‌های سطح بالا را بدون اثر جانبی نگه دارید و socketها،
  clientها، workerها و serviceها را پشت مسیرهای مختص `"full"` قرار دهید.
- همانند `definePluginEntry`، `configSchema` می‌تواند یک کارخانه تنبل باشد؛ OpenClaw
  طرح‌واره حل‌شده را در نخستین دسترسی ذخیره می‌کند.

ثبت CLI:

- برای فرمان‌های ریشه CLI متعلق به plugin که می‌خواهید به‌صورت تنبل بارگذاری شوند
  بدون آنکه از درخت تجزیه CLI ریشه ناپدید شوند، از `api.registerCli(..., { descriptors: [...] })` استفاده کنید.
  نام توصیف‌گرها باید فقط با حروف، اعداد، خط تیره و زیرخط مطابقت داشته و با یک حرف یا
  عدد آغاز شوند؛ OpenClaw شکل‌های دیگر را رد می‌کند و پیش از نمایش راهنما،
  توالی‌های کنترل ترمینال را از توضیحات حذف می‌کند. همه ریشه‌های فرمان سطح بالایی را که
  ثبت‌کننده ارائه می‌دهد پوشش دهید.
  `commands` به‌تنهایی در مسیر سازگاری بارگذاری مشتاق باقی می‌ماند.
- برای فرمان‌های قابلیت Node جفت‌شده از `api.registerNodeCliFeature(...)` استفاده کنید تا
  زیر `openclaw nodes` قرار گیرند (معادل
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- برای سایر فرمان‌های تو‌در‌توی plugin، `parentPath` را اضافه کنید و فرمان‌ها را
  روی شیء `program` ارسال‌شده به ثبت‌کننده ثبت کنید؛ OpenClaw پیش از
  فراخوانی plugin، آن را به فرمان والد حل می‌کند.
- برای pluginهای کانال، توصیف‌گرهای CLI را از `registerCliMetadata`
  ثبت کنید و `registerFull` را بر کارهای مختص زمان اجرا متمرکز نگه دارید.
- اگر `registerFull` متدهای RPC مربوط به Gateway را نیز ثبت می‌کند، آن‌ها را روی یک
  پیشوند مختص plugin نگه دارید. فضای‌نام‌های مدیریتی رزروشده هسته (`config.*`،
  `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به
  `operator.admin` تبدیل اجباری می‌شوند.

## `defineSetupPluginEntry`

**واردسازی:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک‌وزن `setup-entry.ts`. فقط `{ plugin }` را بدون
سیم‌کشی زمان اجرا یا CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw هنگامی‌که یک کانال غیرفعال یا پیکربندی‌نشده باشد، یا بارگذاری معوق فعال باشد، این ورودی را به‌جای ورودی کامل بارگذاری می‌کند.
برای آگاهی از موارد اهمیت این موضوع، به
[راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup#setup-entry) مراجعه کنید.

`defineSetupPluginEntry(...)` را با خانواده‌های محدودِ راهنمای راه‌اندازی همراه کنید:

| وارد کردن                              | کاربرد                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | راهنماهای ایمن برای زمان اجرا در راه‌اندازی: `createSetupTranslator`، آداپتورهای وصله راه‌اندازی ایمن برای وارد کردن، خروجی یادداشت جست‌وجو، `promptResolvedAllowFrom`، `splitSetupEntries`، پراکسی‌های واگذارشده راه‌اندازی |
| `openclaw/plugin-sdk/channel-setup` | سطوح راه‌اندازی نصب اختیاری                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | راهنماهای CLI، بایگانی و مستندات برای راه‌اندازی/نصب                                                                                                                                       |

SDKهای سنگین، ثبت CLI و سرویس‌های زمان اجرای طولانی‌مدت را در
ورودی کامل نگه دارید.

کانال‌های فضای کاری همراه که سطوح راه‌اندازی و زمان اجرا را از هم جدا می‌کنند، می‌توانند به‌جای آن از
`defineBundledChannelSetupEntry(...)` در
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. این امکان را فراهم می‌کند که ورودی راه‌اندازی،
خروجی‌های Plugin/اسرارِ ایمن برای راه‌اندازی را حفظ کند و در عین حال یک تنظیم‌کننده زمان اجرا
ارائه دهد:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* مسیر ایمن برای راه‌اندازی */
      },
    });
  },
});
```

فقط زمانی از این استفاده کنید که یک جریان راه‌اندازی واقعاً پیش از بارگذاری ورودی کامل کانال،
به یک تنظیم‌کننده سبک زمان اجرا یا سطح Gateway ایمن برای راه‌اندازی نیاز داشته باشد.
`registerSetupRuntime` فقط برای بارگذاری‌های `"setup-runtime"` اجرا می‌شود؛ آن را
به مسیرها یا متدهای صرفاً پیکربندی محدود کنید که باید پیش از فعال‌سازی کامل معوق
وجود داشته باشند.

## حالت ثبت

`api.registrationMode` به Plugin شما اعلام می‌کند که چگونه بارگذاری شده است:

| حالت               | زمان                                               | موارد قابل ثبت                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | راه‌اندازی عادی Gateway                             | همه‌چیز                                                                                                              |
| `"discovery"`      | کشف قابلیت فقط‌خواندنی                     | ثبت کانال به‌همراه توصیفگرهای ایستای CLI؛ کد ورودی می‌تواند بارگذاری شود، اما سوکت‌ها، workerها، کلاینت‌ها و سرویس‌ها را نادیده بگیرید |
| `"tool-discovery"` | بارگذاری محدود برای فهرست‌کردن یا اجرای ابزارهای Pluginهای مشخص | فقط ثبت قابلیت/ابزار؛ بدون فعال‌سازی کانال                                                                |
| `"setup-only"`     | کانال غیرفعال/پیکربندی‌نشده                      | فقط ثبت کانال                                                                                               |
| `"setup-runtime"`  | جریان راه‌اندازی با زمان اجرای در دسترس                  | ثبت کانال به‌همراه فقط زمان اجرای سبکی که پیش از بارگذاری ورودی کامل لازم است                               |
| `"cli-metadata"`   | دریافت فراداده راهنمای ریشه / CLI                   | فقط توصیفگرهای CLI                                                                                                    |

`defineChannelPluginEntry` این جداسازی را به‌طور خودکار مدیریت می‌کند. اگر برای یک کانال مستقیماً از
`definePluginEntry` استفاده می‌کنید، خودتان حالت را بررسی کنید و به یاد داشته باشید که
`"tool-discovery"` ثبت کانال را نادیده می‌گیرد:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // فقط سطوح قابلیت (ارائه‌دهندگان/ابزارها) را ثبت کنید، بدون کانال.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // ثبت‌های سنگینِ مختص زمان اجرا
  api.registerService(/* ... */);
}
```

سرویس‌های طولانی‌مدت می‌توانند رویدادهای کوچک ابطال یا چرخه حیات را از طریق
زمینه سرویس خود منتشر کنند:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw این مورد را با فضای نام `plugin.<plugin-id>.changed` ثبت می‌کند. نام رویدادها یک
بخش با حروف کوچک هستند، payloadها باید JSON با اندازه محدود باشند و scope باید
`operator.read`، `operator.write` یا `operator.admin` باشد. منتشرکننده فقط
در طول عمر سرویس وجود دارد و پس از توقف یا شروع ناموفق لغو می‌شود. payloadهای
نسخه یا ابطال را به رکوردهای کامل ترجیح دهید تا کلاینت‌های مجاز، وضعیت مرجع را
از طریق متدهای محدود Gateway متعلق به Plugin دوباره بخوانند.

حالت کشف، یک تصویر لحظه‌ای غیرفعال‌کننده از رجیستری می‌سازد. این حالت ممکن است همچنان
ورودی Plugin و شیء Plugin کانال را ارزیابی کند تا OpenClaw بتواند
قابلیت‌های کانال و توصیفگرهای ایستای CLI را ثبت کند. ارزیابی ماژول در حالت کشف را
قابل اعتماد اما سبک در نظر بگیرید: هیچ کلاینت شبکه، زیرپردازش، listener، اتصال پایگاه داده،
worker پس‌زمینه، خواندن اعتبارنامه یا اثر جانبی زنده دیگری در سطح بالا وجود نداشته باشد.

`"setup-runtime"` را بازه‌ای در نظر بگیرید که طی آن سطوح شروعِ مختص راه‌اندازی باید
بدون ورود دوباره به زمان اجرای کامل کانال همراه وجود داشته باشند. موارد مناسب شامل
ثبت کانال، مسیرهای HTTP ایمن برای راه‌اندازی، متدهای Gateway ایمن برای راه‌اندازی
و راهنماهای واگذارشده راه‌اندازی هستند. سرویس‌های سنگین پس‌زمینه، ثبت‌کننده‌های CLI و
راه‌اندازی اولیه SDKهای ارائه‌دهنده/کلاینت همچنان به `"full"` تعلق دارند.

## شکل‌های Plugin

OpenClaw، Pluginهای بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها طبقه‌بندی می‌کند:

| شکل                 | توضیحات                                        |
| --------------------- | -------------------------------------------------- |
| **قابلیت ساده**  | یک نوع قابلیت (برای مثال، فقط ارائه‌دهنده)           |
| **قابلیت ترکیبی** | چند نوع قابلیت (برای مثال، ارائه‌دهنده + گفتار) |
| **فقط hook**         | فقط hookها، بدون قابلیت                        |
| **فاقد قابلیت**    | ابزارها/فرمان‌ها/سرویس‌ها، اما بدون قابلیت        |

برای مشاهده شکل یک Plugin از `openclaw plugins inspect <id>` استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) - API ثبت و مرجع زیرمسیر
- [راهنماهای زمان اجرا](/fa/plugins/sdk-runtime) - `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) - manifest، ورودی راه‌اندازی، بارگذاری معوق
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت شیء `ChannelPlugin`
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ثبت ارائه‌دهنده و hookها
