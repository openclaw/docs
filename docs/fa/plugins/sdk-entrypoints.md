---
read_when:
    - به امضای نوع دقیق definePluginEntry یا defineChannelPluginEntry نیاز دارید
    - می‌خواهید حالت ثبت را بفهمید (کامل در برابر راه‌اندازی در برابر فرادادهٔ CLI)
    - در حال جست‌وجوی گزینه‌های نقطهٔ ورود هستید
sidebarTitle: Entry Points
summary: مرجع definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورودی Plugin
x-i18n:
    generated_at: "2026-05-02T11:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر Plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK سه کمک‌کننده برای
ایجاد آن‌ها فراهم می‌کند.

برای Pluginهای نصب‌شده، `package.json` باید بارگذاری runtime را، در صورت
در دسترس بودن، به JavaScript ساخته‌شده اشاره دهد:

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

`extensions` و `setupEntry` همچنان ورودی‌های منبع معتبر برای توسعه در workspace و git
checkout هستند. وقتی OpenClaw یک بسته نصب‌شده را بارگذاری می‌کند، `runtimeExtensions` و `runtimeSetupEntry` ترجیح داده می‌شوند
و به بسته‌های npm اجازه می‌دهند از کامپایل runtime TypeScript پرهیز کنند. ورودی‌های runtime صریح الزامی‌اند: `runtimeSetupEntry`
به `setupEntry` نیاز دارد، و نبود artifactهای `runtimeExtensions` یا `runtimeSetupEntry`
باعث شکست نصب/کشف می‌شود، نه اینکه بی‌صدا به منبع fallback کند. اگر
یک بسته نصب‌شده فقط یک ورودی منبع TypeScript اعلام کند، OpenClaw ابتدا، در صورت وجود،
از همتای ساخته‌شده مطابق `dist/*.js` استفاده می‌کند و سپس به منبع TypeScript
fallback می‌کند.

همه مسیرهای ورودی باید داخل دایرکتوری بسته Plugin باقی بمانند. ورودی‌های runtime
و همتاهای JavaScript ساخته‌شده استنتاج‌شده، مسیر منبع `extensions` یا
`setupEntry` خارج‌شونده را معتبر نمی‌کنند.

<Tip>
  **دنبال یک راهنمای گام‌به‌گام هستید؟** برای راهنماهای مرحله‌به‌مرحله به [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
  یا [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) مراجعه کنید.
</Tip>

## `definePluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/plugin-entry`

برای Pluginهای ارائه‌دهنده، Pluginهای ابزار، Pluginهای hook، و هر چیزی که **یک کانال پیام‌رسانی نیست**.

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

- `id` باید با manifest شما در `openclaw.plugin.json` مطابقت داشته باشد.
- `kind` برای slotهای انحصاری است: `"memory"` یا `"context-engine"`.
- `configSchema` می‌تواند برای ارزیابی lazy یک تابع باشد.
- OpenClaw آن schema را در نخستین دسترسی resolve و memoize می‌کند، بنابراین سازنده‌های schema
  پرهزینه فقط یک بار اجرا می‌شوند.

## `defineChannelPluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با سیم‌کشی مخصوص کانال wrap می‌کند. به‌صورت خودکار
`api.registerChannel({ plugin })` را فراخوانی می‌کند، یک seam اختیاری metadata برای CLI راهنمای root
در معرض می‌گذارد، و `registerFull` را بر اساس حالت ثبت gate می‌کند.

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

- `setRuntime` هنگام ثبت فراخوانی می‌شود تا بتوانید مرجع runtime را ذخیره کنید
  (معمولاً از طریق `createPluginRuntimeStore`). این کار هنگام capture کردن metadata
  CLI نادیده گرفته می‌شود.
- `registerCliMetadata` هنگام `api.registrationMode === "cli-metadata"`،
  `api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"` اجرا می‌شود.
  از آن به‌عنوان جای canonical برای descriptorهای CLI متعلق به کانال استفاده کنید تا راهنمای root
  غیر‌فعال‌کننده بماند، snapshotهای کشف شامل metadata ایستای command باشند، و
  ثبت عادی commandهای CLI با بارگذاری کامل Plugin سازگار بماند.
- ثبت کشف غیر‌فعال‌کننده است، نه بدون import. OpenClaw ممکن است
  ورودی Plugin مورد اعتماد و ماژول Plugin کانال را برای ساخت
  snapshot ارزیابی کند، بنابراین importهای سطح بالا را بدون side effect نگه دارید و socketها،
  clientها، workerها و serviceها را پشت مسیرهای فقط `"full"` قرار دهید.
- `registerFull` فقط وقتی `api.registrationMode === "full"` باشد اجرا می‌شود. این مورد
  هنگام بارگذاری setup-only نادیده گرفته می‌شود.
- مانند `definePluginEntry`، `configSchema` می‌تواند یک factory تنبل باشد و OpenClaw
  schema resolve‌شده را در نخستین دسترسی memoize می‌کند.
- برای commandهای CLI ریشه که متعلق به Plugin هستند، وقتی می‌خواهید command بدون ناپدید شدن از
  درخت parse CLI ریشه lazy-loaded بماند، `api.registerCli(..., { descriptors: [...] })` را ترجیح دهید.
  برای Pluginهای کانال، ترجیح دهید آن descriptorها را از
  `registerCliMetadata(...)` ثبت کنید و `registerFull(...)` را روی کارهای فقط runtime متمرکز نگه دارید.
- اگر `registerFull(...)` همچنین methodهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را روی یک
  prefix مخصوص Plugin نگه دارید. namespaceهای core admin رزروشده (`config.*`،
  `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به
  `operator.admin` واداشته می‌شوند.

## `defineSetupPluginEntry`

**وارد کردن:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک `setup-entry.ts`. فقط `{ plugin }` را بدون
سیم‌کشی runtime یا CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw وقتی یک کانال غیرفعال، پیکربندی‌نشده، یا وقتی بارگذاری deferred فعال است،
این را به‌جای ورودی کامل بارگذاری می‌کند. برای زمان‌هایی که این موضوع اهمیت دارد، به
[Setup و پیکربندی](/fa/plugins/sdk-setup#setup-entry) مراجعه کنید.

در عمل، `defineSetupPluginEntry(...)` را با خانواده‌های کمک‌کننده setup محدود
جفت کنید:

- `openclaw/plugin-sdk/setup-runtime` برای کمک‌کننده‌های setup ایمن برای runtime مانند
  adapterهای patch setup ایمن برای import، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و proxyهای setup واگذارشده
- `openclaw/plugin-sdk/channel-setup` برای سطح‌های setup نصب اختیاری
- `openclaw/plugin-sdk/setup-tools` برای کمک‌کننده‌های CLI/archive/docs مربوط به setup/install

SDKهای سنگین، ثبت CLI، و serviceهای runtime بلندمدت را در ورودی کامل
نگه دارید.

کانال‌های workspace همراه که سطح‌های setup و runtime را جدا می‌کنند می‌توانند در عوض از
`defineBundledChannelSetupEntry(...)` از
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن contract به
ورودی setup اجازه می‌دهد exportهای Plugin/secrets ایمن برای setup را حفظ کند و همچنان یک
setter مربوط به runtime را در معرض بگذارد:

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

فقط وقتی جریان‌های setup واقعاً پیش از بارگذاری ورودی کامل کانال به یک setter سبک runtime
نیاز دارند، از آن contract همراه استفاده کنید.

## حالت ثبت

`api.registrationMode` به Plugin شما می‌گوید چگونه بارگذاری شده است:

| حالت              | زمان                              | چه چیزی را ثبت کنید                                                                                                     |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | شروع عادی Gateway                 | همه‌چیز                                                                                                                 |
| `"discovery"`     | کشف قابلیت فقط‌خواندنی            | ثبت کانال به‌علاوه descriptorهای CLI ایستا؛ کد ورودی ممکن است بارگذاری شود، اما socketها، workerها، clientها و serviceها را نادیده بگیرید |
| `"setup-only"`    | کانال غیرفعال/پیکربندی‌نشده       | فقط ثبت کانال                                                                                                           |
| `"setup-runtime"` | جریان setup با runtime در دسترس   | ثبت کانال به‌علاوه فقط runtime سبک موردنیاز پیش از بارگذاری ورودی کامل                                                 |
| `"cli-metadata"`  | راهنمای root / capture کردن metadata CLI | فقط descriptorهای CLI                                                                                                   |

`defineChannelPluginEntry` این جداسازی را به‌صورت خودکار مدیریت می‌کند. اگر برای یک کانال
مستقیماً از `definePluginEntry` استفاده می‌کنید، خودتان حالت را بررسی کنید:

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

حالت کشف یک snapshot رجیستری غیر‌فعال‌کننده می‌سازد. با این حال ممکن است همچنان
ورودی Plugin و شیء Plugin کانال را ارزیابی کند تا OpenClaw بتواند قابلیت‌های کانال
و descriptorهای CLI ایستا را ثبت کند. ارزیابی ماژول در discovery را مورد اعتماد اما سبک
در نظر بگیرید: بدون clientهای شبکه، subprocessها، listenerها، اتصال‌های پایگاه داده،
workerهای پس‌زمینه، خواندن credential، یا دیگر side effectهای runtime زنده در سطح بالا.

`"setup-runtime"` را پنجره‌ای بدانید که در آن سطح‌های startup مربوط به setup-only باید
بدون ورود دوباره به runtime کامل کانال همراه وجود داشته باشند. موارد مناسب شامل
ثبت کانال، routeهای HTTP ایمن برای setup، methodهای Gateway ایمن برای setup، و
کمک‌کننده‌های setup واگذارشده هستند. serviceهای سنگین پس‌زمینه، ثبت‌کننده‌های CLI، و
bootstrapهای SDK ارائه‌دهنده/client همچنان به `"full"` تعلق دارند.

به‌طور خاص برای ثبت‌کننده‌های CLI:

- وقتی ثبت‌کننده مالک یک یا چند command ریشه است و می‌خواهید OpenClaw
  ماژول CLI واقعی را در نخستین فراخوانی lazy-load کند، از `descriptors` استفاده کنید
- مطمئن شوید آن descriptorها هر root مربوط به command سطح بالا را که توسط
  ثبت‌کننده در معرض گذاشته شده پوشش می‌دهند
- نام commandهای descriptor را به حروف، اعداد، hyphen و underscore محدود کنید،
  و با یک حرف یا عدد شروع کنید؛ OpenClaw نام‌های descriptor خارج از
  این شکل را رد می‌کند و sequenceهای کنترل terminal را پیش از
  render کردن help از descriptionها حذف می‌کند
- فقط برای مسیرهای سازگاری eager از `commands` به‌تنهایی استفاده کنید

## شکل‌های Plugin

OpenClaw، Pluginهای بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها طبقه‌بندی می‌کند:

| شکل                  | توضیح                                             |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | یک نوع قابلیت (مثلاً فقط provider)               |
| **hybrid-capability** | چند نوع قابلیت (مثلاً provider + speech)         |
| **hook-only**         | فقط hookها، بدون قابلیت                          |
| **non-capability**    | ابزارها/دستورها/سرویس‌ها اما بدون قابلیت         |

برای دیدن شکل یک Plugin از `openclaw plugins inspect <id>` استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) — API ثبت و مرجع subpath
- [کمک‌کننده‌های Runtime](/fa/plugins/sdk-runtime) — `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) — manifest، ورودی setup، بارگذاری معوق
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — ساخت شیء `ChannelPlugin`
- [Pluginهای Provider](/fa/plugins/sdk-provider-plugins) — ثبت provider و hookها
