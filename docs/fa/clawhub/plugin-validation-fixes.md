---
read_when:
    - شما clawhub package validate را اجرا کرده‌اید و باید یافته‌های Plugin را اصلاح کنید
    - ClawHub انتشار بسته Plugin را رد کرد یا دربارهٔ آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin در ClawHub را پیش از انتشار برطرف کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-06-28T05:07:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# رفع‌های اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های مربوط به نویسنده را پوشش می‌دهد، یعنی یافته‌هایی که نویسندهٔ Plugin می‌تواند در فرادادهٔ بسته، مانیفست، importهای SDK یا آرتیفکت منتشرشدهٔ خود رفع کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگهداری اسکنر بدون راهنمایی اصلاح برای نویسنده باشد، آن‌ها برای نگهدارندگان OpenClaw هستند نه نویسندگان Plugin.

پس از اعمال هر رفع، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های مربوط به نویسنده

| کد                                     | از اینجا شروع کنید                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                 | [افزودن فرادادهٔ بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                |
| `package-openclaw-metadata-missing`    | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                              |
| `package-openclaw-entry-missing`       | [اعلام نقاط ورود بستهٔ OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                            |
| `package-entrypoint-missing`           | [انتشار نقطهٔ ورود اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                   |
| `package-install-metadata-incomplete`  | [تکمیل فرادادهٔ نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                   |
| `package-plugin-api-compat-missing`    | [اعلام سازگاری API مربوط به Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                      |
| `package-min-host-version-drift`       | [همسو کردن حداقل نسخهٔ میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                              |
| `package-manifest-version-drift`       | [همسو کردن نسخه‌های بسته و مانیفست](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                         |
| `package-openclaw-unsupported-metadata` | [حذف فرادادهٔ پشتیبانی‌نشدهٔ بستهٔ OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)        |
| `package-npm-pack-unavailable`         | [قابل بسته‌بندی کردن آرتیفکت npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                             |
| `package-npm-pack-entrypoint-missing`  | [گنجاندن نقاط ورود در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`    | [گنجاندن فراداده در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                      |
| `manifest-name-missing`                | [افزودن نام نمایشی مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                          |
| `manifest-unknown-fields`              | [حذف فیلدهای پشتیبانی‌نشدهٔ مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                               |
| `manifest-unknown-contracts`           | [حذف کلیدهای قرارداد پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                             |
| `legacy-root-sdk-import`               | [جایگزینی importهای ریشهٔ SDK](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                      |
| `reserved-sdk-import`                  | [حذف importهای رزرو‌شدهٔ SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                          |
| `sdk-load-session-store`               | [جایگزینی دسترسی به کل session store](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                               |
| `legacy-before-agent-start`            | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`               | [انتقال env varهای ارائه‌دهنده به فرادادهٔ setup](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                   |
| `channel-env-vars`                     | [بازتاب دادن env varهای کانال در فرادادهٔ فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                          |
| `security-manifest-schema-unavailable` | [حذف ارجاع‌های طرح‌وارهٔ مانیفست امنیتیِ در دسترس نبودنی](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`       | [حذف فایل‌های مانیفست امنیتی پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                 |

## فرادادهٔ بسته

### package-json-missing

ریشهٔ بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بستهٔ npm، نسخه، نقاط ورود یا فرادادهٔ OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونهٔ حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته و مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فرادادهٔ بستهٔ OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فرادادهٔ نقطهٔ ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته از طریق ClawHub منتشر یا نصب خواهد شد، فرادادهٔ سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فرادادهٔ بسته وجود دارد، اما نقطهٔ ورود runtime مربوط به OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود بومی Plugin، `openclaw.extensions` را اضافه کنید.
- وقتی بستهٔ منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همهٔ مسیرهای نقطهٔ ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطهٔ ورود OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطهٔ ورود در `dist` تولید می‌شود، بسته را build کنید.
- اگر نقطهٔ ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخهٔ میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازهٔ API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخهٔ API مربوط به Plugin در OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخهٔ بسته جدا نگه دارید. نسخهٔ بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخهٔ میزبان بسته با فرادادهٔ نسخهٔ OpenClaw که بسته بر اساس آن ساخته شده است مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فرادادهٔ build مربوط به OpenClaw در بسته را بررسی کنید، مانند نسخهٔ OpenClaw که هنگام انتشار استفاده شده است.
- حداقل نسخهٔ میزبان را با بازهٔ نسخهٔ میزبانی که بسته واقعاً پشتیبانی می‌کند همسو کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخهٔ بسته و نسخهٔ مانیفست Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخهٔ انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای مطابقت به‌روزرسانی کنید یا وقتی فرادادهٔ بسته مرجع است، فرادادهٔ قدیمی نسخهٔ مانیفست را حذف کنید.
- پس از تغییر فرادادهٔ منتشرشده، نسخهٔ جدیدی از بسته منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فرادادهٔ بستهٔ OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فرادادهٔ بومی Plugin را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، setup و فرادادهٔ کاتالوگ را در فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## آرتیفکت منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به آرتیفکتی بسته‌بندی شود که ClawHub بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشهٔ بسته اجرا کنید.
- فرادادهٔ نامعتبر بسته، اسکریپت‌های lifecycle خراب، یا entries فایل‌هایی را که باعث شکست بسته‌بندی می‌شوند رفع کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما آرتیفکت بسته‌بندی‌شده فایل‌های نقطهٔ ورودی را که در `package.json#openclaw` اعلام شده‌اند شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که قرار است گنجانده شوند بررسی کنید.
- نقاط ورود تولیدشده را پیش از بسته‌بندی build کنید.
- `files`، `.npmignore` یا خروجی build را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

آرتیفکت بسته‌بندی‌شده فرادادهٔ OpenClaw را که در بستهٔ منبع شما وجود دارد ندارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فرادادهٔ گنجانده‌شده را بررسی کنید.
- اطمینان حاصل کنید `package.json` بلوک `openclaw` را در آرتیفکت بسته‌بندی‌شده شامل می‌شود.
- وقتی بسته یک Plugin بومی OpenClaw است، اطمینان حاصل کنید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فرادادهٔ بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فرادادهٔ مانیفست

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسهٔ پایدار ماشینی نگه دارید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شده
  `package.json#openclaw` منتقل کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید، و `contracts` را
  به فراداده ایستای مالکیت قابلیت محدود نگه دارید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشه SDK منسوخ‌شده import می‌کند:
`openclaw/plugin-sdk`.

- importهای barrel ریشه را با importهای زیربخش عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای ابزارهای کمکی نقطه ورود کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن import محدودتر، از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای bundled یا سازگاری
داخلی رزرو شده است.

- importهای رزروشده SDK داخلی OpenClaw را با زیربخش‌های عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار SDK عمومی ندارد، ابزار کمکی را داخل بسته خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک import پشتیبانی‌شده، از [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-load-session-store

Plugin هنوز از ابزار کمکی منسوخ‌شده کل ذخیره‌گاه نشست
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست، از `getSessionEntry(...)` یا `listSessionEntries(...)` استفاده کنید.
- هنگام نوشتن وضعیت نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر و ذخیره کردن کل شیء ذخیره‌گاه نشست پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کارهای override مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای تغییر prompt یا زمینه را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فراداده احراز هویت ارائه‌دهنده قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فراداده متغیرهای محیطی ارائه‌دهنده را در `setup.providers[].envVars` منعکس کنید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که بازه پشتیبانی‌شده
  OpenClaw شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### channel-env-vars

مانیفست از فراداده متغیر محیطی کانال قدیمی یا کهنه‌تر، بدون فراداده setup یا config فعلی
که ClawHub انتظار دارد، استفاده می‌کند.

- فراداده متغیر محیطی کانال را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانال مبتنی بر env را در setup فعلی، config کانال، یا
  فراداده کانال بسته که شکل Plugin شما استفاده می‌کند منعکس کنید.
- `channelEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر پشتیبانی‌شده
  OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## مانیفست امنیتی

### security-manifest-schema-unavailable

بسته، `openclaw.security.json` را با ارجاع schemaای منتشر می‌کند که ClawHub
آن را به‌عنوان در دسترس نمی‌شناسد.

- اگر URL schema فقط جنبه راهنما دارد، آن را حذف کنید.
- فقط پس از انتشار یک schema نسخه‌دار مستندشده توسط OpenClaw، از آن استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیتی پشتیبانی‌نشده منتشر می‌کند.

- `openclaw.security.json` را تا زمانی که OpenClaw یک schema مانیفست امنیتی
  نسخه‌دار و رفتار ClawHub را مستند کند حذف کنید.
- رفتار حساس به امنیت را تا زمان وجود قرارداد مانیفست، در مستندات عمومی بسته خود یا
  README مستند نگه دارید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
