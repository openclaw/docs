---
read_when:
    - شما `clawhub package validate` را اجرا کردید و باید یافته‌های Plugin را رفع کنید
    - ClawHub انتشار بستهٔ plugin را رد کرد یا دربارهٔ آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بستهٔ Plugin در ClawHub را پیش از انتشار اصلاح کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-04T18:09:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# رفع‌های اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های روبه‌روی نویسنده را پوشش می‌دهد؛ یعنی یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، importهای SDK، یا artifact منتشرشده‌ی بسته‌ی خود رفع کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگهداری اسکنر بدون راهنمای اصلاح توسط نویسنده باشد، آن کدها برای نگهدارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر رفع، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های روبه‌روی نویسنده

| کد                                    | از اینجا شروع کنید                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [فراداده بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [بلوک openclaw بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [نقاط ورود بسته OpenClaw را اعلان کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [نقطه ورود اعلان‌شده را منتشر کنید](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [فراداده نصب را کامل کنید](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [سازگاری API Plugin را اعلان کنید](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [حداقل نسخه میزبان را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [نسخه‌های بسته و مانیفست را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [فراداده پشتیبانی‌نشده بسته OpenClaw را حذف کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [artifact npm را قابل بسته‌بندی کنید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [نقاط ورود را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [فراداده را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [نام نمایشی مانیفست را اضافه کنید](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [فیلدهای پشتیبانی‌نشده مانیفست را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [importهای ریشه SDK را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [importهای رزروشده SDK را حذف کنید](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [دسترسی به کل session-store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [نوشتن در کل session-store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [کمک‌کننده‌های مسیر فایل session را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [هدف‌های قدیمی فایل رونوشت را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [کمک‌کننده‌های سطح‌پایین رونوشت را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [env varهای ارائه‌دهنده را به فراداده setup منتقل کنید](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [env varهای کانال را در فراداده فعلی آینه کنید](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ارجاع‌های طرح‌واره مانیفست امنیتی دردسترس‌نبودنی را حذف کنید](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [فایل‌های مانیفست امنیتی پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه، نقاط ورود، یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته از مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلان نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته قرار است از طریق ClawHub منتشر یا نصب شود، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما نقطه ورود runtime OpenClaw را اعلان نمی‌کند.

- برای نقاط ورود Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw را اعلان می‌کند، اما فایل ارجاع‌شده در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب موجود است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API Plugin OpenClaw را که پشتیبانی می‌کند اعلان نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API Plugin OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw در بسته را بررسی کنید، مانند نسخه OpenClaw استفاده‌شده در زمان انتشار.
- حداقل نسخه میزبان را با بازه نسخه میزبانی که بسته واقعاً پشتیبانی می‌کند هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای مطابقت به‌روزرسانی کنید یا وقتی فراداده بسته مرجع است، فراداده نسخه مانیفست کهنه را حذف کنید.
- پس از تغییر فراداده منتشرشده، یک نسخه بسته جدید منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، setup و فراداده کاتالوگ را در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## artifact منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند در artifactای بسته‌بندی شود که ClawHub آن را بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های lifecycle خراب، یا ورودی‌های files را که باعث شکست بسته‌بندی می‌شوند رفع کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما artifact بسته‌بندی‌شده شامل فایل‌های نقطه ورودی که در `package.json#openclaw` اعلان شده‌اند نیست.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که گنجانده خواهند شد بررسی کنید.
- نقاط ورود تولیدشده را پیش از بسته‌بندی بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلان‌شده گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

artifact بسته‌بندی‌شده فاقد فراداده OpenClaw است که در بسته منبع شما وجود دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` شامل بلوک `openclaw` در artifact بسته‌بندی‌شده است.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسهٔ پایدار ماشینی حفظ کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح‌بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فرادادهٔ بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع contracts](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای contract پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را
  به فرادادهٔ ایستای مالکیت قابلیت محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشهٔ منسوخ‌شدهٔ SDK ایمپورت می‌کند:
`openclaw/plugin-sdk`.

- ایمپورت‌های root-barrel را با ایمپورت‌های subpath عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌کننده‌های entry کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن ایمپورت محدودتر، از [قراردادهای ایمپورت](/fa/plugins/building-plugins#import-conventions) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را ایمپورت می‌کند که برای Pluginهای bundled یا سازگاری داخلی
رزرو شده است.

- ایمپورت‌های SDK داخلی رزروشدهٔ OpenClaw را با subpathهای عمومی مستندشدهٔ
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر این رفتار SDK عمومی ندارد، helper را داخل بستهٔ خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک ایمپورت پشتیبانی‌شده، از [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از helper منسوخ‌شدهٔ whole-session-store یعنی
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت session، از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت session، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، جهش دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Runtime API](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک helper نوشتن منسوخ‌شدهٔ whole-session-store مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک entry موجود session، از `patchSessionEntry(...)`
  استفاده کنید.
- هنگام جایگزینی یا ایجاد یک entry session، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، جهش دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- helperهای نوشتن whole-store را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [Runtime API](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از helperهای منسوخ‌شدهٔ مسیر فایل session مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فرادادهٔ session بر اساس هویت agent و session، از `getSessionEntry(...)` استفاده کنید.
- برای پایدارسازی فرادادهٔ session، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات transcript است، از هویت transcript یا helperهای target
  استفاده کنید.
- مسیرهای فایل transcript قدیمی را پایدار نکنید و به آن‌ها وابسته نباشید.
- [Runtime API](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از helper منسوخ‌شدهٔ هدف فایل transcript یعنی
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی session نیاز دارد، از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به هدف ساختاریافتهٔ عملیات transcript نیاز دارد، از `resolveSessionTranscriptTarget(...)`
  استفاده کنید.
- از خواندن یا ساخت مستقیم targetهای فایل transcript قدیمی پرهیز کنید.
- helper قدیمی را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Runtime API](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از helperهای transcript سطح‌پایین منسوخ‌شده مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به transcript، از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی transcript، از `publishSessionTranscriptUpdateByIdentity(...)`
  استفاده کنید.
- سطح زمان اجرای ساختاریافتهٔ transcript را ترجیح دهید تا OpenClaw بتواند مرزهای تراکنش و مدیریت هویت درست را اعمال کند.
- helperهای transcript سطح‌پایین را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [Runtime API](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کار override مدل یا provider را به `before_model_resolve` منتقل کنید.
- کار جهش prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hooks](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فرادادهٔ قدیمی احراز هویت provider یعنی `providerAuthEnvVars` استفاده می‌کند.

- فرادادهٔ env-var مربوط به provider را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید، تا زمانی که بازهٔ پشتیبانی‌شدهٔ
  OpenClaw شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فرادادهٔ env-var قدیمی یا کهنه‌تر کانال بدون فرادادهٔ setup یا config فعلی مورد انتظار ClawHub استفاده می‌کند.

- فرادادهٔ env-var کانال را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری runtime کانال بررسی کند.
- setup کانال مبتنی بر env را در setup فعلی، config کانال، یا
  فرادادهٔ کانال package که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر پشتیبانی‌شدهٔ
  OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته `openclaw.security.json` را با یک ارجاع schema عرضه می‌کند که ClawHub
آن را به‌عنوان موجود نمی‌شناسد.

- اگر URL schema فقط advisory است، آن را حذف کنید.
- فقط پس از انتشار یک schema نسخه‌دار مستند توسط OpenClaw، از آن استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده عرضه می‌کند.

- `openclaw.security.json` را حذف کنید تا زمانی که OpenClaw یک schema نسخه‌دار مانیفست امنیت و
  رفتار ClawHub را مستند کند.
- تا زمانی که contract مانیفست وجود ندارد، رفتار حساس به امنیت را در مستندات عمومی بستهٔ خود یا
  README مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
