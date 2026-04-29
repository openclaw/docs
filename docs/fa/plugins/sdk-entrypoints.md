---
read_when:
    - به امضای نوع دقیق definePluginEntry یا defineChannelPluginEntry نیاز دارید
    - می‌خواهید حالت ثبت (کامل در برابر راه‌اندازی در برابر فرادادهٔ CLI) را درک کنید
    - در حال جست‌وجوی گزینه‌های نقطه ورود هستید
sidebarTitle: Entry Points
summary: مرجع definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورود Plugin
x-i18n:
    generated_at: "2026-04-29T23:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر Plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK سه کمک‌گر برای
ایجاد آن‌ها فراهم می‌کند.

برای Pluginهای نصب‌شده، `package.json` باید بارگذاری زمان اجرا را، در صورت
دردسترس بودن، به JavaScript ساخته‌شده اشاره دهد:

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

`extensions` و `setupEntry` همچنان ورودی‌های منبع معتبر برای توسعه در workspace و
git checkout هستند. وقتی OpenClaw یک بسته نصب‌شده را بارگذاری می‌کند،
`runtimeExtensions` و `runtimeSetupEntry` ترجیح داده می‌شوند و به بسته‌های npm اجازه می‌دهند از
کامپایل TypeScript در زمان اجرا پرهیز کنند. اگر یک بسته نصب‌شده فقط یک ورودی
منبع TypeScript اعلام کند، OpenClaw وقتی همتای ساخته‌شده‌ی منطبق `dist/*.js`
وجود داشته باشد از آن استفاده می‌کند، سپس به منبع TypeScript برمی‌گردد.

همه مسیرهای ورودی باید داخل دایرکتوری بسته Plugin باقی بمانند. ورودی‌های زمان اجرا
و همتاهای JavaScript ساخته‌شده‌ی استنتاج‌شده، مسیر منبع `extensions` یا
`setupEntry` خارج‌شونده را معتبر نمی‌کنند.

<Tip>
  **دنبال یک راهنمای گام‌به‌گام هستید؟** برای راهنماهای مرحله‌به‌مرحله، [Channel Plugins](/fa/plugins/sdk-channel-plugins)
  یا [Provider Plugins](/fa/plugins/sdk-provider-plugins) را ببینید.
</Tip>

## `definePluginEntry`

**ایمپورت:** `openclaw/plugin-sdk/plugin-entry`

برای Pluginهای ارائه‌دهنده، Pluginهای ابزار، Pluginهای hook، و هر چیزی که
یک کانال پیام‌رسانی **نیست**.

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

| فیلد          | نوع                                                              | الزامی | پیش‌فرض           |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | بله      | —                   |
| `name`         | `string`                                                         | بله      | —                   |
| `description`  | `string`                                                         | بله      | —                   |
| `kind`         | `string`                                                         | خیر       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | schema شیء خالی |
| `register`     | `(api: OpenClawPluginApi) => void`                               | بله      | —                   |

- `id` باید با manifest `openclaw.plugin.json` شما مطابقت داشته باشد.
- `kind` برای جایگاه‌های انحصاری است: `"memory"` یا `"context-engine"`.
- `configSchema` می‌تواند برای ارزیابی تنبل یک تابع باشد.
- OpenClaw آن schema را در نخستین دسترسی resolve و memoize می‌کند، بنابراین سازنده‌های schema
  پرهزینه فقط یک‌بار اجرا می‌شوند.

## `defineChannelPluginEntry`

**ایمپورت:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با سیم‌کشی مخصوص کانال wrapper می‌کند. به‌صورت خودکار
`api.registerChannel({ plugin })` را فراخوانی می‌کند، یک seam اختیاری metadata برای CLI
راهنمای ریشه در معرض می‌گذارد، و `registerFull` را بر اساس حالت ثبت محدود می‌کند.

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

| فیلد                 | نوع                                                              | الزامی | پیش‌فرض           |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | بله      | —                   |
| `name`                | `string`                                                         | بله      | —                   |
| `description`         | `string`                                                         | بله      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | بله      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر       | schema شیء خالی |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | خیر       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | خیر       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | خیر       | —                   |

- `setRuntime` در زمان ثبت فراخوانی می‌شود تا بتوانید مرجع زمان اجرا را ذخیره کنید
  (معمولاً از طریق `createPluginRuntimeStore`). در زمان capture metadata
  CLI نادیده گرفته می‌شود.
- `registerCliMetadata` در زمان `api.registrationMode === "cli-metadata"`،
  `api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"` اجرا می‌شود.
  از آن به‌عنوان محل canonical برای توصیف‌گرهای CLI متعلق به کانال استفاده کنید تا راهنمای ریشه
  غیر‌فعال‌کننده بماند، snapshotهای discovery شامل metadata فرمان ایستا باشند، و
  ثبت عادی فرمان CLI با بارگذاری کامل Plugin سازگار بماند.
- ثبت discovery غیر‌فعال‌کننده است، نه بدون import. OpenClaw ممکن است
  ورودی Plugin مورد اعتماد و ماژول Plugin کانال را برای ساختن
  snapshot ارزیابی کند؛ بنابراین importهای سطح بالا را بدون اثر جانبی نگه دارید و socketها،
  clientها، workerها و serviceها را پشت مسیرهای فقط `"full"` قرار دهید.
- `registerFull` فقط وقتی اجرا می‌شود که `api.registrationMode === "full"`. در زمان
  بارگذاری فقط setup نادیده گرفته می‌شود.
- مانند `definePluginEntry`، `configSchema` می‌تواند یک factory تنبل باشد و OpenClaw
  schema resolve‌شده را در نخستین دسترسی memoize می‌کند.
- برای فرمان‌های CLI ریشه متعلق به Plugin، وقتی می‌خواهید فرمان بدون ناپدید شدن از
  درخت parse ریشه CLI به‌صورت lazy-loaded باقی بماند، `api.registerCli(..., { descriptors: [...] })`
  را ترجیح دهید. برای Pluginهای کانال، ثبت آن توصیف‌گرها را
  از `registerCliMetadata(...)` ترجیح دهید و `registerFull(...)` را بر کارهای فقط زمان اجرا متمرکز نگه دارید.
- اگر `registerFull(...)` متدهای RPC مربوط به Gateway را نیز ثبت می‌کند، آن‌ها را روی یک
  پیشوند مخصوص Plugin نگه دارید. namespaceهای رزرو‌شده‌ی مدیریت core (`config.*`،
  `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به
  `operator.admin` وادار می‌شوند.

## `defineSetupPluginEntry`

**ایمپورت:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک‌وزن `setup-entry.ts`. فقط `{ plugin }` را بدون
سیم‌کشی زمان اجرا یا CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw وقتی یک کانال غیرفعال، پیکربندی‌نشده، یا وقتی بارگذاری deferred فعال است،
این را به‌جای ورودی کامل بارگذاری می‌کند. برای زمان‌هایی که این موضوع اهمیت دارد، به
[Setup and Config](/fa/plugins/sdk-setup#setup-entry) مراجعه کنید.

در عمل، `defineSetupPluginEntry(...)` را با خانواده‌های کمک‌گر محدود setup
همراه کنید:

- `openclaw/plugin-sdk/setup-runtime` برای کمک‌گرهای setup ایمن برای زمان اجرا مانند
  adapterهای patch setup ایمن برای import، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و proxyهای setup واگذارشده
- `openclaw/plugin-sdk/channel-setup` برای سطح‌های setup نصب اختیاری
- `openclaw/plugin-sdk/setup-tools` برای کمک‌گرهای CLI/archive/docs مربوط به setup/install

SDKهای سنگین، ثبت CLI، و serviceهای زمان اجرای بلندمدت را در ورودی کامل
نگه دارید.

کانال‌های workspace همراه که سطح‌های setup و زمان اجرا را جدا می‌کنند، می‌توانند به‌جای آن از
`defineBundledChannelSetupEntry(...)` از
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن contract اجازه می‌دهد
ورودی setup خروجی‌های plugin/secrets ایمن برای setup را حفظ کند و همچنان یک
setter زمان اجرا را در معرض بگذارد:

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
});
```

از آن contract همراه فقط وقتی استفاده کنید که flowهای setup واقعاً پیش از بارگذاری ورودی کامل کانال
به یک setter سبک‌وزن زمان اجرا نیاز دارند.

## حالت ثبت

`api.registrationMode` به Plugin شما می‌گوید چگونه بارگذاری شده است:

| حالت              | زمان                              | چه چیزی ثبت شود                                                                                                         |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | راه‌اندازی عادی Gateway            | همه‌چیز                                                                                                               |
| `"discovery"`     | کشف قابلیت فقط‌خواندنی    | ثبت کانال به‌همراه توصیف‌گرهای CLI ایستا؛ کد ورودی ممکن است بارگذاری شود، اما socketها، workerها، clientها و serviceها را رد کنید |
| `"setup-only"`    | کانال غیرفعال/پیکربندی‌نشده     | فقط ثبت کانال                                                                                               |
| `"setup-runtime"` | flow setup با زمان اجرای دردسترس | ثبت کانال به‌همراه فقط زمان اجرای سبک‌وزن مورد نیاز پیش از بارگذاری ورودی کامل                               |
| `"cli-metadata"`  | راهنمای ریشه / capture metadata CLI  | فقط توصیف‌گرهای CLI                                                                                                    |

`defineChannelPluginEntry` این تفکیک را به‌صورت خودکار مدیریت می‌کند. اگر از
`definePluginEntry` مستقیماً برای یک کانال استفاده می‌کنید، خودتان حالت را بررسی کنید:

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

حالت discovery یک snapshot رجیستری غیر‌فعال‌کننده می‌سازد. ممکن است همچنان
ورودی Plugin و شیء Plugin کانال را ارزیابی کند تا OpenClaw بتواند قابلیت‌های کانال
و توصیف‌گرهای CLI ایستا را ثبت کند. ارزیابی ماژول در discovery را
مورد اعتماد اما سبک‌وزن در نظر بگیرید: هیچ client شبکه، subprocess، listener، اتصال پایگاه داده،
worker پس‌زمینه، خواندن credential، یا اثر جانبی زنده دیگر در سطح بالا نباشد.

`"setup-runtime"` را به‌عنوان پنجره‌ای در نظر بگیرید که در آن سطح‌های راه‌اندازی فقط setup باید
بدون ورود دوباره به زمان اجرای کانال همراه کامل وجود داشته باشند. موارد مناسب شامل
ثبت کانال، routeهای HTTP ایمن برای setup، متدهای Gateway ایمن برای setup، و
کمک‌گرهای setup واگذارشده هستند. serviceهای پس‌زمینه سنگین، ثبت‌کننده‌های CLI، و
bootstrapهای SDK ارائه‌دهنده/client همچنان به `"full"` تعلق دارند.

به‌طور خاص برای ثبت‌کننده‌های CLI:

- وقتی ثبت‌کننده مالک یک یا چند فرمان ریشه است و می‌خواهید OpenClaw
  ماژول CLI واقعی را در اولین فراخوانی به‌صورت lazy-load بارگذاری کند، از `descriptors` استفاده کنید
- مطمئن شوید آن توصیف‌گرها هر ریشه فرمان سطح بالایی را که ثبت‌کننده در معرض می‌گذارد پوشش می‌دهند
- نام فرمان‌های توصیف‌گر را به حروف، اعداد، خط تیره و زیرخط محدود کنید،
  و با یک حرف یا عدد شروع کنید؛ OpenClaw نام‌های توصیف‌گر خارج از
  این شکل را رد می‌کند و توالی‌های کنترل terminal را پیش از
  render کردن راهنما از توضیحات حذف می‌کند
- از `commands` به‌تنهایی فقط برای مسیرهای سازگاری eager استفاده کنید

## شکل‌های Plugin

OpenClaw Pluginهای بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها طبقه‌بندی می‌کند:

| شکل                   | توضیح                                              |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | یک نوع قابلیت (مثلا فقط provider)                  |
| **hybrid-capability** | چند نوع قابلیت (مثلا provider + speech)            |
| **hook-only**         | فقط hookها، بدون قابلیت                            |
| **non-capability**    | ابزارها/فرمان‌ها/سرویس‌ها، اما بدون قابلیت         |

از `openclaw plugins inspect <id>` برای دیدن شکل یک plugin استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) — API ثبت و مرجع subpath
- [کمک‌کننده‌های Runtime](/fa/plugins/sdk-runtime) — `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) — manifest، ورودی setup، بارگذاری به‌تعویق‌افتاده
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — ساخت شیء `ChannelPlugin`
- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) — ثبت provider و hookها
