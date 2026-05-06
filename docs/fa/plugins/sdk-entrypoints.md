---
read_when:
    - به امضای نوع دقیق `definePluginEntry` یا `defineChannelPluginEntry` نیاز دارید.
    - می‌خواهید حالت ثبت را درک کنید (کامل در برابر راه‌اندازی در برابر فرادادهٔ CLI)
    - در حال جست‌وجوی گزینه‌های نقطهٔ ورود هستید
sidebarTitle: Entry Points
summary: مرجع definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورود Plugin
x-i18n:
    generated_at: "2026-05-06T09:34:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر Plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK سه helper برای
ساخت آن‌ها فراهم می‌کند.

برای Pluginهای نصب‌شده، `package.json` باید بارگذاری runtime را، در صورت
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

`extensions` و `setupEntry` همچنان ورودی‌های source معتبری برای توسعه با workspace و
git checkout هستند. وقتی OpenClaw یک package نصب‌شده را بارگذاری می‌کند،
`runtimeExtensions` و `runtimeSetupEntry` ترجیح داده می‌شوند و به packageهای npm اجازه می‌دهند
از کامپایل TypeScript در runtime پرهیز کنند. ورودی‌های runtime صریح الزامی‌اند:
`runtimeSetupEntry` به `setupEntry` نیاز دارد، و نبود artifactهای `runtimeExtensions` یا
`runtimeSetupEntry` باعث شکست نصب/کشف می‌شود، نه اینکه بی‌صدا به source برگردد. اگر
یک package نصب‌شده فقط یک ورودی source از نوع TypeScript اعلام کند، OpenClaw در صورت وجود
یک همتای ساخته‌شده مطابق `dist/*.js` از آن استفاده می‌کند و سپس به source نوع TypeScript
برمی‌گردد.

همه مسیرهای ورودی باید داخل دایرکتوری package متعلق به Plugin باقی بمانند. ورودی‌های runtime
و همتاهای JavaScript ساخته‌شده استنباط‌شده، یک مسیر source خارج‌شونده در `extensions` یا
`setupEntry` را معتبر نمی‌کنند.

<Tip>
  **به‌دنبال راهنمای گام‌به‌گام هستید؟** برای راهنماهای مرحله‌به‌مرحله، [Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
  یا [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) را ببینید.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

برای Pluginهای ارائه‌دهنده، Pluginهای ابزار، Pluginهای hook، و هر چیزی که **یک کانال**
پیام‌رسانی نیست.

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
- `configSchema` می‌تواند برای ارزیابی تنبل یک function باشد.
- OpenClaw آن schema را در نخستین دسترسی resolve و memoize می‌کند، بنابراین سازنده‌های schema
  پرهزینه فقط یک‌بار اجرا می‌شوند.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با اتصال‌های ویژه کانال wrap می‌کند. به‌طور خودکار
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

- `setRuntime` هنگام ثبت فراخوانی می‌شود تا بتوانید reference مربوط به runtime را ذخیره کنید
  (معمولا از طریق `createPluginRuntimeStore`). هنگام capture کردن metadata مربوط به CLI
  از آن صرف‌نظر می‌شود.
- `registerCliMetadata` در طول `api.registrationMode === "cli-metadata"`،
  `api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"` اجرا می‌شود.
  از آن به‌عنوان محل canonical برای descriptorهای CLI متعلق به کانال استفاده کنید تا راهنمای root
  غیر‌فعال‌ساز بماند، snapshotهای کشف شامل metadata ایستای command باشند، و
  ثبت عادی commandهای CLI با بارگذاری کامل Plugin سازگار بماند.
- ثبت discovery غیر‌فعال‌ساز است، نه بدون import. OpenClaw ممکن است
  ورودی Plugin مورد اعتماد و module مربوط به channel Plugin را برای ساختن
  snapshot ارزیابی کند، بنابراین importهای سطح بالا را بدون side effect نگه دارید و socketها،
  clientها، workerها و serviceها را پشت مسیرهای فقط `"full"` قرار دهید.
- `registerFull` فقط وقتی اجرا می‌شود که `api.registrationMode === "full"` باشد. در
  بارگذاری setup-only از آن صرف‌نظر می‌شود.
- مانند `definePluginEntry`، `configSchema` می‌تواند یک factory تنبل باشد و OpenClaw
  schema resolve‌شده را در نخستین دسترسی memoize می‌کند.
- برای commandهای CLI root متعلق به Plugin، وقتی می‌خواهید command بدون ناپدید شدن از
  درخت parse مربوط به CLI root همچنان lazy-loaded بماند، `api.registerCli(..., { descriptors: [...] })`
  را ترجیح دهید. برای Pluginهای کانال، ترجیح دهید آن descriptorها را
  از `registerCliMetadata(...)` ثبت کنید و `registerFull(...)` را روی کارهای فقط runtime متمرکز نگه دارید.
- اگر `registerFull(...)` همچنین methodهای RPC مربوط به Gateway را ثبت می‌کند، آن‌ها را روی یک
  prefix ویژه Plugin نگه دارید. namespaceهای admin هسته رزروشده (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) همیشه به
  `operator.admin` coerced می‌شوند.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک `setup-entry.ts`. فقط `{ plugin }` را بدون هیچ
اتصال runtime یا CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw وقتی یک کانال غیرفعال، پیکربندی‌نشده، یا وقتی بارگذاری deferred فعال است،
این را به‌جای ورودی کامل بارگذاری می‌کند. برای زمان‌هایی که این موضوع اهمیت دارد،
[Setup و Config](/fa/plugins/sdk-setup#setup-entry) را ببینید.

در عمل، `defineSetupPluginEntry(...)` را با خانواده‌های helper محدود setup جفت کنید:

- `openclaw/plugin-sdk/setup-runtime` برای helperهای setup امن برای runtime، مانند
  adapterهای patch مربوط به setup امن برای import، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و proxyهای setup واگذارشده
- `openclaw/plugin-sdk/channel-setup` برای سطح‌های setup مربوط به نصب اختیاری
- `openclaw/plugin-sdk/setup-tools` برای helperهای setup/install CLI/archive/docs

SDKهای سنگین، ثبت CLI، و serviceهای runtime طولانی‌عمر را در ورودی کامل نگه دارید.

کانال‌های workspace باندل‌شده‌ای که سطح‌های setup و runtime را جدا می‌کنند، می‌توانند به‌جای آن از
`defineBundledChannelSetupEntry(...)` از
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. آن contract به
ورودی setup اجازه می‌دهد exportهای Plugin/secrets امن برای setup را نگه دارد و همچنان یک
runtime setter را در معرض بگذارد:

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

فقط زمانی از آن contract باندل‌شده استفاده کنید که جریان‌های setup واقعا پیش از بارگذاری ورودی کامل
کانال به یک runtime setter سبک نیاز داشته باشند.

## حالت ثبت

`api.registrationMode` به Plugin شما می‌گوید چگونه بارگذاری شده است:

| حالت              | زمان                              | چه چیزی ثبت شود                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | راه‌اندازی عادی Gateway            | همه چیز                                                                                                              |
| `"discovery"`     | کشف read-only قابلیت‌ها    | ثبت کانال به‌همراه descriptorهای ایستای CLI؛ کد ورودی ممکن است بارگذاری شود، اما از socketها، workerها، clientها و serviceها صرف‌نظر کنید |
| `"setup-only"`    | کانال غیرفعال/پیکربندی‌نشده     | فقط ثبت کانال                                                                                               |
| `"setup-runtime"` | جریان setup با runtime در دسترس | ثبت کانال به‌همراه فقط runtime سبک موردنیاز پیش از بارگذاری ورودی کامل                               |
| `"cli-metadata"`  | راهنمای root / capture کردن metadata مربوط به CLI  | فقط descriptorهای CLI                                                                                                    |

`defineChannelPluginEntry` این تفکیک را به‌طور خودکار مدیریت می‌کند. اگر از
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

حالت discovery یک snapshot رجیستری غیر‌فعال‌ساز می‌سازد. ممکن است همچنان
ورودی Plugin و شیء channel Plugin را ارزیابی کند تا OpenClaw بتواند قابلیت‌های کانال
و descriptorهای ایستای CLI را ثبت کند. ارزیابی module در discovery را
مورد اعتماد اما سبک در نظر بگیرید: بدون clientهای شبکه، subprocessها، listenerها، اتصال‌های database،
workerهای پس‌زمینه، خواندن credentialها، یا دیگر side effectهای runtime زنده در سطح بالا.

`"setup-runtime"` را به‌عنوان پنجره‌ای در نظر بگیرید که در آن سطح‌های راه‌اندازی setup-only باید
بدون ورود دوباره به runtime کامل کانال باندل‌شده وجود داشته باشند. موارد مناسب شامل
ثبت کانال، routeهای HTTP امن برای setup، methodهای Gateway امن برای setup، و
helperهای setup واگذارشده هستند. serviceهای پس‌زمینه سنگین، registrarهای CLI، و
bootstrapهای SDK ارائه‌دهنده/client همچنان به `"full"` تعلق دارند.

به‌طور خاص برای registrarهای CLI:

- وقتی registrar مالک یک یا چند command در root است و می‌خواهید OpenClaw در نخستین invocation
  module واقعی CLI را lazy-load کند، از `descriptors` استفاده کنید
- مطمئن شوید آن descriptorها همه rootهای command سطح بالا را که registrar در معرض می‌گذارد پوشش می‌دهند
- نام commandهای descriptor را به حرف‌ها، عددها، hyphen، و underscore محدود کنید،
  به‌طوری‌که با یک حرف یا عدد شروع شوند؛ OpenClaw نام‌های descriptor خارج از
  این شکل را رد می‌کند و توالی‌های کنترل terminal را پیش از render کردن help از descriptionها حذف می‌کند
- فقط برای مسیرهای سازگاری eager از `commands` به‌تنهایی استفاده کنید

## شکل‌های Plugin

OpenClaw، Pluginهای بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها دسته‌بندی می‌کند:

| شکل                  | توضیح                                              |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | یک نوع قابلیت (مثلاً فقط ارائه‌دهنده)             |
| **hybrid-capability** | چند نوع قابلیت (مثلاً ارائه‌دهنده + گفتار)        |
| **hook-only**         | فقط هوک‌ها، بدون قابلیت                           |
| **non-capability**    | ابزارها/دستورها/سرویس‌ها، اما بدون قابلیت         |

برای دیدن شکل یک Plugin از `openclaw plugins inspect <id>` استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) - API ثبت و مرجع زیرمسیر
- [کمک‌کننده‌های زمان اجرا](/fa/plugins/sdk-runtime) - `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) - مانیفست، ورودی راه‌اندازی، بارگذاری به‌تعویق‌افتاده
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت شیء `ChannelPlugin`
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ثبت ارائه‌دهنده و هوک‌ها
