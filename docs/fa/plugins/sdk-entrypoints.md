---
read_when:
    - شما به امضای نوع دقیق definePluginEntry یا defineChannelPluginEntry نیاز دارید
    - می‌خواهید حالت ثبت را درک کنید (full در برابر setup در برابر فرادادهٔ CLI)
    - در حال بررسی گزینه‌های نقطهٔ ورود هستید
sidebarTitle: Entry Points
summary: مرجع definePluginEntry، defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط ورود Plugin
x-i18n:
    generated_at: "2026-05-07T13:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

هر Plugin یک شیء ورودی پیش‌فرض صادر می‌کند. SDK سه کمک‌کننده برای
ایجاد آن‌ها فراهم می‌کند.

برای Pluginهای نصب‌شده، `package.json` باید بارگذاری زمان اجرا را، در صورت
وجود، به JavaScript ساخته‌شده اشاره دهد:

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
git checkout باقی می‌مانند. وقتی OpenClaw یک package نصب‌شده را بارگذاری می‌کند،
`runtimeExtensions` و `runtimeSetupEntry` ترجیح داده می‌شوند و به packageهای npm
اجازه می‌دهند از کامپایل TypeScript در زمان اجرا اجتناب کنند. ورودی‌های زمان
اجرای صریح الزامی هستند: `runtimeSetupEntry` به `setupEntry` نیاز دارد، و نبود
artifactهای `runtimeExtensions` یا `runtimeSetupEntry` باعث شکست نصب/کشف می‌شود
به‌جای اینکه بی‌سروصدا به منبع fallback کند. اگر یک package نصب‌شده فقط یک ورودی
منبع TypeScript اعلام کند، OpenClaw وقتی peer متناظر ساخته‌شده `dist/*.js` وجود
داشته باشد از آن استفاده می‌کند، سپس به منبع TypeScript fallback می‌کند.

همه مسیرهای ورودی باید داخل دایرکتوری package مربوط به Plugin بمانند. ورودی‌های
زمان اجرا و peerهای JavaScript ساخته‌شده استنباط‌شده، یک مسیر منبع `extensions`
یا `setupEntry` خارج‌شونده را معتبر نمی‌کنند.

<Tip>
  **دنبال یک راهنمای گام‌به‌گام هستید؟** برای راهنماهای مرحله‌به‌مرحله،
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) یا [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) را ببینید.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

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

| فیلد           | نوع                                                              | الزامی | پیش‌فرض             |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`           | `string`                                                         | بله    | -                   |
| `name`         | `string`                                                         | بله    | -                   |
| `description`  | `string`                                                         | بله    | -                   |
| `kind`         | `string`                                                         | خیر    | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر    | schema شیء خالی     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | بله    | -                   |

- `id` باید با manifest شما در `openclaw.plugin.json` مطابقت داشته باشد.
- `kind` برای slotهای انحصاری است: `"memory"` یا `"context-engine"`.
- `configSchema` می‌تواند برای ارزیابی تنبل یک تابع باشد.
- OpenClaw آن schema را در اولین دسترسی resolve و memoize می‌کند، بنابراین سازنده‌های
  schema پرهزینه فقط یک‌بار اجرا می‌شوند.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` را با سیم‌کشی مخصوص کانال wrap می‌کند. به‌طور خودکار
`api.registerChannel({ plugin })` را فراخوانی می‌کند، یک seam اختیاری metadata
برای CLI راهنمای ریشه را expose می‌کند، و `registerFull` را بر اساس حالت ثبت
gate می‌کند.

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

| فیلد                  | نوع                                                              | الزامی | پیش‌فرض             |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | بله    | -                   |
| `name`                | `string`                                                         | بله    | -                   |
| `description`         | `string`                                                         | بله    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | بله    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | خیر    | schema شیء خالی     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | خیر    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | خیر    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | خیر    | -                   |

- `setRuntime` هنگام ثبت فراخوانی می‌شود تا بتوانید reference زمان اجرا را ذخیره کنید
  (معمولاً از طریق `createPluginRuntimeStore`). هنگام capture کردن metadata مربوط
  به CLI از آن صرف‌نظر می‌شود.
- `registerCliMetadata` در زمان `api.registrationMode === "cli-metadata"`،
  `api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"` اجرا می‌شود.
  از آن به‌عنوان محل canonical برای descriptorهای CLI متعلق به کانال استفاده کنید تا
  راهنمای ریشه non-activating بماند، snapshotهای discovery شامل metadata ایستای
  command باشند، و ثبت command معمول CLI با بارگذاری کامل Plugin سازگار بماند.
- ثبت discovery غیر‌فعال‌کننده است، نه بدون import. OpenClaw ممکن است
  ورودی Plugin معتمد و ماژول Plugin کانال را evaluate کند تا snapshot را بسازد،
  بنابراین importهای سطح بالا را بدون side effect نگه دارید و socketها،
  clientها، workerها و serviceها را پشت مسیرهای فقط `"full"` قرار دهید.
- `registerFull` فقط وقتی اجرا می‌شود که `api.registrationMode === "full"`. هنگام
  بارگذاری setup-only از آن صرف‌نظر می‌شود.
- مانند `definePluginEntry`، `configSchema` می‌تواند یک factory تنبل باشد و OpenClaw
  schema resolveشده را در اولین دسترسی memoize می‌کند.
- برای commandهای CLI ریشه متعلق به Plugin، وقتی می‌خواهید command بدون ناپدید شدن از
  درخت parse مربوط به CLI ریشه به‌صورت lazy-loaded باقی بماند، `api.registerCli(..., { descriptors: [...] })`
  را ترجیح دهید. برای commandهای feature مربوط به paired-node،
  `api.registerNodeCliFeature(...)` را ترجیح دهید تا command زیر `openclaw nodes`
  قرار بگیرد. برای دیگر commandهای تودرتوی Plugin، `parentPath` را اضافه کنید و
  commandها را روی شیء `program` که به registrar پاس داده می‌شود ثبت کنید؛ OpenClaw
  آن را پیش از فراخوانی Plugin به command والد resolve می‌کند. برای Pluginهای کانال،
  ثبت آن descriptorها از `registerCliMetadata(...)` را ترجیح دهید و
  `registerFull(...)` را روی کارهای فقط زمان اجرا متمرکز نگه دارید.
- اگر `registerFull(...)` همچنین methodهای RPC مربوط به Gateway را ثبت می‌کند،
  آن‌ها را روی یک prefix مخصوص Plugin نگه دارید. namespaceهای رزروشده مدیریت هسته
  (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به
  `operator.admin` وادار می‌شوند.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

برای فایل سبک‌وزن `setup-entry.ts`. فقط `{ plugin }` را بدون سیم‌کشی زمان اجرا یا
CLI برمی‌گرداند.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw وقتی یک کانال disabled، پیکربندی‌نشده، یا deferred loading فعال باشد،
این را به‌جای ورودی کامل بارگذاری می‌کند. برای زمان‌هایی که این موضوع اهمیت دارد،
[Setup و Config](/fa/plugins/sdk-setup#setup-entry) را ببینید.

در عمل، `defineSetupPluginEntry(...)` را با خانواده‌های کمک‌کننده setup محدود
جفت کنید:

- `openclaw/plugin-sdk/setup-runtime` برای کمک‌کننده‌های setup امن برای زمان اجرا مانند
  adapterهای setup patch امن برای import، خروجی lookup-note،
  `promptResolvedAllowFrom`، `splitSetupEntries`، و proxyهای setup واگذارشده
- `openclaw/plugin-sdk/channel-setup` برای سطح‌های setup نصب اختیاری
- `openclaw/plugin-sdk/setup-tools` برای کمک‌کننده‌های CLI/archive/docs مربوط به setup/install

SDKهای سنگین، ثبت CLI، و serviceهای زمان اجرای طولانی‌مدت را در ورودی کامل نگه دارید.

کانال‌های workspace باندل‌شده که سطح‌های setup و زمان اجرا را جدا می‌کنند می‌توانند
به‌جای آن از `defineBundledChannelSetupEntry(...)` از
`openclaw/plugin-sdk/channel-entry-contract` استفاده کنند. این contract به ورودی
setup اجازه می‌دهد exportهای Plugin/secrets امن برای setup را نگه دارد و در عین
حال همچنان یک setter زمان اجرا expose کند:

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

از آن contract باندل‌شده فقط وقتی استفاده کنید که flowهای setup واقعاً پیش از
بارگذاری ورودی کامل کانال به یک setter زمان اجرای سبک‌وزن نیاز داشته باشند.

## حالت ثبت

`api.registrationMode` به Plugin شما می‌گوید چگونه بارگذاری شده است:

| حالت              | زمان                              | چه چیزی ثبت شود                                                                                                      |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | startup معمول Gateway            | همه چیز                                                                                                              |
| `"discovery"`     | کشف قابلیت فقط‌خواندنی           | ثبت کانال به‌علاوه descriptorهای CLI ایستا؛ کد ورودی ممکن است بارگذاری شود، اما socketها، workerها، clientها و serviceها را رد کنید |
| `"setup-only"`    | کانال disabled/پیکربندی‌نشده     | فقط ثبت کانال                                                                                                       |
| `"setup-runtime"` | flow setup با زمان اجرای در دسترس | ثبت کانال به‌علاوه فقط زمان اجرای سبک‌وزنی که پیش از بارگذاری ورودی کامل لازم است                                |
| `"cli-metadata"`  | راهنمای ریشه / capture کردن metadata مربوط به CLI | فقط descriptorهای CLI                                                                                              |

`defineChannelPluginEntry` این جداسازی را به‌طور خودکار مدیریت می‌کند. اگر مستقیماً
از `definePluginEntry` برای یک کانال استفاده می‌کنید، خودتان mode را بررسی کنید:

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

حالت discovery یک snapshot registry غیر‌فعال‌کننده می‌سازد. با این حال ممکن است
ورودی Plugin و شیء Plugin کانال را evaluate کند تا OpenClaw بتواند قابلیت‌های
کانال و descriptorهای CLI ایستا را ثبت کند. ارزیابی ماژول در discovery را
معتمد اما سبک‌وزن در نظر بگیرید: هیچ client شبکه، subprocess، listener، اتصال
database، worker پس‌زمینه، خواندن credential، یا side effect زنده زمان اجرا در
سطح بالا نباشد.

`"setup-runtime"` را پنجره‌ای بدانید که در آن سطح‌های startup فقط setup باید
بدون ورود دوباره به زمان اجرای کامل کانال باندل‌شده وجود داشته باشند. موارد مناسب
شامل ثبت کانال، routeهای HTTP امن برای setup، methodهای Gateway امن برای setup، و
کمک‌کننده‌های setup واگذارشده هستند. serviceهای پس‌زمینه سنگین، registrarهای CLI،
و bootstrapهای SDK مربوط به provider/client همچنان به `"full"` تعلق دارند.

به‌طور خاص برای registrarهای CLI:

- از `descriptors` زمانی استفاده کنید که registrar مالک یک یا چند دستور ریشه‌ای است و می‌خواهید OpenClaw ماژول واقعی CLI را هنگام نخستین فراخوانی به‌صورت تنبل بارگذاری کند
- مطمئن شوید این descriptorها همه ریشه‌های دستور سطح‌بالا را که registrar ارائه می‌کند پوشش می‌دهند
- نام دستورهای descriptor را به حروف، اعداد، خط تیره و زیرخط محدود کنید و با حرف یا عدد شروع کنید؛ OpenClaw نام‌های descriptor خارج از این الگو را رد می‌کند و پیش از نمایش راهنما، دنباله‌های کنترلی ترمینال را از توضیحات حذف می‌کند
- از `commands` به‌تنهایی فقط برای مسیرهای سازگاری eager استفاده کنید

## شکل‌های Plugin

OpenClaw، Pluginهای بارگذاری‌شده را بر اساس رفتار ثبت آن‌ها دسته‌بندی می‌کند:

| شکل                  | توضیح                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | یک نوع قابلیت (مثلاً فقط ارائه‌دهنده)           |
| **hybrid-capability** | چند نوع قابلیت (مثلاً ارائه‌دهنده + گفتار) |
| **hook-only**         | فقط قلاب‌ها، بدون قابلیت                        |
| **non-capability**    | ابزارها/دستورها/سرویس‌ها اما بدون قابلیت        |

برای دیدن شکل یک Plugin، از `openclaw plugins inspect <id>` استفاده کنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) - API ثبت و مرجع زیربخش‌ها
- [کمک‌کننده‌های Runtime](/fa/plugins/sdk-runtime) - `api.runtime` و `createPluginRuntimeStore`
- [راه‌اندازی و پیکربندی](/fa/plugins/sdk-setup) - manifest، نقطه ورود راه‌اندازی، بارگذاری معوق
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت شیء `ChannelPlugin`
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ثبت ارائه‌دهنده و قلاب‌ها
