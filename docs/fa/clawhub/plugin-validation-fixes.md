---
read_when:
    - شما clawhub package validate را اجرا کرده‌اید و باید یافته‌های Plugin را برطرف کنید.
    - ClawHub هنگام انتشار بستهٔ Plugin آن را رد کرد یا هشدار داد
    - در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin ClawHub را پیش از انتشار اصلاح کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-02T14:07:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های مربوط به نویسنده را پوشش می‌دهد، یعنی یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، واردسازی‌های SDK، یا آرتیفکت منتشرشده خود اصلاح کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگه‌داری اسکنر بدون راهنمای اصلاح برای نویسنده باشد، آن‌ها برای نگه‌داران OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های مربوط به نویسنده

| کد                                     | از اینجا شروع کنید                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                 | [فراداده بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                         |
| `package-openclaw-metadata-missing`    | [بلوک openclaw بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                      |
| `package-openclaw-entry-missing`       | [نقاط ورود بسته OpenClaw را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                    |
| `package-entrypoint-missing`           | [نقطه ورود اعلام‌شده را منتشر کنید](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                            |
| `package-install-metadata-incomplete`  | [فراداده نصب را کامل کنید](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                            |
| `package-plugin-api-compat-missing`    | [سازگاری API مربوط به Plugin را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)             |
| `package-min-host-version-drift`       | [حداقل نسخه میزبان را همسو کنید](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`       | [نسخه‌های بسته و مانیفست را همسو کنید](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                     |
| `package-openclaw-unsupported-metadata` | [فراداده پشتیبانی‌نشده بسته OpenClaw را حذف کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)   |
| `package-npm-pack-unavailable`         | [آرتیفکت npm را قابل بسته‌بندی کنید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                         |
| `package-npm-pack-entrypoint-missing`  | [نقاط ورود را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)             |
| `package-npm-pack-metadata-missing`    | [فراداده را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                 |
| `manifest-name-missing`                | [یک نام نمایشی مانیفست اضافه کنید](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                  |
| `manifest-unknown-fields`              | [فیلدهای پشتیبانی‌نشده مانیفست را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                       |
| `manifest-unknown-contracts`           | [کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                    |
| `legacy-root-sdk-import`               | [واردسازی‌های SDK ریشه را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                            |
| `reserved-sdk-import`                  | [واردسازی‌های رزروشده SDK را حذف کنید](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                |
| `sdk-load-session-store`               | [دسترسی به کل session-store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                       |
| `sdk-session-store-write`              | [نوشتن‌های کل session-store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                      |
| `sdk-session-file-helper`              | [کمک‌کننده‌های مسیر فایل نشست را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                    |
| `sdk-session-transcript-file-target`   | [هدف‌های فایل رونوشت قدیمی را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)            |
| `sdk-session-transcript-low-level`     | [کمک‌کننده‌های سطح پایین رونوشت را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)         |
| `legacy-before-agent-start`            | [before_agent_start را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                            |
| `provider-auth-env-vars`               | [متغیرهای محیطی ارائه‌دهنده را به فراداده راه‌اندازی منتقل کنید](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)  |
| `channel-env-vars`                     | [متغیرهای محیطی کانال را در فراداده فعلی بازتاب دهید](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                    |
| `security-manifest-schema-unavailable` | [ارجاع‌های طرح‌واره مانیفست امنیتی دردسترس‌نبودنی را حذف کنید](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`       | [فایل‌های مانیفست امنیتی پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)        |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه، نقاط ورود، یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته و مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته از طریق ClawHub منتشر یا نصب می‌شود، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما یک نقطه ورود runtime برای OpenClaw اعلام نمی‌کند.

- برای نقاط ورود بومی Plugin، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته در حال اعتبارسنجی وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب دردسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API مربوط به Plugin در OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده است همخوانی ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw را در بسته، مانند نسخه OpenClaw استفاده‌شده هنگام انتشار، بررسی کنید.
- حداقل نسخه میزبان را با بازه نسخه میزبان که بسته واقعا پشتیبانی می‌کند همسو کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با هم اختلاف دارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای همخوانی به‌روزرسانی کنید یا وقتی فراداده بسته مرجع است، فراداده نسخه مانیفست قدیمی را حذف کنید.
- پس از تغییر فراداده منتشرشده، نسخه جدیدی از بسته منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده بومی Plugin را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، راه‌اندازی و فراداده کاتالوگ را در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## آرتیفکت منتشرشده

### package-npm-pack-unavailable

بسته را نمی‌توان به آرتیفکتی بسته‌بندی کرد که ClawHub بررسی یا منتشر می‌کند.

- از ریشه بسته `npm pack --dry-run` را اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های lifecycle خراب، یا ورودی‌های files را که باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما آرتیفکت بسته‌بندی‌شده فایل‌های نقطه ورود اعلام‌شده در `package.json#openclaw` را شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که شامل خواهند شد بررسی کنید.
- نقاط ورود تولیدشده را پیش از بسته‌بندی بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده شامل شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

آرتیفکت بسته‌بندی‌شده فراداده OpenClaw را که در بسته منبع شما وجود دارد ندارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده شامل‌شده را بررسی کنید.
- مطمئن شوید `package.json` بلوک `openclaw` را در آرتیفکت بسته‌بندی‌شده شامل می‌کند.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` شامل شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

مانیفست Plugin بومی نام نمایشی ندارد.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را قابل‌خواندن برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشینی حفظ کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح بالایی دارد که OpenClaw پشتیبانی نمی‌کند.

- هر فیلد سطح بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شده `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را
  به فراداده ایستای مالکیت قابلیت محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## SDK و مهاجرت سازگاری

### legacy-root-sdk-import

Plugin از بشکه SDK ریشه منسوخ‌شده ایمپورت می‌کند:
`openclaw/plugin-sdk`.

- ایمپورت‌های بشکه ریشه را با ایمپورت‌های زیرمسیر عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌کننده‌های ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن ایمپورت محدود، از [قراردادهای ایمپورت](/fa/plugins/building-plugins#import-conventions) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را ایمپورت می‌کند که برای Pluginهای باندل‌شده یا سازگاری
داخلی رزرو شده است.

- ایمپورت‌های SDK داخلی رزروشده OpenClaw را با زیرمسیرهای عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار SDK عمومی ندارد، کمک‌کننده را داخل بسته خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک ایمپورت پشتیبانی‌شده، از [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از کمک‌کننده منسوخ‌شده کل مخزن نشست
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست از `getSessionEntry(...)` یا `listSessionEntries(...)` استفاده کنید.
- هنگام نوشتن وضعیت نشست از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، جهش و ذخیره کل شیء مخزن نشست پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک کمک‌کننده نوشتن منسوخ‌شده برای کل مخزن نشست مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک ورودی نشست موجود، از `patchSessionEntry(...)` استفاده کنید.
- هنگام جایگزینی یا ایجاد یک ورودی نشست، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، جهش و ذخیره کل شیء مخزن نشست پرهیز کنید.
- کمک‌کننده‌های نوشتن کل مخزن را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از کمک‌کننده‌های منسوخ‌شده مسیر فایل نشست مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فراداده نشست بر اساس عامل و هویت نشست، از `getSessionEntry(...)` استفاده کنید.
- برای ماندگار کردن فراداده نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات رونوشت است، از هویت رونوشت یا کمک‌کننده‌های هدف استفاده کنید.
- مسیرهای فایل رونوشت قدیمی را ماندگار نکنید و به آن‌ها وابسته نشوید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از کمک‌کننده منسوخ‌شده هدف فایل رونوشت
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی نشست نیاز دارد، از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به یک هدف ساختاریافته برای عملیات رونوشت نیاز دارد، از `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساخت مستقیم هدف‌های فایل رونوشت قدیمی پرهیز کنید.
- کمک‌کننده قدیمی را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از کمک‌کننده‌های سطح پایین منسوخ‌شده رونوشت مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به رونوشت، از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی رونوشت، از `publishSessionTranscriptUpdateByIdentity(...)` استفاده کنید.
- سطح زمان اجرای ساختاریافته رونوشت را ترجیح دهید تا OpenClaw بتواند
  مرزهای تراکنش و مدیریت هویت درست را اعمال کند.
- کمک‌کننده‌های سطح پایین رونوشت را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از هوک قدیمی `before_agent_start` استفاده می‌کند.

- کارهای بازنویسی مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای جهش پرامپت یا زمینه را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [هوک‌ها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فراداده احراز هویت ارائه‌دهنده قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فراداده متغیرهای محیطی ارائه‌دهنده را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که بازه
  OpenClaw پشتیبانی‌شده شما همچنان به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فراداده قدیمی یا کهنه‌تر متغیرهای محیطی کانال بدون فراداده setup یا config فعلی
که ClawHub انتظار دارد استفاده می‌کند.

- فراداده متغیرهای محیطی کانال را اعلانی نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانال مبتنی بر متغیر محیطی را در setup فعلی، config کانال، یا
  فراداده کانال بسته که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر
  OpenClaw پشتیبانی‌شده هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته، `openclaw.security.json` را با ارجاع schemaای منتشر می‌کند که ClawHub
آن را به‌عنوان در دسترس نمی‌شناسد.

- اگر URL طرحواره فقط جنبه راهنما دارد، آن را حذف کنید.
- فقط پس از اینکه OpenClaw یک طرحواره نسخه‌دار منتشر کرد، از آن استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده منتشر می‌کند.

- تا زمانی که OpenClaw یک طرحواره مانیفست امنیت نسخه‌دار و رفتار ClawHub را مستند نکرده است،
  `openclaw.security.json` را حذف کنید.
- تا زمانی که قرارداد مانیفست وجود ندارد، رفتار حساس به امنیت را در مستندات عمومی بسته یا
  README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [ClawHub CLI](/fa/clawhub/cli)
- [انتشار ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورودی Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
