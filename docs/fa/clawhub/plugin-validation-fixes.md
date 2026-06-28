---
read_when:
    - شما clawhub package validate را اجرا کردید و باید یافته‌های Plugin را برطرف کنید
    - ClawHub انتشار بسته Plugin را رد کرد یا دربارهٔ آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: رفع یافته‌های اعتبارسنجی بسته Plugin در ClawHub پیش از انتشار
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-06-28T00:12:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های
اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های مخصوص نویسنده را پوشش می‌دهد؛ یعنی
یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، واردسازی‌های SDK
یا آرتیفکت منتشرشده خود اصلاح کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل
شامل کدهای نگهداری اسکنر بدون راهنمای اصلاح برای نویسنده باشد، آن‌ها برای نگه‌دارندگان
OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های مخصوص نویسنده

| کد                                      | از اینجا شروع کنید                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [فراداده بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [بلوک openclaw بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [نقاط ورود بسته OpenClaw را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [نقطه ورود اعلام‌شده را منتشر کنید](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [فراداده نصب را کامل کنید](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [سازگاری API ‏Plugin را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [حداقل نسخه میزبان را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [نسخه‌های بسته و مانیفست را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [فراداده پشتیبانی‌نشده بسته OpenClaw را حذف کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [آرتیفکت npm را قابل بسته‌بندی کنید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [نقاط ورود را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [فراداده را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [یک نام نمایشی مانیفست اضافه کنید](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [فیلدهای پشتیبانی‌نشده مانیفست را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [واردسازی‌های SDK ریشه را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [واردسازی‌های رزرو‌شده SDK را حذف کنید](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [دسترسی به کل ذخیره‌گاه نشست را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [before_agent_start را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [متغیرهای محیطی ارائه‌دهنده را به فراداده راه‌اندازی منتقل کنید](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [متغیرهای محیطی کانال را در فراداده فعلی بازتاب دهید](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ارجاع‌های طرح‌واره مانیفست امنیتیِ در دسترس نبودنی را حذف کنید](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [فایل‌های مانیفست امنیتی پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm،
نسخه، نقاط ورود یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin مربوط به OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins)
  و برای تفکیک بسته از مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson)
  استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا
  `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته قرار است از طریق ClawHub منتشر یا نصب شود، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما نقطه ورود زمان اجرای OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند،
  `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل پوشه بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و
  [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که
اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`،
  `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود منتقل شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند
  `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API ‏Plugin مربوط به OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API ‏Plugin مربوط به OpenClaw یا کف semver که بر اساس آن ساخته و آزموده‌اید
  استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار
  Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده
مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw در بسته، مانند نسخه OpenClaw
  استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخه میزبان را با بازه نسخه میزبانی که بسته واقعاً پشتیبانی می‌کند
  هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای تطبیق به‌روزرسانی کنید یا
  وقتی فراداده بسته مرجع است، فراداده نسخه مانیفست منسوخ را حذف کنید.
- پس از تغییر فراداده منتشرشده، یک نسخه جدید از بسته منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته
OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، راه‌اندازی و فراداده کاتالوگ را
  در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## آرتیفکت منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به آرتیفکتی بسته‌بندی شود که ClawHub آن را بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های چرخه‌حیات خراب، یا ورودی‌های فایل‌هایی را که
  باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما آرتیفکت بسته‌بندی‌شده شامل فایل‌های نقطه ورود
اعلام‌شده در `package.json#openclaw` نیست.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که قرار است گنجانده شوند بررسی کنید.
- نقاط ورود تولیدشده را پیش از بسته‌بندی بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده
  گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

آرتیفکت بسته‌بندی‌شده فراداده OpenClaw موجود در بسته منبع شما را ندارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` شامل بلوک `openclaw` در آرتیفکت بسته‌بندی‌شده است.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته مستثنا نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشینی نگه دارید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح بالایی دارد که OpenClaw پشتیبانی نمی‌کند.

- هر فیلد سطح بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده‌های بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شده‌ی `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts`
  را به فراداده‌ی ایستای مالکیت قابلیت‌ها محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## SDK و مهاجرت سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشه‌ی SDK منسوخ‌شده import می‌کند:
`openclaw/plugin-sdk`.

- importهای root-barrel را با importهای زیرمسیر عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای helperهای ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن import محدود، از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای بسته‌بندی‌شده یا سازگاری
داخلی رزرو شده است.

- importهای SDK داخلی رزروشده‌ی OpenClaw را با زیرمسیرهای عمومی مستندشده‌ی
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر این رفتار SDK عمومی ندارد، helper را داخل بسته‌ی خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک import پشتیبانی‌شده، از [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از helper منسوخ‌شده‌ی whole-session-store یعنی
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت نشست از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، جهش و ذخیره‌ی کل شیء session store خودداری کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه‌ی سازگاری اعلام‌شده‌ی شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کارهای override مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای جهش prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه‌ی سازگاری اعلام‌شده‌ی شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فراداده‌ی قدیمی احراز هویت ارائه‌دهنده‌ی `providerAuthEnvVars` استفاده می‌کند.

- فراداده‌ی env-var ارائه‌دهنده را در `setup.providers[].envVars` آینه کنید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده‌ی سازگاری نگه دارید، تا زمانی که بازه‌ی پشتیبانی‌شده‌ی
  OpenClaw شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فراداده‌ی env-var قدیمی یا کهنه‌ی کانال بدون فراداده‌ی setup یا config فعلی که ClawHub انتظار دارد استفاده می‌کند.

- فراداده‌ی env-var کانال را اعلامی نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری runtime کانال بررسی کند.
- setup کانال مبتنی بر env را به setup فعلی، config کانال، یا
  فراداده‌ی کانال بسته که شکل Plugin شما استفاده می‌کند آینه کنید.
- `channelEnvVars` را فقط به‌عنوان فراداده‌ی سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر پشتیبانی‌شده‌ی
  OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته `openclaw.security.json` را با مرجع schemaای عرضه می‌کند که ClawHub
آن را به‌عنوان در دسترس نمی‌شناسد.

- اگر URL schema فقط جنبه‌ی توصیه‌ای دارد، آن را حذف کنید.
- فقط پس از اینکه OpenClaw یک schema نسخه‌دار منتشر کرد، از آن schema مستندشده استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده عرضه می‌کند.

- `openclaw.security.json` را تا زمانی که OpenClaw یک schema مانیفست امنیت نسخه‌دار
  و رفتار ClawHub را مستند کند حذف کنید.
- رفتار حساس به امنیت را تا زمان وجود داشتن قرارداد مانیفست، در مستندات عمومی بسته یا
  README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
