---
read_when:
    - به امضای نوع دقیق `defineToolPlugin`، `definePluginEntry` یا `defineChannelPluginEntry` نیاز دارید
    - می‌خواهید حالت ثبت‌نام را درک کنید (کامل در برابر راه‌اندازی در برابر فرادادهٔ CLI)
    - شما در حال جست‌وجوی گزینه‌های نقطهٔ ورود هستید
sidebarTitle: Entry Points
summary: مرجع defineToolPlugin، definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورود Plugin
x-i18n:
    generated_at: "2026-06-27T18:31:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر Plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK برای ساخت آن‌ها helper فراهم می‌کند.

برای Pluginهای نصب‌شده، `package.json` باید بارگذاری runtime را، در صورت موجود بودن، به JavaScript ساخته‌شده هدایت کند:

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

`extensions` و `setupEntry` همچنان ورودی‌های منبع معتبر برای توسعه در workspace و checkout گیت هستند. وقتی OpenClaw یک بسته نصب‌شده را بارگذاری می‌کند، `runtimeExtensions` و `runtimeSetupEntry` ترجیح داده می‌شوند و به بسته‌های npm اجازه می‌دهند از کامپایل TypeScript در runtime پرهیز کنند. ورودی‌های runtime صریح الزامی هستند: `runtimeSetupEntry` به `setupEntry` نیاز دارد، و نبود artifactهای `runtimeExtensions` یا `runtimeSetupEntry` باعث شکست نصب/کشف می‌شود، نه اینکه بی‌صدا به منبع fallback کند. اگر یک بسته نصب‌شده فقط یک ورودی منبع TypeScript اعلام کند، OpenClaw ابتدا در صورت وجود از همتای ساخته‌شده مطابق `dist/*.js` استفاده می‌کند، سپس به منبع TypeScript fallback می‌کند.

همه مسیرهای ورودی باید داخل دایرکتوری بسته Plugin باقی بمانند. ورودی‌های runtime و همتاهای JavaScript ساخته‌شده استنباط‌شده، یک مسیر منبع `extensions` یا `setupEntry` خارج‌شونده را معتبر نمی‌کنند.

<Tip>
  **دنبال یک راهنمای مرحله‌به‌مرحله هستید؟** برای راهنماهای گام‌به‌گام [Pluginهای ابزار](/fa/plugins/tool-plugins)،
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)، یا
  [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) را ببینید.
</Tip>

## `defineToolPlugin`

**وارد کردن:** `openclaw/plugin-sdk/tool-plugin`

برای Pluginهای ساده‌ای که فقط ابزارهای agent اضافه می‌کنند. `defineToolPlugin` منبع authoring را کوچک نگه می‌دارد، نوع‌های پیکربندی و پارامتر ابزار را از schemaهای TypeBox استنباط می‌کند، مقدارهای بازگشتی ساده را در قالب نتیجه ابزار OpenClaw می‌پیچد، و metadata ایستا را در دسترس می‌گذارد که `openclaw plugins build` در manifest Plugin می‌نویسد.

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

- `configSchema` اختیاری است. وقتی حذف شود، OpenClaw از یک schema شیء خالی strict استفاده می‌کند و manifest تولیدشده همچنان شامل `configSchema` است.
- `execute` یک رشته ساده یا مقدار قابل serialize به JSON برمی‌گرداند. helper آن را به‌صورت یک نتیجه ابزار متنی همراه با `details` می‌پیچد.
- نام ابزارها ایستا هستند. `openclaw plugins build` مقدار `contracts.tools` را از ابزارهای اعلام‌شده استخراج می‌کند، بنابراین نویسندگان نام‌ها را دستی تکرار نمی‌کنند.
- بارگذاری runtime سخت‌گیرانه باقی می‌ماند. Pluginهای نصب‌شده همچنان به `openclaw.plugin.json` و `package.json` `openclaw.extensions` نیاز دارند؛ OpenClaw برای استنباط داده‌های manifest از دست‌رفته، کد Plugin را اجرا نمی‌کند.

## `definePluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/plugin-entry`

برای Pluginهای ارائه‌دهنده، Pluginهای ابزار پیشرفته، Pluginهای hook، و هر چیزی که کانال پیام‌رسانی **نیست**.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| فیلد          | نوع                                                              | الزامی | پیش‌فرض             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | بله      | -                   |
| `name`         | `string`                                                         | بله      | -                   |
| `description`  | `string`                                                         | بله      | -                   |
| `kind`         | `string`                                                         | خیر       | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | schema شیء خالی |
| `register`     | `(api: OpenClawPluginApi) => void`                               | بله      | -                   |

- `id` باید با manifest `openclaw.plugin.json` شما مطابقت داشته باشد.
- `kind` برای slotهای انحصاری است: `"memory"` یا `"context-engine"`.
- `configSchema` می‌تواند تابعی برای ارزیابی lazy باشد.
- OpenClaw آن schema را در اولین دسترسی resolve و memoize می‌کند، بنابراین سازنده‌های پرهزینه schema فقط یک‌بار اجرا می‌شوند.

## `defineChannelPluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با سیم‌کشی مخصوص کانال می‌پیچد. به‌طور خودکار `api.registerChannel({ plugin })` را فراخوانی می‌کند، یک seam اختیاری metadata برای CLI راهنمای ریشه ارائه می‌دهد، و `registerFull` را بر اساس حالت ثبت gate می‌کند.

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

| فیلد                 | نوع                                                              | الزامی | پیش‌فرض             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | بله      | -                   |
| `name`                | `string`                                                         | بله      | -                   |
| `description`         | `string`                                                         | بله      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | بله      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | schema شیء خالی |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | خیر       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | خیر       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | خیر       | -                   |

- `setRuntime` هنگام ثبت فراخوانی می‌شود تا بتوانید ارجاع runtime را ذخیره کنید
  (معمولاً از طریق `createPluginRuntimeStore`). هنگام capture کردن metadata در CLI نادیده گرفته می‌شود.
- `registerCliMetadata` هنگام `api.registrationMode === "cli-metadata"`،
  `api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"` اجرا می‌شود.
  از آن به‌عنوان محل canonical برای descriptorهای CLI متعلق به کانال استفاده کنید تا راهنمای ریشه غیر‌فعال‌کننده بماند، snapshotهای کشف شامل metadata فرمان ایستا باشند، و ثبت معمول فرمان CLI با بارگذاری‌های کامل Plugin سازگار بماند.
- ثبت کشف غیر‌فعال‌کننده است، نه بدون import. OpenClaw ممکن است برای ساخت snapshot، ورودی Plugin مورد اعتماد و ماژول Plugin کانال را ارزیابی کند؛ بنابراین importهای سطح بالا را بدون side effect نگه دارید و socketها، clientها، workerها و serviceها را پشت مسیرهای فقط `"full"` قرار دهید.
- `registerFull` فقط وقتی `api.registrationMode === "full"` باشد اجرا می‌شود. هنگام بارگذاری فقط setup نادیده گرفته می‌شود.
- مانند `definePluginEntry`، `configSchema` می‌تواند یک factory lazy باشد و OpenClaw schema resolve‌شده را در اولین دسترسی memoize می‌کند.
- برای فرمان‌های CLI ریشه متعلق به Plugin، وقتی می‌خواهید فرمان بدون ناپدید شدن از درخت parse ریشه CLI همچنان lazy-loaded بماند، `api.registerCli(..., { descriptors: [...] })` را ترجیح دهید.
  برای فرمان‌های feature مربوط به paired-node، `api.registerNodeCliFeature(...)` را ترجیح دهید تا فرمان زیر `openclaw nodes` قرار بگیرد.
  برای سایر فرمان‌های Plugin تودرتو، `parentPath` را اضافه کنید و فرمان‌ها را روی شیء `program` که به registrar پاس داده شده ثبت کنید؛ OpenClaw پیش از فراخوانی Plugin آن را به فرمان parent resolve می‌کند. برای Pluginهای کانال، ثبت آن descriptorها از `registerCliMetadata(...)` را ترجیح دهید و `registerFull(...)` را متمرکز بر کارهای فقط runtime نگه دارید.
- اگر `registerFull(...)` همچنین methodهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را روی prefix مخصوص Plugin نگه دارید. namespaceهای رزرو‌شده admin هسته (`config.*`،
  `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به
  `operator.admin` coerced می‌شوند.

## `defineSetupPluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک‌وزن `setup-entry.ts`. فقط `{ plugin }` را بدون سیم‌کشی runtime یا CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw وقتی یک کانال غیرفعال یا پیکربندی‌نشده باشد، یا وقتی بارگذاری deferred فعال باشد، این را به‌جای ورودی کامل بارگذاری می‌کند. برای اینکه بدانید چه زمانی مهم است، [Setup و پیکربندی](/fa/plugins/sdk-setup#setup-entry) را ببینید.

در عمل، `defineSetupPluginEntry(...)` را با خانواده‌های narrow setup helper جفت کنید:

- `openclaw/plugin-sdk/setup-runtime` برای helperهای setup امن برای runtime مانند
  `createSetupTranslator`، adapterهای patch امن برای import در setup، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و proxyهای setup واگذارشده
- `openclaw/plugin-sdk/channel-setup` برای سطح‌های setup نصب اختیاری
- `openclaw/plugin-sdk/setup-tools` برای helperهای CLI/archive/docs مربوط به setup/install

SDKهای سنگین، ثبت CLI، و serviceهای runtime بلندمدت را در ورودی کامل نگه دارید.

کانال‌های workspace bundled که سطح‌های setup و runtime را جدا می‌کنند، می‌توانند به‌جای آن از `defineBundledChannelSetupEntry(...)` از
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن contract به ورودی setup اجازه می‌دهد exportهای plugin/secrets امن برای setup را نگه دارد، در حالی که همچنان یک setter مربوط به runtime ارائه می‌کند:

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
        /* setup-safe route */
      },
    });
  },
});
```

از آن contract bundled فقط وقتی استفاده کنید که flowهای setup واقعاً پیش از بارگذاری ورودی کامل کانال به یک setter سبک‌وزن runtime یا سطح Gateway امن برای setup نیاز داشته باشند.
`registerSetupRuntime` فقط برای بارگذاری‌های `"setup-runtime"` اجرا می‌شود؛ آن را محدود به routeها یا methodهای فقط config نگه دارید که باید پیش از فعال‌سازی کامل deferred وجود داشته باشند.

## حالت ثبت

`api.registrationMode` به Plugin شما می‌گوید چگونه بارگذاری شده است:

| حالت              | زمان                              | آنچه باید ثبت شود                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | راه‌اندازی عادی Gateway            | همه‌چیز                                                                                                                  |
| `"discovery"`     | کشف قابلیت فقط‌خواندنی             | ثبت کانال به‌همراه توصیف‌گرهای CLI ایستا؛ کد ورودی ممکن است بارگذاری شود، اما سوکت‌ها، workerها، clientها و سرویس‌ها را رد کنید |
| `"setup-only"`    | کانال غیرفعال/پیکربندی‌نشده        | فقط ثبت کانال                                                                                                            |
| `"setup-runtime"` | جریان راه‌اندازی با runtime در دسترس | ثبت کانال به‌همراه فقط runtime سبک‌وزنی که پیش از بارگذاری ورودی کامل لازم است                                           |
| `"cli-metadata"`  | راهنمای ریشه / ضبط فراداده CLI     | فقط توصیف‌گرهای CLI                                                                                                      |

`defineChannelPluginEntry` این جداسازی را به‌طور خودکار مدیریت می‌کند. اگر از
`definePluginEntry` به‌طور مستقیم برای یک کانال استفاده می‌کنید، خودتان حالت را بررسی کنید:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

حالت کشف یک snapshot رجیستریِ غیرفعال‌ساز می‌سازد. همچنان ممکن است
ورودی Plugin و شیء Plugin کانال را ارزیابی کند تا OpenClaw بتواند قابلیت‌های کانال
و توصیف‌گرهای CLI ایستا را ثبت کند. ارزیابی ماژول در کشف را قابل اعتماد اما
سبک‌وزن در نظر بگیرید: هیچ client شبکه، زیرفرایند، listener، اتصال پایگاه داده،
worker پس‌زمینه، خواندن اعتبارنامه، یا دیگر اثر جانبی runtime زنده در سطح بالا نباید وجود داشته باشد.

`"setup-runtime"` را پنجره‌ای در نظر بگیرید که در آن سطح‌های startup مخصوص setup
باید بدون ورود دوباره به runtime کامل کانال باندل‌شده وجود داشته باشند. گزینه‌های مناسب شامل
ثبت کانال، routeهای HTTP امن برای setup، متدهای Gateway امن برای setup، و
helperهای setup واگذارشده هستند. سرویس‌های پس‌زمینه سنگین، ثبت‌کننده‌های CLI، و
bootstrapهای SDK مربوط به provider/client همچنان به `"full"` تعلق دارند.

به‌طور خاص برای ثبت‌کننده‌های CLI:

- زمانی از `descriptors` استفاده کنید که ثبت‌کننده مالک یک یا چند فرمان ریشه است و می‌خواهید
  OpenClaw ماژول CLI واقعی را در نخستین فراخوانی به‌صورت lazy-load بارگذاری کند
- مطمئن شوید آن توصیف‌گرها همه ریشه‌های فرمان سطح‌بالایی را که ثبت‌کننده آشکار می‌کند پوشش می‌دهند
- نام فرمان‌های توصیف‌گر را به حروف، اعداد، خط تیره، و زیرخط محدود کنید،
  و آن‌ها را با حرف یا عدد شروع کنید؛ OpenClaw نام‌های توصیف‌گر خارج از
  این شکل را رد می‌کند و دنباله‌های کنترل ترمینال را پیش از
  رندر کردن راهنما از توضیحات حذف می‌کند
- فقط برای مسیرهای سازگاری eager از `commands` به‌تنهایی استفاده کنید

## شکل‌های Plugin

OpenClaw پلاگین‌های بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها دسته‌بندی می‌کند:

| شکل                 | توضیح                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | یک نوع قابلیت (مثلاً فقط provider)           |
| **hybrid-capability** | چند نوع قابلیت (مثلاً provider + speech) |
| **hook-only**         | فقط hookها، بدون قابلیت                        |
| **non-capability**    | ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت        |

از `openclaw plugins inspect <id>` برای دیدن شکل یک Plugin استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) - API ثبت و مرجع زیربخش‌ها
- [کمک‌کننده‌های Runtime](/fa/plugins/sdk-runtime) - `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) - manifest، ورودی راه‌اندازی، بارگذاری معوق
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت شیء `ChannelPlugin`
- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) - ثبت provider و hookها
