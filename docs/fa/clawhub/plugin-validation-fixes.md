---
read_when:
    - دستور `clawhub package validate` را اجرا کرده‌اید و باید مشکلات Plugin را برطرف کنید
    - ClawHub انتشار یک بستهٔ Plugin را رد کرد یا دربارهٔ آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: پیش از انتشار، ایرادهای اعتبارسنجی بستهٔ Plugin در ClawHub را برطرف کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-12T09:47:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# رفع اشکال‌های اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن خودکار بسته‌ها را نمایش دهد. این صفحه یافته‌های مربوط به نویسنده را پوشش می‌دهد؛ یعنی یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، واردسازی‌های SDK یا مصنوع منتشرشده خود برطرف کند.

این صفحه یافته‌های داخلی مربوط به پوشش Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگه‌داری اسکنر باشد و راهنمایی‌ای برای رفع مشکل توسط نویسنده ارائه نکند، آن موارد برای نگه‌دارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های مربوط به نویسنده

| کد                                     | از اینجا شروع کنید                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [افزودن فراداده بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                          |
| `package-openclaw-metadata-missing`     | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                                       |
| `package-openclaw-entry-missing`        | [اعلام نقاط ورود بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                                      |
| `package-entrypoint-missing`            | [انتشار نقطه ورود اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                             |
| `package-install-metadata-incomplete`   | [تکمیل فراداده نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                             |
| `package-plugin-api-compat-missing`     | [اعلام سازگاری API مربوط به Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                               |
| `package-min-host-version-drift`        | [هم‌تراز کردن حداقل نسخه میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                     |
| `package-manifest-version-drift`        | [هم‌تراز کردن نسخه‌های بسته و مانیفست](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                               |
| `package-openclaw-unsupported-metadata` | [حذف فراداده پشتیبانی‌نشده بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)                     |
| `package-npm-pack-unavailable`          | [قابل‌بسته‌بندی کردن مصنوع npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                        |
| `package-npm-pack-entrypoint-missing`   | [گنجاندن نقاط ورود در خروجی بسته npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                           |
| `package-npm-pack-metadata-missing`     | [گنجاندن فراداده در خروجی بسته npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                               |
| `manifest-name-missing`                 | [افزودن نام نمایشی مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                                    |
| `manifest-unknown-fields`               | [حذف فیلدهای پشتیبانی‌نشده مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                         |
| `manifest-unknown-contracts`            | [حذف کلیدهای قرارداد پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                      |
| `legacy-root-sdk-import`                | [جایگزینی واردسازی‌های SDK ریشه](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [حذف واردسازی‌های رزروشده SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                                  |
| `sdk-load-session-store`                | [جایگزینی دسترسی به کل مخزن نشست](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                            |
| `sdk-session-store-write`               | [جایگزینی نوشتن در کل مخزن نشست](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                            |
| `sdk-session-file-helper`               | [جایگزینی توابع کمکی مسیر فایل نشست](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                       |
| `sdk-session-transcript-file-target`    | [جایگزینی مقصدهای قدیمی فایل رونوشت](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                            |
| `sdk-session-transcript-low-level`      | [جایگزینی توابع کمکی سطح‌پایین رونوشت](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                            |
| `legacy-before-agent-start`             | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                             |
| `provider-auth-env-vars`                | [انتقال متغیرهای محیطی ارائه‌دهنده به فراداده راه‌اندازی](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                   |
| `channel-env-vars`                      | [بازتاب متغیرهای محیطی کانال در فراداده فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                     |
| `security-manifest-schema-unavailable`  | [حذف ارجاع‌های در دسترس‌نبودۀ طرح‌واره مانیفست امنیتی](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable)       |
| `unrecognized-security-manifest`        | [حذف فایل‌های پشتیبانی‌نشده مانیفست امنیتی](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                         |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه، نقاط ورود یا فراداده OpenClaw را شناسایی کند.

- یک `package.json` با `name`، `version` و `type` اضافه کنید.
- هنگامی که بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته از مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته دارای `package.json` است، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را بگنجانید.
- هنگامی که بسته از طریق ClawHub منتشر یا نصب خواهد شد، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما نقطه ورود زمان اجرای OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود بومی Plugin، `openclaw.extensions` را اضافه کنید.
- هنگامی که بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل پوشه بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw را اعلام می‌کند، اما فایل ارجاع‌شده در بستۀ در حال اعتبارسنجی وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد که بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده مانند `clawhubSpec`، `npmSpec` یا `localPath` تکمیل کنید.
- هنگامی که بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته محدودۀ API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API مربوط به Plugin در OpenClaw یا کف نسخۀ معنایی‌ای استفاده کنید که بسته را در برابر آن ساخته و آزمایش کرده‌اید.
- این مورد را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هرگونه فراداده ساخت OpenClaw در بسته، مانند نسخه OpenClaw استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخه میزبان را با محدودۀ نسخه میزبان که بسته واقعاً پشتیبانی می‌کند هم‌تراز کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با یکدیگر سازگار نیستند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز دارای `version` است، آن را به‌روزرسانی کنید تا مطابقت داشته باشد؛ یا هنگامی که فراداده بسته مرجع اصلی است، فراداده قدیمی نسخه مانیفست را حذف کنید.
- پس از تغییر فراداده منتشرشده، نسخه جدیدی از بسته را منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده بومی Plugin را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته و فراداده سازگاری، نصب، راه‌اندازی و فهرست را در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مصنوع منتشرشده

### package-npm-pack-unavailable

بسته را نمی‌توان به مصنوعی بسته‌بندی کرد که ClawHub آن را بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های خراب چرخه‌عمر یا ورودی‌های فایل را که باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما مصنوع بسته‌بندی‌شده شامل فایل‌های نقطه ورود اعلام‌شده در `package.json#openclaw` نیست.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که گنجانده خواهند شد بررسی کنید.
- نقاط ورود تولیدشده را پیش از بسته‌بندی بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

مصنوع بسته‌بندی‌شده فاقد فراداده OpenClaw موجود در بسته منبع شما است.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` در مصنوع بسته‌بندی‌شده شامل بلوک `openclaw` است.
- هنگامی که بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته مستثنا نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

مانیفست بومی Plugin شامل نام نمایشی نیست.

- یک فیلد غیرخالی `name` به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشینی حفظ کنید.
- به [مانیفست Plugin](/fa/plugins/manifest) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin دارای فیلدهایی در سطح بالا است که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شده `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست، کلیدهای پشتیبانی‌نشده‌ای را درون `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را
  به فراداده ایستای مالکیت قابلیت‌ها محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از مسیر تجمیعی ریشه منسوخ‌شده SDK وارد می‌کند:
`openclaw/plugin-sdk`.

- واردسازی‌های مسیر تجمیعی ریشه را با واردسازی‌های متمرکز از زیرفر مسیرهای عمومی جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای ابزارهای کمکی نقطه ورود کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن واردسازی محدود، از [قراردادهای واردسازی](/fa/plugins/building-plugins#import-conventions) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را وارد می‌کند که برای Pluginهای همراه یا سازگاری
داخلی رزرو شده است.

- واردسازی‌های رزروشده SDK داخلی OpenClaw را با زیرفر مسیرهای عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر این رفتار SDK عمومی ندارد، ابزار کمکی را درون بسته خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب واردسازی پشتیبانی‌شده از [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin همچنان از ابزار کمکی منسوخ‌شده کل مخزن نشست
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت نشست از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، تغییر و ذخیره کل شیء مخزن نشست خودداری کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- به [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin همچنان از یک ابزار کمکی منسوخ‌شده برای نوشتن کل مخزن نشست، مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدهای یک ورودی نشست موجود، از `patchSessionEntry(...)`
  استفاده کنید.
- هنگام جایگزینی یا ایجاد یک ورودی نشست، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر و ذخیره کل شیء مخزن نشست خودداری کنید.
- ابزارهای کمکی نوشتن کل مخزن را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- به [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin همچنان از ابزارهای کمکی منسوخ‌شده مسیر فایل نشست، مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فراداده نشست بر اساس هویت عامل و نشست از `getSessionEntry(...)`
  استفاده کنید.
- برای ماندگار کردن فراداده نشست از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- هنگامی که کد در حال آماده‌سازی یک عملیات رونوشت است، از ابزارهای کمکی هویت یا مقصد رونوشت استفاده کنید.
- مسیرهای قدیمی فایل رونوشت را ماندگار نکنید و به آن‌ها وابسته نباشید.
- به [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin همچنان از ابزار کمکی منسوخ‌شده مقصد فایل رونوشت
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- هنگامی که کد فقط به هویت عمومی نشست نیاز دارد، از `resolveSessionTranscriptIdentity(...)`
  استفاده کنید.
- هنگامی که کد به یک مقصد ساختاریافته برای عملیات رونوشت نیاز دارد، از
  `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساخت مستقیم مقصدهای قدیمی فایل رونوشت خودداری کنید.
- ابزار کمکی قدیمی را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- به [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin همچنان از ابزارهای کمکی سطح پایین منسوخ‌شده رونوشت، مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به رونوشت از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی رونوشت از `publishSessionTranscriptUpdateByIdentity(...)`
  استفاده کنید.
- سطح ساختاریافته زمان اجرای رونوشت را ترجیح دهید تا OpenClaw بتواند
  مرزهای صحیح تراکنش و مدیریت هویت را اعمال کند.
- ابزارهای کمکی سطح پایین رونوشت را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- به [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفر مسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin همچنان از هوک قدیمی `before_agent_start` استفاده می‌کند.

- کارهای بازنویسی مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای تغییر اعلان یا زمینه را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- به [هوک‌ها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست همچنان از فراداده قدیمی احراز هویت ارائه‌دهنده `providerAuthEnvVars` استفاده می‌کند.

- فراداده متغیرهای محیطی ارائه‌دهنده را در `setup.providers[].envVars` نیز منعکس کنید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که بازه
  پشتیبانی‌شده OpenClaw شما همچنان به آن نیاز دارد.
- به [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فراداده قدیمی یا نسل قبلی متغیرهای محیطی کانال، بدون فراداده فعلی
راه‌اندازی یا پیکربندی مورد انتظار ClawHub استفاده می‌کند.

- فراداده متغیرهای محیطی کانال را اعلانی نگه دارید تا OpenClaw بتواند وضعیت راه‌اندازی را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- راه‌اندازی کانال مبتنی بر متغیر محیطی را در فراداده فعلی راه‌اندازی، پیکربندی کانال یا
  کانال بسته که شکل Plugin شما استفاده می‌کند نیز منعکس کنید.
- `channelEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر
  پشتیبانی‌شده OpenClaw همچنان به آن نیاز دارند.
- به [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) مراجعه کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیتی

### security-manifest-schema-unavailable

بسته، فایل `openclaw.security.json` را با مرجع طرح‌واره‌ای ارائه می‌کند که ClawHub
آن را در دسترس نمی‌شناسد.

- اگر URL طرح‌واره صرفاً جنبه راهنما دارد، آن را حذف کنید.
- تنها پس از آنکه OpenClaw یک طرح‌واره نسخه‌بندی‌شده منتشر کرد، از آن استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیتی پشتیبانی‌نشده ارائه می‌کند.

- `openclaw.security.json` را تا زمانی که OpenClaw یک طرح‌واره نسخه‌بندی‌شده برای مانیفست
  امنیتی و رفتار ClawHub را مستند کند، حذف کنید.
- تا زمان شکل‌گیری قرارداد مانیفست، رفتارهای حساس به امنیت را در مستندات عمومی بسته یا
  README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [CLI مربوط به ClawHub](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
